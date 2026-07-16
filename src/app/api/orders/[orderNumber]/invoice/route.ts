import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isValidOrderAccessToken } from "@/lib/order-access";
import { generateOrderInvoicePdf } from "@/lib/order-invoice-pdf";

export async function GET(request: Request, { params }: { params: Promise<{ orderNumber: string }> }) {
  const { orderNumber } = await params;
  const token = new URL(request.url).searchParams.get("token");
  if (!isValidOrderAccessToken(token)) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  const order = await prisma.order.findFirst({
    where: { orderNumber, accessToken: token },
    include: { items: true }
  });
  if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });

  const pdf = await generateOrderInvoicePdf(order);
  return new Response(Buffer.from(pdf.bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="Alektra-Order-${order.orderNumber}.pdf"`
    }
  });
}
