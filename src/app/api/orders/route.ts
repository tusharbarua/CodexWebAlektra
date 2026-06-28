import { NextResponse } from "next/server";
import { PaymentMethod, PaymentStatus, Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { initiateSslCommerz, sslCommerzEnabled } from "@/lib/sslcommerz";
import { sendOrderNotifications } from "@/lib/notifications";

const checkoutSchema = z.object({
  customerName: z.string().trim().min(2),
  customerEmail: z.string().trim().email().optional(),
  customerPhone: z.string().trim().min(7),
  companyName: z.string().trim().optional(),
  address: z.object({
    line1: z.string().trim().optional(),
    line2: z.string().trim().optional(),
    district: z.string().trim().optional(),
    city: z.string().trim().optional(),
    postalCode: z.string().trim().optional(),
    pickupAddress: z.string().trim().optional()
  }),
  deliveryMethod: z.enum(["COURIER", "PICKUP"]),
  deliveryNotes: z.string().trim().optional(),
  paymentMethod: z.nativeEnum(PaymentMethod),
  couponCode: z.string().trim().optional(),
  items: z.array(z.object({ productId: z.string(), quantity: z.number().int().positive() })).min(1)
});

export async function POST(request: Request) {
  try {
    const body = checkoutSchema.parse(await request.json());
    if (body.paymentMethod === PaymentMethod.SSLCOMMERZ && !sslCommerzEnabled()) {
      throw new Error("SSLCommerz credentials are not configured. Please choose cash on delivery.");
    }
    const verifiedOtp = await prisma.otpVerification.findFirst({
      where: { mobile: body.customerPhone, purpose: "checkout", verifiedAt: { not: null }, expiresAt: { gt: new Date() } },
      orderBy: { verifiedAt: "desc" }
    });
    if (!verifiedOtp) throw new Error("Verify your mobile number by OTP before confirming the order.");
    if (body.deliveryMethod === "COURIER") {
      if (!body.address.line1 || !body.address.district || !body.address.city) {
        throw new Error("Shipping address, district and city are required for courier delivery.");
      }
    }

    const productIdentifiers = body.items.map((item) => item.productId);
    const products = await prisma.product.findMany({
      where: { OR: [{ id: { in: productIdentifiers } }, { slug: { in: productIdentifiers } }, { sku: { in: productIdentifiers } }] }
    });

    const subtotal = body.items.reduce((sum, item) => {
      const product = products.find((candidate) => [candidate.id, candidate.slug, candidate.sku].includes(item.productId));
      if (!product) throw new Error("Product not found.");
      if (product.stockQuantity < item.quantity) throw new Error(`${product.name} is out of stock.`);
      return sum + Number(product.priceBdt) * item.quantity;
    }, 0);

    const coupon = body.couponCode
      ? await prisma.coupon.findUnique({ where: { code: body.couponCode.trim().toUpperCase() } })
      : null;
    if (body.couponCode) validateCoupon(coupon, subtotal);
    const discount = coupon ? Math.min(coupon.discountType === "PERCENT" ? subtotal * (Number(coupon.amount) / 100) : Number(coupon.amount), subtotal) : 0;
    const deliverySettings = await prisma.ecommerceDeliverySetting.findUnique({ where: { singletonKey: "default" } });
    const deliveryCharge = body.deliveryMethod === "COURIER"
      ? Math.max(Number(deliverySettings?.courierMinimumChargeBdt ?? 200), 200)
      : Number(deliverySettings?.pickupChargeBdt ?? 0);
    const deliveryLabel = body.deliveryMethod === "COURIER"
      ? "Delivery via courier"
      : `${deliverySettings?.pickupLabel ?? "Pick up from our warehouse"} at ${deliverySettings?.pickupAddress ?? "Khulshi, Chattogram"}`;
    const total = Math.max(subtotal - discount + deliveryCharge, 0);
    const orderNumber = await nextOrderNumber();

    const order = await prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          orderNumber,
          customerName: body.customerName,
          customerEmail: body.customerEmail || null,
          customerPhone: body.customerPhone,
          companyName: body.companyName || null,
          verifiedMobile: body.customerPhone,
          billingAddress: body.address,
          shippingAddress: body.deliveryMethod === "PICKUP" ? { pickupAddress: deliverySettings?.pickupAddress ?? "Khulshi, Chattogram" } : body.address,
          deliveryMethod: body.deliveryMethod,
          deliveryLabel,
          deliveryNotes: body.deliveryNotes || null,
          subtotalBdt: subtotal,
          discountBdt: discount,
          deliveryBdt: deliveryCharge,
          totalBdt: total,
          status: "NEW",
          paymentMethod: body.paymentMethod,
          paymentStatus: body.paymentMethod === PaymentMethod.CASH_ON_DELIVERY ? PaymentStatus.CASH_ON_DELIVERY : PaymentStatus.INITIATED,
          couponId: coupon?.id,
          items: {
            create: body.items.map((item) => {
              const product = products.find((candidate) => [candidate.id, candidate.slug, candidate.sku].includes(item.productId))!;
              return {
                productId: product.id,
                name: product.name,
                sku: product.sku,
                quantity: item.quantity,
                unitPriceBdt: product.priceBdt,
                lineTotalBdt: Number(product.priceBdt) * item.quantity
              };
            })
          }
        },
        include: { items: true }
      });

      for (const item of body.items) {
        const product = products.find((candidate) => [candidate.id, candidate.slug, candidate.sku].includes(item.productId))!;
        await tx.product.update({ where: { id: product.id }, data: { stockQuantity: { decrement: item.quantity } } });
      }
      if (coupon) await tx.coupon.update({ where: { id: coupon.id }, data: { usedCount: { increment: 1 } } });
      return created;
    });

    await sendOrderNotifications(order);
    if (body.paymentMethod === PaymentMethod.CASH_ON_DELIVERY) {
      return NextResponse.json({ ok: true, orderNumber: order.orderNumber, payment: "cod" });
    }

    const payment = await initiateSslCommerz(order);
    await prisma.paymentTransaction.create({
      data: {
        orderId: order.id,
        provider: "SSLCOMMERZ",
        transactionId: payment.transactionId,
        amountBdt: order.totalBdt,
        status: PaymentStatus.INITIATED,
        requestPayload: payment.payload as Prisma.InputJsonObject
      }
    });
    return NextResponse.json({ ok: true, orderNumber: order.orderNumber, redirectUrl: payment.redirectUrl });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Checkout failed." }, { status: 400 });
  }
}

function validateCoupon(coupon: Awaited<ReturnType<typeof prisma.coupon.findUnique>>, subtotal: number) {
  const now = new Date();
  if (!coupon || !coupon.isActive || (coupon.startsAt && coupon.startsAt > now) || (coupon.expiresAt && coupon.expiresAt < now) || (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit)) {
    throw new Error("Coupon is invalid or no longer available.");
  }
  if (coupon.minimumSpend && subtotal < Number(coupon.minimumSpend)) {
    throw new Error(`Coupon requires a minimum spend of BDT ${Number(coupon.minimumSpend).toLocaleString("en-BD")}.`);
  }
}

async function nextOrderNumber() {
  const year = new Date().getFullYear();
  const count = await prisma.order.count({ where: { orderNumber: { startsWith: `AR-SHOP-${year}-` } } });
  return `AR-SHOP-${year}-${String(count + 1).padStart(5, "0")}`;
}
