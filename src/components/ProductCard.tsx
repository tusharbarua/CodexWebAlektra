import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { money } from "@/lib/format";

type ProductCardProps = {
  product: {
    name: string;
    slug: string;
    sku: string;
    category: string;
    price: number;
    stock: number;
    image: string;
    description: string;
  };
};

export function ProductCard({ product }: ProductCardProps) {
  return (
    <article className="card product-card">
      <Link href={`/shop/${product.slug}`} aria-label={product.name}>
        <div className="card-media" style={{ backgroundImage: `url(${product.image})` }} />
      </Link>
      <div className="card-body">
        <small>{product.category} · {product.sku}</small>
        <h3>{product.name}</h3>
        <p>{product.description}</p>
        <div className="price-row">
          <span className="price">{money(product.price)}</span>
          <span className="stock">{product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}</span>
        </div>
        <Link className="btn" href={`/shop/${product.slug}`} style={{ marginTop: 16, width: "100%" }}>
          <ShoppingBag size={18} />
          View product
        </Link>
      </div>
    </article>
  );
}
