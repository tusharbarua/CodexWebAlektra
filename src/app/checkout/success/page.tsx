import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, Download, ShoppingBag } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { money } from "@/lib/format";
import { isValidOrderAccessToken } from "@/lib/order-access";

export const dynamic = "force-dynamic";

export default async function CheckoutSuccessPage({ searchParams }: { searchParams: Promise<{ order?: string; token?: string }> }) {
  const params = await searchParams;
  if (!params.order || !isValidOrderAccessToken(params.token)) notFound();
  const order = await prisma.order.findFirst({
    where: { orderNumber: params.order, accessToken: params.token },
    include: { items: true }
  });
  if (!order) notFound();

  const invoiceUrl = `/api/orders/${encodeURIComponent(order.orderNumber)}/invoice?token=${encodeURIComponent(params.token ?? "")}`;

  return (
    <main className="order-success-page">
      <section className="container order-success-card">
        <div className="order-success-brand">
          <Image className="order-success-logo" src="/brand/alektra-renewable-logo.png" alt="Alektra Renewable" width={250} height={82} priority />
          <span className="order-success-icon" aria-hidden="true"><CheckCircle2 size={34} /></span>
        </div>
        <p className="order-success-kicker">Order Confirmed</p>
        <h1>Thank you for choosing Alektra Renewable.</h1>
        <p className="order-success-lede">Your order has been received successfully. Our team will review the submitted information and contact you if any additional technical, delivery or payment details are required.</p>

        <div className="order-success-summary" aria-label="Order summary">
          <strong>{order.orderNumber}</strong>
          <span>Order date: {order.createdAt.toLocaleDateString("en-GB")}</span>
          <span>Customer: {order.customerName}</span>
          <span>Total: {money(Number(order.totalBdt))}</span>
          <span>Status: {customerOrderStatus(order.status)}</span>
          <span>Payment: {formatStatus(order.paymentStatus)}</span>
        </div>

        <div className="order-success-note">
          <strong>What happens next?</strong>
          <p>Alektra may contact you to verify technical requirements, delivery information, stock availability, payment details or other necessary information before processing the order.</p>
        </div>

        <div className="order-success-items">
          <h2>Items in this order</h2>
          {order.items.map((item) => (
            <div className="order-success-item" key={item.id}>
              <span><strong>{item.name}</strong><small>{item.sku} x {item.quantity}</small></span>
              <b>{money(Number(item.lineTotalBdt))}</b>
            </div>
          ))}
        </div>

        <div className="order-success-actions">
          <a className="order-success-secondary" href={invoiceUrl}><Download size={18} /> Download PDF Invoice</a>
          <Link className="order-success-primary" href="/shop"><ShoppingBag size={18} /> Continue Shopping</Link>
        </div>
      </section>
    </main>
  );
}

function customerOrderStatus(value: string) {
  if (value === "NEW" || value === "PENDING") return "Confirmed";
  return formatStatus(value);
}

function formatStatus(value: string) {
  return value.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}
