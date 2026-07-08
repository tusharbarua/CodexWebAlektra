import { NextResponse } from "next/server";
import { PaymentMethod, PaymentStatus, Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { EMAIL_VALIDATION_MESSAGE, MOBILE_VALIDATION_MESSAGE, OTP_REQUIRED_MESSAGE, normalizeBangladeshMobile } from "@/lib/checkout-validation";
import { initiateSslCommerz, sslCommerzEnabled } from "@/lib/sslcommerz";
import { sendOrderNotifications } from "@/lib/notifications";
import { getCustomerSession, createEmailVerificationToken, createRawToken, hashCustomerPassword } from "@/lib/customer-auth";
import { sendCustomerAccountSetupEmail } from "@/lib/mail";

const optionalEmailSchema = z.preprocess(
  (value) => typeof value === "string" && !value.trim() ? undefined : value,
  z.string().trim().email(EMAIL_VALIDATION_MESSAGE).optional()
);

const checkoutSchema = z.object({
  customerName: z.string().trim().min(2),
  customerEmail: optionalEmailSchema,
  customerPhone: z.string().trim().min(1),
  companyName: z.string().trim().optional(),
  address: z.object({
    line1: z.string().trim().optional(),
    addressLine: z.string().trim().optional(),
    divisionId: z.string().trim().optional(),
    divisionName: z.string().trim().optional(),
    districtId: z.string().trim().optional(),
    districtName: z.string().trim().optional(),
    upazilaId: z.string().trim().optional(),
    upazilaName: z.string().trim().optional(),
    thanaName: z.string().trim().optional(),
    postOffice: z.string().trim().optional(),
    district: z.string().trim().optional(),
    city: z.string().trim().optional(),
    postalCode: z.string().trim().optional(),
    deliveryNotes: z.string().trim().optional(),
    pickupAddress: z.string().trim().optional(),
    manualAddressFallback: z.boolean().optional(),
    locationSource: z.string().trim().optional()
  }),
  deliveryMethod: z.enum(["COURIER", "PICKUP"]),
  deliveryNotes: z.string().trim().optional(),
  paymentMethod: z.nativeEnum(PaymentMethod),
  couponCode: z.string().trim().optional(),
  termsAccepted: z.boolean().optional(),
  saveAddress: z.boolean().optional(),
  createAccount: z.boolean().optional(),
  termsVersion: z.string().trim().optional(),
  refundPolicyVersion: z.string().trim().optional(),
  items: z.array(z.object({ productId: z.string(), quantity: z.number().int().positive() })).min(1)
});

class CheckoutValidationError extends Error {
  constructor(public fieldErrors: Record<string, string>, message = "Please fix the highlighted fields before placing your order.") {
    super(message);
  }
}

export async function POST(request: Request) {
  try {
    const parsed = checkoutSchema.parse(await request.json());
    const normalizedMobile = normalizeBangladeshMobile(parsed.customerPhone);
    if (!normalizedMobile) throw new CheckoutValidationError({ customerPhone: MOBILE_VALIDATION_MESSAGE });
    const body = { ...parsed, customerPhone: normalizedMobile };
    const customer = await getCustomerSession();
    if (!customer && body.createAccount && !body.customerEmail) {
      throw new CheckoutValidationError({ customerEmail: "Email address is required to create an account." });
    }
    if (body.paymentMethod === PaymentMethod.SSLCOMMERZ && !sslCommerzEnabled()) {
      throw new Error("SSLCommerz credentials are not configured. Please choose cash on delivery.");
    }
    const [checkoutSettings, terms, refund] = await Promise.all([
      prisma.ecommerceCheckoutSetting.findUnique({ where: { singletonKey: "default" } }).catch(() => null),
      prisma.shopLegalContent.findUnique({ where: { policyKey: "terms" } }).catch(() => null),
      prisma.shopLegalContent.findUnique({ where: { policyKey: "refund" } }).catch(() => null)
    ]);
    const otpRequired = checkoutSettings?.requireOtpVerification ?? false;
    const verifiedOtp = otpRequired
      ? await prisma.otpVerification.findFirst({
        where: { mobile: body.customerPhone, purpose: "checkout", verifiedAt: { not: null }, expiresAt: { gt: new Date() } },
        orderBy: { verifiedAt: "desc" }
      })
      : null;
    if (otpRequired && !verifiedOtp) throw new CheckoutValidationError({ otp: OTP_REQUIRED_MESSAGE });
    if (!body.termsAccepted) {
      throw new CheckoutValidationError({ termsAccepted: "Please accept the Shop Terms & Conditions and Refund Policy before placing your order." });
    }
    if (body.deliveryMethod === "COURIER") {
      validateCourierAddress(body.address);
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
    const orderAddress = normalizeOrderAddress(body.address, body.deliveryMethod);

    const orderResult = await prisma.$transaction(async (tx) => {
      let checkoutCustomerId = customer?.id ?? null;
      let setupCustomer: { id: string; email: string; fullName: string } | null = null;
      let existingVerifiedAccount = false;

      if (!customer && body.createAccount && body.customerEmail) {
        const email = body.customerEmail.toLowerCase();
        const existingCustomer = await tx.customer.findUnique({ where: { email } });
        if (existingCustomer?.emailVerified) {
          existingVerifiedAccount = true;
        } else if (existingCustomer) {
          const updated = await tx.customer.update({
            where: { id: existingCustomer.id },
            data: {
              fullName: body.customerName,
              mobileNumber: body.customerPhone,
              isActive: true
            },
            select: { id: true, email: true, fullName: true }
          });
          checkoutCustomerId = updated.id;
          setupCustomer = updated;
        } else {
          const createdCustomer = await tx.customer.create({
            data: {
              fullName: body.customerName,
              email,
              mobileNumber: body.customerPhone,
              passwordHash: await hashCustomerPassword(createRawToken()),
              emailVerified: false
            },
            select: { id: true, email: true, fullName: true }
          });
          checkoutCustomerId = createdCustomer.id;
          setupCustomer = createdCustomer;
        }
      }

      const created = await tx.order.create({
        data: {
          orderNumber,
          customerId: checkoutCustomerId,
          customerName: body.customerName,
          customerEmail: body.customerEmail || null,
          customerPhone: body.customerPhone,
          customerMobileNumber: body.customerPhone,
          companyName: body.companyName || null,
          verifiedMobile: verifiedOtp ? body.customerPhone : null,
          verifiedMobileNumber: verifiedOtp ? body.customerPhone : null,
          otpRequiredAtCheckout: otpRequired,
          otpVerified: Boolean(verifiedOtp),
          billingAddress: orderAddress,
          shippingAddress: orderAddress,
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
          termsAccepted: true,
          termsAcceptedAt: new Date(),
          termsVersion: terms?.version ?? body.termsVersion ?? "v1.0",
          refundPolicyVersion: refund?.version ?? body.refundPolicyVersion ?? "v1.0",
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
      const shouldSaveAddress = (customer?.id && body.saveAddress) || (!customer && body.createAccount && checkoutCustomerId && !existingVerifiedAccount);
      if (shouldSaveAddress && checkoutCustomerId && body.deliveryMethod === "COURIER") {
        const address = orderAddress as Record<string, string | boolean | undefined>;
        if (address.addressLine && address.divisionName && address.districtName && address.upazilaName) {
          const hasDefaultAddress = await tx.customerAddress.findFirst({
            where: { customerId: checkoutCustomerId, isDefault: true },
            select: { id: true }
          });
          await tx.customerAddress.create({
            data: {
              customerId: checkoutCustomerId,
              recipientName: body.customerName,
              mobileNumber: body.customerPhone,
              divisionId: typeof address.divisionId === "string" ? address.divisionId : null,
              divisionName: String(address.divisionName),
              districtId: typeof address.districtId === "string" ? address.districtId : null,
              districtName: String(address.districtName),
              upazilaId: typeof address.upazilaId === "string" ? address.upazilaId : null,
              upazilaName: String(address.upazilaName),
              addressLine: String(address.addressLine),
              postalCode: typeof address.postalCode === "string" ? address.postalCode : null,
              deliveryNotes: typeof address.deliveryNotes === "string" ? address.deliveryNotes : null,
              isDefault: !hasDefaultAddress
            }
          });
        }
      }
      return { order: created, setupCustomer, existingVerifiedAccount };
    });
    const order = orderResult.order;

    await sendOrderNotifications(order);
    if (orderResult.setupCustomer) {
      const setupToken = await createEmailVerificationToken(orderResult.setupCustomer.id);
      await sendCustomerAccountSetupEmail({
        email: orderResult.setupCustomer.email,
        fullName: orderResult.setupCustomer.fullName,
        token: setupToken,
        orderNumber: order.orderNumber
      }).catch(() => null);
    }
    if (body.paymentMethod === PaymentMethod.CASH_ON_DELIVERY) {
      return NextResponse.json({
        ok: true,
        orderNumber: order.orderNumber,
        payment: "cod",
        accountSetup: orderResult.setupCustomer ? "sent" : orderResult.existingVerifiedAccount ? "existing_account" : "none"
      });
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
    return NextResponse.json({
      ok: true,
      orderNumber: order.orderNumber,
      redirectUrl: payment.redirectUrl,
      accountSetup: orderResult.setupCustomer ? "sent" : orderResult.existingVerifiedAccount ? "existing_account" : "none"
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: "Please fix the highlighted fields before placing your order.",
        fieldErrors: checkoutFieldErrors(error)
      }, { status: 400 });
    }
    if (error instanceof CheckoutValidationError) {
      return NextResponse.json({ error: error.message, fieldErrors: error.fieldErrors }, { status: 400 });
    }
    return NextResponse.json({ error: error instanceof Error ? error.message : "Checkout failed." }, { status: 400 });
  }
}

function checkoutFieldErrors(error: z.ZodError) {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const field = issue.path[0]?.toString();
    if (!field) continue;
    if (field === "customerEmail") fieldErrors.customerEmail = EMAIL_VALIDATION_MESSAGE;
    else if (field === "customerPhone") fieldErrors.customerPhone = MOBILE_VALIDATION_MESSAGE;
    else if (field === "customerName") fieldErrors.customerName = "Please enter your full name.";
    else if (field === "items") fieldErrors.items = "Your cart is empty. Please add at least one product before checkout.";
    else if (field === "address") {
      const addressField = issue.path[1]?.toString();
      if (addressField === "addressLine" || addressField === "line1") fieldErrors.addressLine = "Please enter your detailed delivery address.";
      if (addressField === "divisionName" || addressField === "divisionId") fieldErrors.divisionId = "Please select your division.";
      if (addressField === "districtName" || addressField === "districtId" || addressField === "district") fieldErrors.districtId = "Please select your district.";
      if (addressField === "upazilaName" || addressField === "upazilaId" || addressField === "city") fieldErrors.upazilaId = "Please select your upazila/thana.";
    }
  }
  return fieldErrors;
}

function validateCourierAddress(address: z.infer<typeof checkoutSchema>["address"]) {
  const addressLine = address.addressLine || address.line1;
  const fieldErrors: Record<string, string> = {};
  if (!addressLine) fieldErrors.addressLine = "Please enter your detailed delivery address.";

  if (address.manualAddressFallback) {
    if (!address.divisionName) fieldErrors.manualDivision = "Please select your division.";
    if (!address.districtName && !address.district) fieldErrors.manualDistrict = "Please select your district.";
    if (!address.upazilaName && !address.city) fieldErrors.manualUpazila = "Please select your upazila/thana.";
  } else {
    if (!address.divisionId || !address.divisionName) fieldErrors.divisionId = "Please select your division.";
    if (!address.districtId || !address.districtName) fieldErrors.districtId = "Please select your district.";
    if (!address.upazilaId || !address.upazilaName) fieldErrors.upazilaId = "Please select your upazila/thana.";
  }

  if (Object.keys(fieldErrors).length) throw new CheckoutValidationError(fieldErrors);
}

function normalizeOrderAddress(address: z.infer<typeof checkoutSchema>["address"], deliveryMethod: "COURIER" | "PICKUP") {
  if (deliveryMethod === "PICKUP") return { pickupAddress: address.pickupAddress ?? "Khulshi, Chattogram", manualAddressFallback: false, locationSource: "warehouse-pickup" };
  return {
    ...address,
    locationSource: "bangladesh-geojson",
    line1: address.addressLine || address.line1 || "",
    district: address.districtName || address.district || "",
    city: address.upazilaName || address.city || ""
  };
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
