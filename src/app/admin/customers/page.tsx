import Link from "next/link";
import { resendCustomerVerification, toggleCustomerActive } from "@/app/admin/actions";
import { money } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminCustomersPage() {
  const customers = await prisma.customer.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      orders: {
        select: { id: true, orderNumber: true, totalBdt: true }
      },
      _count: { select: { addresses: true } }
    }
  });
  return (
    <div>
      <p className="kicker">Admin</p>
      <h1>Customers.</h1>
      <div className="panel admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Mobile</th>
              <th>Verified</th>
              <th>Orders</th>
              <th>Total value</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((customer) => {
              const total = customer.orders.reduce((sum, order) => sum + Number(order.totalBdt), 0);
              return (
                <tr key={customer.id}>
                  <td><strong>{customer.fullName}</strong><br /><small>{customer.isActive ? "Active" : "Disabled"} · {customer._count.addresses} address{customer._count.addresses === 1 ? "" : "es"}</small></td>
                  <td>{customer.email}</td>
                  <td>{customer.mobileNumber ?? "Not provided"}</td>
                  <td><span className={customer.emailVerified ? "status-pill success" : "status-pill muted"}>{customer.emailVerified ? "Verified" : "Pending"}</span></td>
                  <td>{customer.orders.length ? <Link href={`/admin/orders?customer=${customer.id}`}>{customer.orders.length}</Link> : "0"}</td>
                  <td>{money(total)}</td>
                  <td>{customer.createdAt.toLocaleDateString("en-GB")}</td>
                  <td>
                    <div className="admin-row-actions">
                      {!customer.emailVerified ? (
                        <form action={resendCustomerVerification}>
                          <input type="hidden" name="id" value={customer.id} />
                          <button className="btn secondary compact" type="submit">Resend email</button>
                        </form>
                      ) : null}
                      <form action={toggleCustomerActive}>
                        <input type="hidden" name="id" value={customer.id} />
                        <input type="hidden" name="isActive" value={customer.isActive ? "false" : "true"} />
                        <button className={customer.isActive ? "btn danger compact" : "btn secondary compact"} type="submit">{customer.isActive ? "Disable" : "Enable"}</button>
                      </form>
                    </div>
                  </td>
                </tr>
              );
            })}
            {!customers.length ? <tr><td colSpan={8}>No customer accounts yet.</td></tr> : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
