import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateThermalRequestPdf } from "@/lib/thermal-pdf";

export async function GET(_: Request, { params }: { params: Promise<{ requestNumber: string }> }) {
  const { requestNumber } = await params;
  const request = await prisma.thermalInspectionRequest.findUnique({ where: { requestNumber } });
  if (!request) return NextResponse.json({ error: "Request not found" }, { status: 404 });
  let bytes: Uint8Array;
  if (request.pdfFilePath && existsSync(request.pdfFilePath)) bytes = await readFile(request.pdfFilePath);
  else {
    const pdf = await generateThermalRequestPdf(request);
    bytes = pdf.bytes;
    await prisma.thermalInspectionRequest.update({ where: { id: request.id }, data: { pdfFilePath: pdf.filePath } });
  }
  return new Response(Buffer.from(bytes), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="${request.requestNumber}.pdf"` } });
}
