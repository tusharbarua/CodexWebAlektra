"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingBag } from "lucide-react";
import { useEffect, useState } from "react";
import { CART_UPDATED_EVENT, CartItem, cartSummary, readCart } from "@/lib/cart";
import { money } from "@/lib/format";

export function FloatingCartBar() {
  const pathname = usePathname();
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    const sync = () => setItems(readCart());
    sync();
    window.addEventListener(CART_UPDATED_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(CART_UPDATED_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  if (pathname.startsWith("/admin") || !items.length) return null;
  const summary = cartSummary(items);

  return (
    <div className="floating-cart-bar" role="status">
      <ShoppingBag size={18} />
      <strong>{summary.quantity} item{summary.quantity === 1 ? "" : "s"}</strong>
      <span>{money(summary.total)}</span>
      <Link href="/cart">View Cart</Link>
    </div>
  );
}
