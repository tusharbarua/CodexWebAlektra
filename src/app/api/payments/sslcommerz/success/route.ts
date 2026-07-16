import { NextResponse } from "next/server";
import { OrderStatus, PaymentStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { validateSslCommerz } from "@/lib/sslcommerz";
import { sendOrderConfirmation } from "@/lib/mail";

export async function POST(request: Request) {
  const form = await request.formData();
  const valId = String(form.get("val_id") ?? "");
  const tranId = String(form.get("tran_id") ?? "");
  const validation = valId ? await validateSslCommerz(valId) : {};

  const transaction = await prisma.paymentTransaction.update({
    where: { transactionId: tranId },
    data: {
      validationId: valId,
      status: PaymentStatus.PAID,
      responsePayload: validation as Prisma.InputJsonObject
    },
    include: { order: true }
  });

  const order = await prisma.order.update({
    where: { id: transaction.orderId },
    data: { paymentStatus: PaymentStatus.PAID, status: OrderStatus.CONFIRMED }
  });
  await sendOrderConfirmation(order);

  return NextResponse.redirect(new URL(`/checkout/success?order=${encodeURIComponent(order.orderNumber)}&token=${encodeURIComponent(order.accessToken ?? "")}`, request.url));
}
