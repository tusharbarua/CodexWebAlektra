"use client";

import { useEffect, useState } from "react";
import { CART_UPDATED_EVENT, cartSummary, readCart } from "@/lib/cart";

export function CartBadge() {
  const [quantity, setQuantity] = useState(0);

  useEffect(() => {
    const sync = () => setQuantity(cartSummary(readCart()).quantity);
    sync();
    window.addEventListener(CART_UPDATED_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(CART_UPDATED_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  if (!quantity) return null;
  return <span className="cart-count-badge" aria-label={`${quantity} cart items`}>{quantity}</span>;
}
