import { NextResponse } from "next/server";
import { auth, isAdminRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { money } from "@/lib/format";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!isAdminRole(session?.user.role)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const order = await prisma.order.findUnique({ where: { id }, include: { items: true } });
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  const html = `<!doctype html><html><head><title>${order.orderNumber}</title><style>body{font-family:Arial,sans-serif;margin:36px;color:#0f172a}h1{margin:0 0 8px}.muted{color:#64748b}table{width:100%;border-collapse:collapse;margin-top:24px}td,th{border-bottom:1px solid #e2e8f0;padding:10px;text-align:left}.total{font-size:20px;font-weight:800}</style></head><body><h1>Alektra Renewable Invoice</h1><p class="muted">${order.orderNumber} | ${order.createdAt.toLocaleDateString("en-GB")}</p><p><strong>${order.customerName}</strong><br>${order.customerPhone}<br>${order.customerEmail ?? ""}</p><p><strong>Delivery:</strong> ${order.deliveryLabel ?? order.deliveryMethod}</p><table><thead><tr><th>Item</th><th>SKU</th><th>Qty</th><th>Total</th></tr></thead><tbody>${order.items.map((item) => `<tr><td>${item.name}</td><td>${item.sku}</td><td>${item.quantity}</td><td>${money(Number(item.lineTotalBdt))}</td></tr>`).join("")}</tbody></table><p>Subtotal: ${money(Number(order.subtotalBdt))}<br>Delivery: ${money(Number(order.deliveryBdt))}</p><p class="total">Total: ${money(Number(order.totalBdt))}</p><script>window.print()</script></body></html>`;
  return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}
