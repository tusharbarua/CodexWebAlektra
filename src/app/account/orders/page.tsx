import Link from "next/link";

export default function AccountOrdersPage() {
  return (
    <main className="page-shell">
      <div className="container">
        <div className="section-heading">
          <div>
            <p className="kicker">Customer Account</p>
            <h1>Order history.</h1>
          </div>
          <p>Customer authentication is wired through NextAuth and Prisma. Once logged in, this page can query orders by user ID.</p>
        </div>
        <div className="panel">
          <p>Sign in to view invoices, order confirmations and delivery status.</p>
          <Link className="btn" href="/admin/login">Sign in</Link>
        </div>
      </div>
    </main>
  );
}
