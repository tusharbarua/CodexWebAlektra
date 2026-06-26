import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateSslCommerz } from "@/lib/sslcommerz";
import { generateThermalRequestPdf } from "@/lib/thermal-pdf";
import { sendThermalPaymentConfirmationEmail } from "@/lib/mail";

export async function POST(request: Request) {
  const form = await request.formData();
  const transactionId = String(form.get("tran_id") ?? "");
  const validationId = String(form.get("val_id") ?? "");
  const row = await prisma.thermalInspectionRequest.findFirst({ where: { sslTransactionId: transactionId } });
  if (!row) return NextResponse.redirect(new URL("/thermal", request.url));
  try {
    const validation = await validateSslCommerz(validationId);
    if (!["VALID", "VALIDATED"].includes(String(validation.status))) throw new Error("Invalid payment");
    let paidRequest = await prisma.thermalInspectionRequest.update({ where: { id: row.id }, data: { paymentStatus: "PAID", status: "PAID" } });
    const pdf = await generateThermalRequestPdf(paidRequest);
    paidRequest = await prisma.thermalInspectionRequest.update({ where: { id: row.id }, data: { pdfFilePath: pdf.filePath } });
    try {
      await sendThermalPaymentConfirmationEmail(paidRequest, pdf.bytes);
    } catch (error) {
      console.error("Thermal payment confirmation email could not be sent", error);
    }
  } catch {
    await prisma.thermalInspectionRequest.update({ where: { id: row.id }, data: { paymentStatus: "FAILED" } });
  }
  return NextResponse.redirect(new URL(`/thermal/inspection-request/success?request=${row.requestNumber}`, request.url));
}
