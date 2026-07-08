"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { CartItem, cartSummary, readCart, writeCart } from "@/lib/cart";
import { money } from "@/lib/format";

export function CartView() {
  const [items, setItems] = useState<CartItem[]>([]);
  const summary = useMemo(() => cartSummary(items), [items]);

  useEffect(() => {
    setItems(readCart());
  }, []);

  function persist(next: CartItem[]) {
    setItems(next);
    writeCart(next);
  }

  function updateQuantity(id: string, quantity: number) {
    persist(items.map((item) => item.id === id ? { ...item, quantity: Math.max(1, Math.min(item.stock ?? 9999, quantity)) } : item));
  }

  if (!items.length) {
    return (
      <div className="shop-empty-state cart-empty-state">
        <ShoppingBag size={38} />
        <h2>Your cart is ready for solar equipment.</h2>
        <p>Browse modules, inverters, batteries, cables and mounting accessories.</p>
        <Link className="empty-cart-browse-button" href="/shop">Browse products</Link>
      </div>
    );
  }

  return (
    <div className="cart-layout">
      <section className="panel cart-items-panel">
        {items.map((item) => (
          <article className="cart-line-item" key={item.id}>
            <img src={item.image} alt={item.name} />
            <div>
              <Link href={`/shop/${item.slug}`}><h3>{item.name}</h3></Link>
              <p>{item.sku}</p>
              <strong>{money(item.price)}</strong>
            </div>
            <div className="cart-qty-control">
              <button type="button" onClick={() => updateQuantity(item.id, item.quantity - 1)} aria-label={`Decrease ${item.name}`}><Minus size={14} /></button>
              <input value={item.quantity} inputMode="numeric" onChange={(event) => updateQuantity(item.id, Number(event.target.value) || 1)} aria-label={`Quantity for ${item.name}`} />
              <button type="button" onClick={() => updateQuantity(item.id, item.quantity + 1)} aria-label={`Increase ${item.name}`}><Plus size={14} /></button>
            </div>
            <strong>{money(item.price * item.quantity)}</strong>
            <button className="cart-remove-button" type="button" onClick={() => persist(items.filter((candidate) => candidate.id !== item.id))} aria-label={`Remove ${item.name}`}>
              <Trash2 size={17} />
            </button>
          </article>
        ))}
      </section>
      <aside className="panel cart-summary-panel">
        <h2>Cart summary</h2>
        <div className="checkout-total-row"><span>Items</span><strong>{summary.quantity}</strong></div>
        <div className="checkout-total-row grand"><span>Subtotal</span><strong>{money(summary.total)}</strong></div>
        <Link className="btn checkout-submit" href="/checkout">Checkout</Link>
        <Link className="btn secondary" href="/shop">Continue shopping</Link>
      </aside>
    </div>
  );
}
