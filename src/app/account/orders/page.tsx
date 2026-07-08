import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireCustomer } from "@/lib/customer-auth";
import { CustomerAccountShell } from "@/components/CustomerAccountShell";
import { money } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AccountOrdersPage() {
  const customer = await requireCustomer();
  const orders = await prisma.order.findMany({
    where: { customerId: customer.id },
    orderBy: { createdAt: "desc" }
  });
  return (
    <CustomerAccountShell customer={customer} title="Your orders." subtitle="Only orders linked to your verified customer email are shown here.">
      <section className="account-panel">
        {orders.length ? (
          <div className="account-table">
            {orders.map((order) => (
              <Link className="account-order-row" href={`/account/orders/${order.orderNumber}`} key={order.id}>
                <span><strong>{order.orderNumber}</strong><small>{order.createdAt.toLocaleDateString("en-GB")}</small></span>
                <span>{order.deliveryMethod}</span>
                <span>{order.status.replaceAll("_", " ")}</span>
                <span>{order.paymentStatus.replaceAll("_", " ")}</span>
                <strong>{money(Number(order.totalBdt))}</strong>
              </Link>
            ))}
          </div>
        ) : (
          <div className="account-empty">
            <p>No orders are linked to your account yet.</p>
            <Link className="account-primary-button" href="/shop">Browse products</Link>
          </div>
        )}
      </section>
    </CustomerAccountShell>
  );
}
