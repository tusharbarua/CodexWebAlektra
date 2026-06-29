import Link from "next/link";
import { notFound } from "next/navigation";
import { Download, ShieldCheck, Truck, Wrench } from "lucide-react";
import { PublishStatus } from "@prisma/client";
import { ProductBackButton } from "@/components/ProductBackButton";
import { ProductCard } from "@/components/ProductCard";
import { ProductGallery } from "@/components/ProductGallery";
import { ProductPurchaseBox } from "@/components/ProductPurchaseBox";
import { money } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await prisma.product.findFirst({
    where: { slug, status: PublishStatus.PUBLISHED },
    include: { category: true, images: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }] } }
  });
  if (!product) notFound();
  const related = await prisma.product.findMany({
    where: { categoryId: product.categoryId, status: PublishStatus.PUBLISHED, id: { not: product.id } },
    include: { category: true, images: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }] } },
    take: 4
  });
  const specs = Object.entries(product.specifications as Record<string, string>);
  const keyFeatures = Array.isArray(product.keyFeatures) ? product.keyFeatures.filter((item): item is string => typeof item === "string" && item.trim().length > 0) : [];
  const galleryImages = product.images.length
    ? product.images.map((image) => ({ id: image.id, imagePath: image.imagePath, altText: image.altText }))
    : [{ id: "fallback", imagePath: fallbackImage, altText: product.name }];
  const image = galleryImages[0].imagePath;
  const downloadUrl = product.datasheetUrl || product.manualUrl;

  return (
    <main className="product-detail-page">
      <div className="shop-container">
        <div className="product-detail-nav">
          <ProductBackButton />
          <nav className="product-breadcrumb" aria-label="Breadcrumb">
            <Link href="/">Home</Link><span>/</span><Link href="/shop">Shop</Link><span>/</span><Link href={`/shop?category=${product.category.slug}`}>{product.category.name}</Link><span>/</span><strong>{product.name}</strong>
          </nav>
        </div>

        <section className="product-detail-shell">
          <ProductGallery images={galleryImages} productName={product.name} />
          <div className="product-detail-panel">
            <div className="product-detail-badges">
              <span>{product.category.name}</span>
              <span className={product.stockQuantity > 0 ? "in-stock" : "out-stock"}>{product.stockQuantity > 0 ? "In Stock" : "Out of Stock"}</span>
            </div>
            <h1 className="product-detail-title">{product.name}</h1>
            <p className="product-detail-meta">SKU {product.sku} | Model {product.model} | {product.brand}</p>
            <div className="product-detail-price-row">
              <strong>{money(Number(product.priceBdt))}</strong>
              {product.compareAtPriceBdt ? <span>{money(Number(product.compareAtPriceBdt))}</span> : null}
            </div>
            <p className="product-short-description">{product.shortDescription || "Product details will be updated soon."}</p>

            {specs.length ? <div className="product-key-specs">{specs.slice(0, 4).map(([key, value]) => <span key={key}><strong>{key}</strong>{String(value)}</span>)}</div> : null}

            <ProductPurchaseBox product={{ id: product.id, slug: product.slug, name: product.name, price: Number(product.priceBdt), image, sku: product.sku, stock: product.stockQuantity }} />

            <div className="product-service-notes">
              <p><Truck size={15} /> Delivery charge is calculated at checkout.</p>
              {product.warrantyNote ? <p><ShieldCheck size={15} /> {product.warrantyNote}</p> : null}
              {product.supportNote ? <p><Wrench size={15} /> {product.supportNote}</p> : null}
            </div>
          </div>
        </section>

        <section className="product-info-grid">
          <article>
            <h2>Description</h2>
            <p>{product.technicalDescription || "Product details will be updated soon."}</p>
            {keyFeatures.length ? <ul>{keyFeatures.map((feature) => <li key={feature}>{feature}</li>)}</ul> : null}
          </article>
          <article>
            <h2>Specifications</h2>
            {specs.length ? <dl>{specs.map(([key, value]) => <div key={key}><dt>{key}</dt><dd>{String(value)}</dd></div>)}</dl> : <p>Product specifications will be updated soon.</p>}
          </article>
          {downloadUrl ? <article>
            <h2>Downloads</h2>
            <a className="product-download-button" href={downloadUrl} target="_blank" rel="noreferrer"><Download size={16} /> Download Specification PDF</a>
          </article> : null}
        </section>

        {related.length ? <section className="related-products-section">
          <div className="related-products-heading">
            <h2 className="related-products-title">Related products</h2>
            <Link href={`/shop?category=${product.category.slug}`}>View category</Link>
          </div>
          <div className="related-products-grid">
            {related.map((item) => <ProductCard key={item.id} product={{ id: item.id, name: item.name, slug: item.slug, sku: item.sku, model: item.model, brand: item.brand, featured: item.isFeatured, compareAtPrice: item.compareAtPriceBdt ? Number(item.compareAtPriceBdt) : null, category: item.category.name, price: Number(item.priceBdt), stock: item.stockQuantity, image: item.images[0]?.imagePath ?? fallbackImage, description: item.shortDescription }} />)}
          </div>
        </section> : null}
      </div>
    </main>
  );
}

const fallbackImage = "https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&w=1200&q=80";
