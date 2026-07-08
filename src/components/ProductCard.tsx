import Link from "next/link";
import Image from "next/image";
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
  const savePercent = hasDiscount ? Math.round(((product.compareAtPrice! - product.price) / product.compareAtPrice!) * 100) : 0;
  return (
    <article className="shop-product-card">
      <Link className="shop-product-image" href={`/shop/${product.slug}`} aria-label={product.name}>
        <div className="shop-product-image-wrap">
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(min-width: 1536px) 18vw, (min-width: 1024px) 23vw, (min-width: 640px) 32vw, 48vw"
            unoptimized={product.image.endsWith(".svg")}
          />
          {hasDiscount && savePercent > 0 ? <span className="shop-discount-badge">Save {savePercent}%</span> : null}
        </div>
      </Link>
      <div className="shop-product-content">
        <div className="shop-product-meta">
          <span className="shop-category-badge">{product.category}</span>
          {product.featured ? <span className="featured-badge"><Sparkles size={11} />Featured</span> : null}
        </div>
        <Link className="shop-product-title" href={`/shop/${product.slug}`}><h3>{product.name}</h3></Link>
        <p className="shop-model-line">{product.model || product.sku} {product.brand ? `| ${product.brand}` : ""}</p>
        <div className="shop-price-row">
          <div className="shop-price-stack">
            <strong className="shop-current-price">{money(product.price)}</strong>
            {hasDiscount ? <small className="shop-old-price">{money(product.compareAtPrice!)}</small> : null}
          </div>
        </div>
        <div className="shop-stock-row">
          <span className={product.stock > 0 ? "stock-badge shop-stock-badge in-stock" : "stock-badge shop-stock-badge out-stock"}>{product.stock > 0 ? "In Stock" : "Out of Stock"}</span>
        </div>
      </div>
      <div className="shop-card-actions shop-product-actions">
        <AddToCartButton product={cartProduct} compact disabled={product.stock <= 0} />
        <Link className="quick-view-link shop-eye-button" href={`/shop/${product.slug}`} aria-label={`View ${product.name}`}>
          <Eye size={17} />
        </Link>
      </div>
    </article>
  );
}
