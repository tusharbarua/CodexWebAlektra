/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { Eye, Sparkles } from "lucide-react";
import { AddToCartButton } from "@/components/AddToCartButton";
import { money } from "@/lib/format";

type ProductCardProps = {
  product: {
    name: string;
    slug: string;
    sku: string;
    id?: string;
    model?: string;
    brand?: string;
    featured?: boolean;
    compareAtPrice?: number | null;
    category: string;
    price: number;
    stock: number;
    image: string;
    description: string;
  };
};

export function ProductCard({ product }: ProductCardProps) {
  const cartProduct = {
    id: product.id ?? product.slug,
    slug: product.slug,
    name: product.name,
    price: product.price,
    image: product.image,
    sku: product.sku,
    stock: product.stock
  };
  const hasDiscount = product.compareAtPrice && product.compareAtPrice > product.price;
  return (
    <article className="shop-product-card">
      <Link className="shop-product-image" href={`/shop/${product.slug}`} aria-label={product.name}>
        <div>
          <img src={product.image} alt={product.name} />
        </div>
      </Link>
      <div className="shop-product-content">
        <div className="shop-card-badges">
          <span>{product.category}</span>
          {product.featured ? <span className="featured-badge"><Sparkles size={11} />Featured</span> : null}
          {hasDiscount ? <span className="discount-badge">Discount</span> : null}
        </div>
        <Link href={`/shop/${product.slug}`}><h3>{product.name}</h3></Link>
        <p className="shop-model-line">{product.model || product.sku} {product.brand ? `| ${product.brand}` : ""}</p>
        <p className="shop-spec-line">{product.description}</p>
        <div className="shop-price-row">
          <div>
            <strong>{money(product.price)}</strong>
            {hasDiscount ? <small>{money(product.compareAtPrice!)}</small> : null}
          </div>
          <span className={product.stock > 0 ? "stock-badge in-stock" : "stock-badge out-stock"}>{product.stock > 0 ? "In Stock" : "Out of Stock"}</span>
        </div>
        <div className="shop-card-actions">
          <AddToCartButton product={cartProduct} compact disabled={product.stock <= 0} />
          <Link className="quick-view-link" href={`/shop/${product.slug}`} aria-label={`View ${product.name}`}>
            <Eye size={17} />
          </Link>
        </div>
      </div>
    </article>
  );
}
