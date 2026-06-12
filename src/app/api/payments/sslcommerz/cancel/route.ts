import { NextResponse } from "next/server";
import { PaymentStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const form = await request.formData();
  const tranId = String(form.get("tran_id") ?? "");
  if (tranId) {
    await prisma.paymentTransaction.update({
      where: { transactionId: tranId },
      data: { status: PaymentStatus.CANCELLED, responsePayload: Object.fromEntries([...form.entries()].map(([key, value]) => [key, String(value)])) }
    });
  }
  return NextResponse.redirect(new URL("/checkout/cancelled", request.url));
}
