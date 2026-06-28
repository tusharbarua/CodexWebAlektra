import { OrderStatus, PaymentStatus } from "@prisma/client";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { money } from "@/lib/format";
import { resendOrderNotifications, updateOrderStatus } from "@/app/admin/actions";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; view?: string }> }) {
  const params = await searchParams;
  const where = {
    status: params.status ? params.status as OrderStatus : undefined,
    OR: params.q ? [
      { orderNumber: { contains: params.q } },
      { customerPhone: { contains: params.q } },
      { customerName: { contains: params.q } }
    ] : undefined
  };
  const [orders, current] = await Promise.all([
    prisma.order.findMany({ where, include: { items: true }, orderBy: { createdAt: "desc" } }).catch(() => []),
    params.view ? prisma.order.findUnique({ where: { id: params.view }, include: { items: true, notifications: { orderBy: { createdAt: "desc" } } } }) : null
  ]);

  return (
    <div>
      <p className="kicker">Orders</p>
      <h1>Order management.</h1>
      <div className="toolbar">
        <form className="inline-form">
          <input name="q" placeholder="Search order, mobile or customer" defaultValue={params.q ?? ""} />
          <select name="status" defaultValue={params.status ?? ""}><option value="">All statuses</option>{Object.values(OrderStatus).map((status) => <option key={status}>{status}</option>)}</select>
          <button className="btn compact">Filter</button>
        </form>
        <Link className="btn secondary compact" href="/api/admin/orders/export">Export CSV</Link>
      </div>

      {current ? <section className="panel admin-order-detail">
        <div className="toolbar"><div><h2>{current.orderNumber}</h2><p>{current.customerName} | {current.customerPhone} | {money(Number(current.totalBdt))}</p></div><a className="btn secondary compact" href="/admin/orders">Close</a></div>
        <div className="admin-two-column">
          <div>
            <h3>Customer and delivery</h3>
            <p><strong>Mobile:</strong> {current.verifiedMobile ?? current.customerPhone}<br/><strong>Email:</strong> {current.customerEmail ?? "Not provided"}<br/><strong>Company:</strong> {current.companyName ?? "Not provided"}<br/><strong>Delivery:</strong> {current.deliveryLabel ?? current.deliveryMethod}<br/><strong>Notes:</strong> {current.deliveryNotes ?? "None"}</p>
            <pre className="admin-json-box">{JSON.stringify(current.shippingAddress, null, 2)}</pre>
            <h3>Items</h3>
            {current.items.map((item) => <p key={item.id}>{item.name} ({item.sku}) x {item.quantity} - {money(Number(item.lineTotalBdt))}</p>)}
          </div>
          <form action={updateOrderStatus} className="admin-form">
            <input type="hidden" name="id" value={current.id} />
            <label className="field"><span>Order status</span><select name="status" defaultValue={current.status}>{Object.values(OrderStatus).map((status) => <option key={status}>{status}</option>)}</select></label>
            <label className="field"><span>Payment status</span><select name="paymentStatus" defaultValue={current.paymentStatus}>{Object.values(PaymentStatus).map((status) => <option key={status}>{status}</option>)}</select></label>
            <div className="checkout-total-row"><span>Subtotal</span><strong>{money(Number(current.subtotalBdt))}</strong></div>
            <div className="checkout-total-row"><span>Delivery</span><strong>{money(Number(current.deliveryBdt))}</strong></div>
            <div className="checkout-total-row grand"><span>Total</span><strong>{money(Number(current.totalBdt))}</strong></div>
            <button className="btn">Save order</button>
          </form>
          <div className="admin-form-actions">
            <a className="btn secondary" href={`/api/admin/orders/${current.id}/invoice`} target="_blank">Print invoice</a>
            <form action={resendOrderNotifications}><input type="hidden" name="id" value={current.id} /><button className="btn secondary" type="submit">Resend SMS/email</button></form>
          </div>
        </div>
        <h3>Notifications</h3>
        <p>SMS: {current.smsStatus} | Email: {current.emailStatus}</p>
        {current.notifications.map((notification) => <p key={notification.id}><strong>{notification.channel}</strong> {notification.status} to {notification.recipient}<br/><small>{notification.message}</small></p>)}
      </section> : null}

      <div className="admin-table-wrap"><table className="table">
        <thead><tr><th>Order</th><th>Customer</th><th>Delivery</th><th>Total</th><th>Payment</th><th>Status</th><th></th></tr></thead>
        <tbody>{orders.map((order) => (
          <tr key={order.id}>
            <td>{order.orderNumber}<br/><small>{order.createdAt.toLocaleDateString()}</small></td>
            <td>{order.customerName}<br/><small>{order.customerPhone}</small></td>
            <td>{order.deliveryMethod}<br/><small>{order.deliveryLabel}</small></td>
            <td>{money(Number(order.totalBdt))}</td>
            <td>{order.paymentStatus}</td>
            <td>{order.status}</td>
            <td><a className="btn secondary compact" href={`/admin/orders?view=${order.id}${params.q ? `&q=${params.q}` : ""}${params.status ? `&status=${params.status}` : ""}`}>Open</a></td>
          </tr>
        ))}</tbody>
      </table></div>
    </div>
  );
}
