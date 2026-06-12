"use client";

import { useState } from "react";
import { ShoppingCart } from "lucide-react";

type CartProduct = {
  id: string;
  slug: string;
  name: string;
  price: number;
  image: string;
  sku: string;
};

export function AddToCartButton({ product }: { product: CartProduct }) {
  const [added, setAdded] = useState(false);

  function add() {
    const current = JSON.parse(localStorage.getItem("alektra-cart") ?? "[]") as Array<CartProduct & { quantity: number }>;
    const existing = current.find((item) => item.id === product.id);
    const next = existing
      ? current.map((item) => (item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item))
      : [...current, { ...product, quantity: 1 }];
    localStorage.setItem("alektra-cart", JSON.stringify(next));
    setAdded(true);
  }

  return (
    <button className="btn" type="button" onClick={add}>
      <ShoppingCart size={18} />
      {added ? "Added" : "Add to cart"}
    </button>
  );
}
