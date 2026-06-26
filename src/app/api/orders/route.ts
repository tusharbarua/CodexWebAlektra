import { NextResponse } from "next/server";
import { PaymentMethod, PaymentStatus, Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { initiateSslCommerz, sslCommerzEnabled } from "@/lib/sslcommerz";
import { sendOrderConfirmation } from "@/lib/mail";

const checkoutSchema = z.object({
  customerName: z.string().min(2),
  customerEmail: z.string().email(),
  customerPhone: z.string().min(7),
  address: z.object({
    line1: z.string().min(4),
    city: z.string().min(2),
    zone: z.string().min(2)
  }),
  paymentMethod: z.nativeEnum(PaymentMethod),
  couponCode: z.string().optional(),
  items: z.array(z.object({ productId: z.string(), quantity: z.number().int().positive() })).min(1),
  notes: z.string().optional()
});

export async function POST(request: Request) {
  try {
    const body = checkoutSchema.parse(await request.json());
    if (body.paymentMethod === PaymentMethod.SSLCOMMERZ && !sslCommerzEnabled()) {
      throw new Error("SSLCommerz credentials are not configured. Please choose cash on delivery.");
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
  if (body.couponCode) {
    const now = new Date();
    if (
      !coupon ||
      !coupon.isActive ||
      (coupon.startsAt && coupon.startsAt > now) ||
      (coupon.expiresAt && coupon.expiresAt < now) ||
      (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit)
    ) {
      throw new Error("Coupon is invalid or no longer available.");
    }
    if (coupon.minimumSpend && subtotal < Number(coupon.minimumSpend)) {
      throw new Error(`Coupon requires a minimum spend of BDT ${Number(coupon.minimumSpend).toLocaleString("en-BD")}.`);
    }
  }
  const calculatedDiscount = coupon
    ? coupon.discountType === "PERCENT"
      ? subtotal * (Number(coupon.amount) / 100)
      : Number(coupon.amount)
    : 0;
  const discount = Math.min(calculatedDiscount, subtotal);
  const delivery = await prisma.deliveryCharge.findFirst({ where: { zone: body.address.zone, isActive: true } });
  const deliveryCharge =
    delivery && (!delivery.freeAboveBdt || subtotal - discount < Number(delivery.freeAboveBdt))
      ? Number(delivery.chargeBdt)
      : 0;
  const total = Math.max(subtotal - discount + deliveryCharge, 0);
  const orderNumber = `AL-${Date.now().toString(36).toUpperCase()}`;

  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        orderNumber,
        customerName: body.customerName,
        customerEmail: body.customerEmail,
        customerPhone: body.customerPhone,
        billingAddress: body.address,
        shippingAddress: body.address,
        subtotalBdt: subtotal,
        discountBdt: discount,
        deliveryBdt: deliveryCharge,
        totalBdt: total,
        paymentMethod: body.paymentMethod,
        paymentStatus: body.paymentMethod === PaymentMethod.CASH_ON_DELIVERY ? PaymentStatus.UNPAID : PaymentStatus.INITIATED,
        couponId: coupon?.id,
        notes: body.notes,
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
      }
    });

    for (const item of body.items) {
      const product = products.find((candidate) => [candidate.id, candidate.slug, candidate.sku].includes(item.productId))!;
      await tx.product.update({
        where: { id: product.id },
        data: { stockQuantity: { decrement: item.quantity } }
      });
    }

    if (coupon) await tx.coupon.update({ where: { id: coupon.id }, data: { usedCount: { increment: 1 } } });
    return created;
  });

  if (body.paymentMethod === PaymentMethod.CASH_ON_DELIVERY) {
    await sendOrderConfirmation(order);
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
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Checkout failed." },
      { status: 400 }
    );
  }
}
