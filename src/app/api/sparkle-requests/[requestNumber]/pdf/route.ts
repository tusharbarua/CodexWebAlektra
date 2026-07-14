import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateSparkleRequestPdf } from "@/lib/service-request-pdf";

export async function GET(_: Request, { params }: { params: Promise<{ requestNumber: string }> }) {
  const { requestNumber } = await params;
  const request = await prisma.sparkleServiceRequest.findUnique({ where: { requestNumber } });
  if (!request) return NextResponse.json({ error: "Request not found." }, { status: 404 });

  const pdf = await generateSparkleRequestPdf(request);
  return new Response(Buffer.from(pdf.bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="alektra-sparkle-service-request-${request.requestNumber}.pdf"`
    }
  });
}
