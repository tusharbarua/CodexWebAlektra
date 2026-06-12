import Link from "next/link";

export default function CheckoutCancelledPage() {
  return (
    <main className="page-shell">
      <div className="container panel">
        <p className="kicker">Payment Cancelled</p>
        <h1>Your payment was cancelled.</h1>
        <Link className="btn" href="/checkout">Back to checkout</Link>
      </div>
    </main>
  );
}
