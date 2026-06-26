import { prisma } from "@/lib/prisma";
import { money } from "@/lib/format";
import { updateOrderStatus } from "@/app/admin/actions";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  const orders = await prisma.order.findMany({ include: { items: true }, orderBy: { createdAt: "desc" } }).catch(() => []);

  return (
    <div>
      <p className="kicker">Orders</p>
      <h1>Order management.</h1>
      <table className="table">
        <thead>
          <tr>
            <th>Order</th>
            <th>Customer</th>
            <th>Total</th>
            <th>Payment</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id}>
              <td>{order.orderNumber}</td>
              <td>{order.customerName}<br /><small>{order.customerEmail}</small></td>
              <td>{money(Number(order.totalBdt))}</td>
              <td>{order.paymentMethod} · {order.paymentStatus}</td>
              <td><form action={updateOrderStatus} className="inline-form"><input type="hidden" name="id" value={order.id}/><select name="status" defaultValue={order.status}><option>PENDING</option><option>CONFIRMED</option><option>PROCESSING</option><option>SHIPPED</option><option>COMPLETED</option><option>CANCELLED</option><option>REFUNDED</option></select><button className="btn compact">Save</button></form></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
