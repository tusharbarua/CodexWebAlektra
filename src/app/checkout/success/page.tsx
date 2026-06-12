import Link from "next/link";

export default async function CheckoutSuccessPage({ searchParams }: { searchParams: Promise<{ order?: string }> }) {
  const params = await searchParams;
  return (
    <main className="page-shell">
      <div className="container panel">
        <p className="kicker">Order Confirmed</p>
        <h1>Thank you.</h1>
        <p>{params.order ? `Order ${params.order} has been received.` : "Your order has been received."}</p>
        <Link className="btn" href="/shop">Continue shopping</Link>
      </div>
    </main>
  );
}
