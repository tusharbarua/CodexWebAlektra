import { NextResponse } from "next/server";
import { auth, isAdminRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!isAdminRole(session?.user.role)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const rows = await prisma.order.findMany({ include: { items: true }, orderBy: { createdAt: "desc" } });
  const header = ["Order Number", "Created", "Customer", "Mobile", "Email", "Delivery Method", "Delivery Charge", "Subtotal", "Total", "Order Status", "Payment Status", "SMS Status", "Email Status"];
  const csv = [header, ...rows.map((row) => [
    row.orderNumber,
    row.createdAt.toISOString(),
    row.customerName,
    row.customerPhone,
    row.customerEmail ?? "",
    row.deliveryMethod,
    row.deliveryBdt,
    row.subtotalBdt,
    row.totalBdt,
    row.status,
    row.paymentStatus,
    row.smsStatus,
    row.emailStatus
  ])].map((values) => values.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(",")).join("\r\n");
  return new Response(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="alektra-orders.csv"' } });
}
