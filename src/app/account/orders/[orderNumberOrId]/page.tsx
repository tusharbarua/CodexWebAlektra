import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireCustomer } from "@/lib/customer-auth";
import { CustomerAccountShell } from "@/components/CustomerAccountShell";
import { money } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AccountOrderDetailPage({
  params
}: {
  params: Promise<{ orderNumberOrId: string }>;
}) {
  const customer = await requireCustomer();
  const { orderNumberOrId } = await params;
  const order = await prisma.order.findFirst({
    where: {
      customerId: customer.id,
      OR: [{ id: orderNumberOrId }, { orderNumber: orderNumberOrId }]
    },
    include: { items: true }
  });
  if (!order) notFound();
  const address = addressText(order.shippingAddress);
  return (
    <CustomerAccountShell customer={customer} title={order.orderNumber} subtitle="Order details and current status.">
      <section className="account-panel">
        <div className="account-detail-grid">
          <div><span>Status</span><strong>{order.status.replaceAll("_", " ")}</strong></div>
          <div><span>Payment</span><strong>{order.paymentStatus.replaceAll("_", " ")}</strong></div>
          <div><span>Delivery</span><strong>{order.deliveryLabel ?? order.deliveryMethod}</strong></div>
          <div><span>Total</span><strong>{money(Number(order.totalBdt))}</strong></div>
        </div>
        <h2>Items</h2>
        <div className="account-line-items">
          {order.items.map((item) => (
            <div className="account-line-item" key={item.id}>
              <span><strong>{item.name}</strong><small>{item.sku} x {item.quantity}</small></span>
              <span>{money(Number(item.unitPriceBdt))}</span>
              <strong>{money(Number(item.lineTotalBdt))}</strong>
            </div>
          ))}
        </div>
        <div className="account-total-box">
          <p><span>Subtotal</span><strong>{money(Number(order.subtotalBdt))}</strong></p>
          <p><span>Delivery charge</span><strong>{money(Number(order.deliveryBdt))}</strong></p>
          <p><span>Total</span><strong>{money(Number(order.totalBdt))}</strong></p>
        </div>
      </section>
      <section className="account-panel">
        <h2>Delivery / Pickup information</h2>
        <p className="account-address-text">{address || "Address information is not available."}</p>
        {["UNPAID", "PENDING", "INITIATED", "CASH_ON_DELIVERY"].includes(order.paymentStatus) ? (
          <div className="account-payment-note">
            <strong>Payment instruction</strong>
            <p>If payment is pending, follow the bank/payment instruction in your order confirmation email and mention your order number clearly.</p>
          </div>
        ) : null}
        <Link className="account-secondary-button" href="/account/orders">Back to orders</Link>
      </section>
    </CustomerAccountShell>
  );
}

function addressText(value: unknown) {
  const address = value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
  if (address.pickupAddress) return `Pickup from: ${String(address.pickupAddress)}`;
  return [
    address.addressLine || address.line1,
    [address.upazilaName || address.city || address.thanaName, address.districtName || address.district, address.divisionName].filter(Boolean).join(", "),
    address.postOffice || address.postalCode ? `Post office / postal code: ${[address.postOffice, address.postalCode].filter(Boolean).join(" - ")}` : "",
    address.deliveryNotes ? `Notes: ${address.deliveryNotes}` : ""
  ].filter(Boolean).map(String).join("\n");
}
