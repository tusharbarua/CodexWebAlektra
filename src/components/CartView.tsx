"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Trash2 } from "lucide-react";
import { money } from "@/lib/format";

type CartItem = {
  id: string;
  slug: string;
  name: string;
  price: number;
  image: string;
  sku: string;
  quantity: number;
};

export function CartView() {
  const [items, setItems] = useState<CartItem[]>([]);
  const subtotal = useMemo(() => items.reduce((sum, item) => sum + item.price * item.quantity, 0), [items]);

  useEffect(() => {
    setItems(JSON.parse(localStorage.getItem("alektra-cart") ?? "[]"));
  }, []);

  function persist(next: CartItem[]) {
    setItems(next);
    localStorage.setItem("alektra-cart", JSON.stringify(next));
  }

  if (!items.length) {
    return (
      <div className="panel">
        <p>Your cart is empty.</p>
        <Link className="btn" href="/shop">Browse products</Link>
      </div>
    );
  }

  return (
    <div className="panel">
      <table className="table">
        <thead>
          <tr>
            <th>Product</th>
            <th>Qty</th>
            <th>Total</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td>
                <strong>{item.name}</strong>
                <br />
                <small>{item.sku}</small>
              </td>
              <td>
                <input
                  aria-label={`Quantity for ${item.name}`}
                  type="number"
                  min={1}
                  value={item.quantity}
                  onChange={(event) =>
                    persist(items.map((candidate) => (candidate.id === item.id ? { ...candidate, quantity: Number(event.target.value) } : candidate)))
                  }
                  style={{ width: 86, padding: 10, border: "1px solid var(--line)", borderRadius: 8 }}
                />
              </td>
              <td>{money(item.price * item.quantity)}</td>
              <td>
                <button className="btn secondary" type="button" onClick={() => persist(items.filter((candidate) => candidate.id !== item.id))} aria-label={`Remove ${item.name}`}>
                  <Trash2 size={18} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="price-row">
        <strong>Subtotal</strong>
        <span className="price">{money(subtotal)}</span>
      </div>
      <Link className="btn" href="/checkout" style={{ marginTop: 18 }}>Checkout</Link>
    </div>
  );
}
