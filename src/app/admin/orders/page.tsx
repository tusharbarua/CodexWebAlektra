import { prisma } from "@/lib/prisma";
import { money } from "@/lib/format";

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
              <td>{order.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
