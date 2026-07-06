import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function CheckoutSuccessPage({ searchParams }: { searchParams: Promise<{ order?: string }> }) {
  const params = await searchParams;
  const order = params.order
    ? await prisma.order.findUnique({ where: { orderNumber: params.order } }).catch(() => null)
    : null;
  return (
    <main className="page-shell">
      <div className="container panel">
        <p className="kicker">Order Confirmed</p>
        <h1>Thank you.</h1>
        <p>{params.order ? `Order ${params.order} has been received.` : "Your order has been received."}</p>
        {order?.customerEmail ? (
          <p>{order.emailStatus === "SENT" ? "An order confirmation email with payment instructions has been sent to your email." : "Your order was saved. Email confirmation will be sent when email service is available."}</p>
        ) : (
          <p>No email address was provided. Alektra can confirm by SMS/WhatsApp later if configured.</p>
        )}
        <div className="shop-legal-links">
          <Link href="/shop/terms">Shop Terms & Conditions</Link>
          <span>·</span>
          <Link href="/shop/refund-policy">Refund Policy</Link>
        </div>
        <Link className="btn" href="/shop">Continue shopping</Link>
      </div>
    </main>
  );
}
