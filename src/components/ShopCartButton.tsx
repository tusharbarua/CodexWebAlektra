"use client";

import { ShoppingBag } from "lucide-react";
import { CartBadge } from "@/components/CartBadge";
import { openCartDrawer } from "@/lib/cart";

export function ShopCartButton() {
  return (
    <button className="shop-toolbar-cart" type="button" onClick={openCartDrawer} aria-label="Open cart">
      <ShoppingBag size={17} />
      <span>Cart</span>
      <CartBadge />
    </button>
  );
}
