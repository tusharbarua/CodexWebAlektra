import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { initiateThermalPayment } from "@/lib/sslcommerz";

export async function POST(request: Request, { params }: { params: Promise<{ requestNumber: string }> }) {
  const { requestNumber } = await params;
  const row = await prisma.thermalInspectionRequest.findUnique({ where: { requestNumber } });
  if (!row?.askForPayment || !row.calculatedFeeBdt) return NextResponse.redirect(new URL(`/thermal/inspection-request/success?request=${requestNumber}`, request.url));
  try {
    const payment = await initiateThermalPayment({
      requestNumber, amountBdt: Number(row.calculatedFeeBdt), customerName: row.institutionName,
      customerEmail: row.email, customerPhone: row.contactNumber, address: row.address
    });
    await prisma.thermalInspectionRequest.update({ where: { id: row.id }, data: { sslTransactionId: payment.transactionId, paymentStatus: "INITIATED", status: "AWAITING_PAYMENT" } });
    return NextResponse.redirect(payment.redirectUrl);
  } catch {
    return NextResponse.redirect(new URL(`/thermal/inspection-request/success?request=${requestNumber}`, request.url));
  }
}
