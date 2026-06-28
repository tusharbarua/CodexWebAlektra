"use client";

import { useState } from "react";
import { ShoppingCart } from "lucide-react";
import { addCartItem } from "@/lib/cart";

type CartProduct = {
  id: string;
  slug: string;
  name: string;
  price: number;
  image: string;
  sku: string;
  stock?: number;
};

export function AddToCartButton({ product, quantity = 1, compact = false, disabled = false }: { product: CartProduct; quantity?: number; compact?: boolean; disabled?: boolean }) {
  const [added, setAdded] = useState(false);

  function add() {
    addCartItem(product, quantity);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1600);
  }

  return (
    <button className={`btn add-cart-button${compact ? " compact" : ""}`} type="button" onClick={add} disabled={disabled || product.stock === 0}>
      <ShoppingCart size={18} />
      {product.stock === 0 ? "Out of stock" : added ? "Added to cart" : "Add to Cart"}
    </button>
  );
}
