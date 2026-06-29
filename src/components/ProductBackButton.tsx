"use client";

import { ArrowLeft } from "lucide-react";

export function ProductBackButton() {
  return (
    <button
      className="product-back-button"
      type="button"
      onClick={() => {
        if (window.history.length > 1) window.history.back();
        else window.location.href = "/shop";
      }}
    >
      <ArrowLeft size={15} />
      Back to Shop
    </button>
  );
}
