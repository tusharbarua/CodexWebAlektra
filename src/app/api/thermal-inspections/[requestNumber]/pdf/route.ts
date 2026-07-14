import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateThermalRequestPdf } from "@/lib/thermal-pdf";

export async function GET(_: Request, { params }: { params: Promise<{ requestNumber: string }> }) {
  const { requestNumber } = await params;
  const request = await prisma.thermalInspectionRequest.findUnique({ where: { requestNumber } });
  if (!request) return NextResponse.json({ error: "Request not found" }, { status: 404 });
  const pdf = await generateThermalRequestPdf(request);
  await prisma.thermalInspectionRequest.update({ where: { id: request.id }, data: { pdfFilePath: pdf.filePath } });
  return new Response(Buffer.from(pdf.bytes), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="${request.requestNumber}.pdf"` } });
}
