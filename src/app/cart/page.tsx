import { CartView } from "@/components/CartView";

export default function CartPage() {
  return (
    <main className="page-shell">
      <div className="container">
        <p className="kicker">Cart</p>
        <h1>Review your solar products.</h1>
        <CartView />
      </div>
    </main>
  );
}
