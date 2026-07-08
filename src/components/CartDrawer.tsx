"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { CART_OPEN_EVENT, CART_UPDATED_EVENT, CartItem, cartSummary, readCart, writeCart } from "@/lib/cart";
import { money } from "@/lib/format";

export function CartDrawer() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<CartItem[]>([]);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  const summary = useMemo(() => cartSummary(items), [items]);

  useEffect(() => {
    const sync = () => setItems(readCart());
    const openDrawer = () => {
      sync();
      setOpen(true);
    };
    sync();
    window.addEventListener(CART_UPDATED_EVENT, sync);
    window.addEventListener("storage", sync);
    window.addEventListener(CART_OPEN_EVENT, openDrawer);
    return () => {
      window.removeEventListener(CART_UPDATED_EVENT, sync);
      window.removeEventListener("storage", sync);
      window.removeEventListener(CART_OPEN_EVENT, openDrawer);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  function persist(next: CartItem[]) {
    setItems(next);
    writeCart(next);
  }

  function updateQuantity(id: string, quantity: number) {
    persist(items.map((item) => item.id === id ? { ...item, quantity: Math.max(1, Math.min(item.stock ?? 9999, quantity)) } : item));
  }

  return (
    <>
      <div className={`cart-drawer-overlay${open ? " open" : ""}`} onClick={() => setOpen(false)} />
      <aside className={`cart-drawer${open ? " open" : ""}`} aria-hidden={!open} aria-label="Shopping cart">
        <header className="cart-drawer-header">
          <div><span>Cart</span><strong>{summary.quantity} item{summary.quantity === 1 ? "" : "s"}</strong></div>
          <button type="button" onClick={() => setOpen(false)} aria-label="Close cart"><X size={20} /></button>
        </header>

        <div className="cart-drawer-body">
          {items.length ? items.map((item) => (
            <article className="cart-drawer-item" key={item.id}>
              <Image
                src={failedImages[item.id] ? fallbackProductImage : item.image}
                alt={item.name}
                width={72}
                height={72}
                sizes="72px"
                unoptimized={(failedImages[item.id] ? fallbackProductImage : item.image).endsWith(".svg")}
                onError={() => setFailedImages((current) => ({ ...current, [item.id]: true }))}
              />
              <div className="cart-drawer-item-main">
                <Link href={`/shop/${item.slug}`} onClick={() => setOpen(false)}>{item.name}</Link>
                <small>{item.sku}</small>
                <span>{money(item.price)} each</span>
                <div className="cart-drawer-qty">
                  <button type="button" onClick={() => updateQuantity(item.id, item.quantity - 1)} aria-label={`Decrease ${item.name}`}><Minus size={13} /></button>
                  <input value={item.quantity} onChange={(event) => updateQuantity(item.id, Number(event.target.value) || 1)} aria-label={`Quantity for ${item.name}`} />
                  <button type="button" onClick={() => updateQuantity(item.id, item.quantity + 1)} aria-label={`Increase ${item.name}`}><Plus size={13} /></button>
                </div>
              </div>
              <div className="cart-drawer-line-total">
                <strong>{money(item.price * item.quantity)}</strong>
                <button type="button" onClick={() => persist(items.filter((candidate) => candidate.id !== item.id))} aria-label={`Remove ${item.name}`}><Trash2 size={15} /></button>
              </div>
            </article>
          )) : (
            <div className="cart-drawer-empty">
              <ShoppingBag size={34} />
              <h3>Your cart is empty</h3>
              <p>Add solar products and review them here without leaving the shop.</p>
              <Link className="empty-cart-browse-button" href="/shop" onClick={() => setOpen(false)}>Browse products</Link>
            </div>
          )}
        </div>

        <footer className="cart-drawer-footer">
          <p>Delivery estimate calculated at checkout.</p>
          <div><span>Subtotal</span><strong>{money(summary.total)}</strong></div>
          <Link className={items.length ? "" : "disabled"} href={items.length ? "/checkout" : "#"} onClick={() => { if (items.length) setOpen(false); }}>
            Checkout
          </Link>
        </footer>
      </aside>
    </>
  );
}

const fallbackProductImage = "/uploads/products/seed-solar-module.svg";
