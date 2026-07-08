import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireCustomer } from "@/lib/customer-auth";
import { CustomerAccountShell } from "@/components/CustomerAccountShell";
import { CustomerWelcomeToast } from "@/components/CustomerWelcomeToast";
import { money } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function CustomerAccountPage({
  searchParams
}: {
  searchParams: Promise<{ welcome?: string }>;
}) {
  const customer = await requireCustomer();
  const params = await searchParams;
  const [orders, addresses] = await Promise.all([
    prisma.order.findMany({
      where: { customerId: customer.id },
      orderBy: { createdAt: "desc" },
      take: 4
    }),
    prisma.customerAddress.findMany({
      where: { customerId: customer.id },
      orderBy: [{ isDefault: "desc" }, { updatedAt: "desc" }],
      take: 3
    })
  ]);
  return (
    <CustomerAccountShell customer={customer} title={`Welcome, ${customer.fullName}.`} subtitle="Track your Alektra shop orders, delivery addresses, and profile information.">
      {params.welcome === "1" ? <CustomerWelcomeToast name={customer.fullName} /> : null}
      <div className="account-overview-grid">
        <section className="account-glass-card">
          <span>Recent orders</span>
          <strong>{orders.length}</strong>
          <p>{orders[0] ? `Latest: ${orders[0].orderNumber}` : "No linked orders yet."}</p>
          <Link href="/account/orders">View orders</Link>
        </section>
        <section className="account-glass-card">
          <span>Saved addresses</span>
          <strong>{addresses.length}</strong>
          <p>{addresses[0] ? addresses[0].districtName : "Save an address for faster checkout."}</p>
          <Link href="/account/addresses">Manage addresses</Link>
        </section>
        <section className="account-glass-card">
          <span>Profile</span>
          <strong>{customer.emailVerified ? "Verified" : "Pending"}</strong>
          <p>{customer.email}</p>
          <Link href="/account/profile">Edit profile</Link>
        </section>
      </div>
      <section className="account-panel">
        <div className="account-section-title">
          <h2>Recent orders</h2>
          <Link href="/shop">Continue shopping</Link>
        </div>
        {orders.length ? (
          <div className="account-table">
            {orders.map((order) => (
              <Link className="account-order-row" href={`/account/orders/${order.orderNumber}`} key={order.id}>
                <span><strong>{order.orderNumber}</strong><small>{order.createdAt.toLocaleDateString("en-GB")}</small></span>
                <span>{order.status.replaceAll("_", " ")}</span>
                <span>{order.paymentStatus.replaceAll("_", " ")}</span>
                <strong>{money(Number(order.totalBdt))}</strong>
              </Link>
            ))}
          </div>
        ) : <p className="account-empty">Verified guest orders with this email will appear here automatically.</p>}
      </section>
    </CustomerAccountShell>
  );
}
