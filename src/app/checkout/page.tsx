import { CheckoutForm } from "@/components/CheckoutForm";

export default function CheckoutPage() {
  return (
    <main className="page-shell">
      <div className="container">
        <p className="kicker">Checkout</p>
        <h1>Confirm delivery and payment.</h1>
        <CheckoutForm />
      </div>
    </main>
  );
}
