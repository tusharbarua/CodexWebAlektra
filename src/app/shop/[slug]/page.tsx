import Link from "next/link";
import { notFound } from "next/navigation";
import { Download } from "lucide-react";
import { AddToCartButton } from "@/components/AddToCartButton";
import { ProductCard } from "@/components/ProductCard";
import { products } from "@/data/site";
import { money } from "@/lib/format";

export function generateStaticParams() {
  return products.map((product) => ({ slug: product.slug }));
}

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = products.find((item) => item.slug === slug);
  if (!product) notFound();
  const related = products.filter((item) => item.category === product.category && item.slug !== product.slug).slice(0, 3);

  return (
    <main className="page-shell">
      <div className="container">
        <div className="intro-grid">
          <div className="visual-band" style={{ backgroundImage: `linear-gradient(180deg, rgba(0,92,45,.08), rgba(7,20,17,.28)), url(${product.image})` }} />
          <div className="panel">
            <p className="kicker">{product.category}</p>
            <h1>{product.name}</h1>
            <p>{product.description}</p>
            <div className="price-row">
              <span className="price">{money(product.price)}</span>
              <span className="stock">{product.stock} in stock · SKU {product.sku}</span>
            </div>
            <p>
              <strong>Model:</strong> {product.model}
            </p>
            <p>{product.technical}</p>
            <div className="pill-row">
              {product.specs.map((spec) => (
                <span className="pill" style={{ color: "var(--ink)", borderColor: "var(--line)", background: "var(--soft)" }} key={spec}>
                  {spec}
                </span>
              ))}
            </div>
            <div className="hero-actions">
              <AddToCartButton product={{ id: product.slug, slug: product.slug, name: product.name, price: product.price, image: product.image, sku: product.sku }} />
              <a className="btn secondary" href="mailto:info@alektraepc.com?subject=Datasheet request">
                <Download size={18} />
                Datasheet/manual
              </a>
            </div>
          </div>
        </div>
        {related.length ? (
          <section className="section tight">
            <div className="section-heading">
              <h2>Related products</h2>
              <p>Products from the same category.</p>
            </div>
            <div className="shop-grid">
              {related.map((item) => (
                <ProductCard product={item} key={item.slug} />
              ))}
            </div>
          </section>
        ) : null}
        <p>
          <Link className="btn secondary" href="/shop">Back to shop</Link>
        </p>
      </div>
    </main>
  );
}
