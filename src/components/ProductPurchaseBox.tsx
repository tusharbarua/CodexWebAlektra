"use client";

import { useState } from "react";
import { AddToCartButton } from "@/components/AddToCartButton";

type ProductPurchaseBoxProps = {
  product: {
    id: string;
    slug: string;
    name: string;
    price: number;
    image: string;
    sku: string;
    stock?: number;
  };
};

export function ProductPurchaseBox({ product }: ProductPurchaseBoxProps) {
  const [quantity, setQuantity] = useState(1);
  const max = product.stock ?? 9999;
  return (
    <div className="product-purchase-box">
      <label className="field"><span>Quantity</span><input type="number" min={1} max={max} value={quantity} onChange={(event) => setQuantity(Math.max(1, Math.min(max, Number(event.target.value) || 1)))} /></label>
      <AddToCartButton product={product} quantity={quantity} disabled={max <= 0} openDrawerOnAdd />
    </div>
  );
}
