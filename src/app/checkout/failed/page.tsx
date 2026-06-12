import Link from "next/link";

export default function CheckoutFailedPage() {
  return (
    <main className="page-shell">
      <div className="container panel">
        <p className="kicker">Payment Failed</p>
        <h1>The payment was not completed.</h1>
        <p>Your order payment can be retried or changed to cash on delivery by contacting Alektra.</p>
        <Link className="btn" href="/checkout">Back to checkout</Link>
      </div>
    </main>
  );
}
