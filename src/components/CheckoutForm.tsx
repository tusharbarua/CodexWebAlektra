"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { CreditCard } from "lucide-react";
import { money } from "@/lib/format";

type CartItem = { id: string; name: string; price: number; quantity: number };

export function CheckoutForm() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [message, setMessage] = useState("");
  const subtotal = useMemo(() => items.reduce((sum, item) => sum + item.price * item.quantity, 0), [items]);

  useEffect(() => {
    setItems(JSON.parse(localStorage.getItem("alektra-cart") ?? "[]"));
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("Processing order...");
    const form = new FormData(event.currentTarget);
    const payload = {
      customerName: form.get("customerName"),
      customerEmail: form.get("customerEmail"),
      customerPhone: form.get("customerPhone"),
      couponCode: form.get("couponCode") || undefined,
      paymentMethod: form.get("paymentMethod"),
      address: {
        line1: form.get("line1"),
        city: form.get("city"),
        zone: form.get("zone")
      },
      items: items.map((item) => ({ productId: item.id, quantity: item.quantity }))
    };
    const response = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (data.redirectUrl) {
      localStorage.removeItem("alektra-cart");
      window.location.href = data.redirectUrl;
      return;
    }
    if (response.ok) {
      localStorage.removeItem("alektra-cart");
      setMessage(`Order ${data.orderNumber} received.`);
    } else {
      setMessage(data.error ?? "Order could not be placed.");
    }
  }

  return (
    <div className="intro-grid">
      <form className="panel form-grid" onSubmit={submit}>
        <div className="field">
          <label htmlFor="customerName">Name</label>
          <input id="customerName" name="customerName" required />
        </div>
        <div className="field">
          <label htmlFor="customerEmail">Email</label>
          <input id="customerEmail" name="customerEmail" type="email" required />
        </div>
        <div className="field">
          <label htmlFor="customerPhone">Phone</label>
          <input id="customerPhone" name="customerPhone" required />
        </div>
        <div className="field">
          <label htmlFor="couponCode">Coupon</label>
          <input id="couponCode" name="couponCode" placeholder="SOLAR5" />
        </div>
        <div className="field wide">
          <label htmlFor="line1">Address</label>
          <input id="line1" name="line1" required />
        </div>
        <div className="field">
          <label htmlFor="city">City</label>
          <input id="city" name="city" required />
        </div>
        <div className="field">
          <label htmlFor="zone">Delivery zone</label>
          <select id="zone" name="zone">
            <option>Dhaka Metro</option>
            <option>Outside Dhaka</option>
          </select>
        </div>
        <div className="field wide">
          <label htmlFor="paymentMethod">Payment</label>
          <select id="paymentMethod" name="paymentMethod">
            <option value="SSLCOMMERZ">SSLCommerz</option>
            <option value="CASH_ON_DELIVERY">Cash on delivery</option>
          </select>
        </div>
        <button className="btn wide" type="submit" disabled={!items.length}>
          <CreditCard size={18} />
          Place order
        </button>
        {message ? <p className="wide">{message}</p> : null}
      </form>
      <aside className="panel">
        <h2>Order summary</h2>
        {items.map((item) => (
          <p key={item.id}>
            {item.name} x {item.quantity}
            <br />
            <strong>{money(item.price * item.quantity)}</strong>
          </p>
        ))}
        <div className="price-row">
          <strong>Subtotal</strong>
          <span className="price">{money(subtotal)}</span>
        </div>
      </aside>
    </div>
  );
}
