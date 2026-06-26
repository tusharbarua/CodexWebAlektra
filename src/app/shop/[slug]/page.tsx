import Link from "next/link";
import { notFound } from "next/navigation";
import { Download } from "lucide-react";
import { PublishStatus } from "@prisma/client";
import { AddToCartButton } from "@/components/AddToCartButton";
import { ProductCard } from "@/components/ProductCard";
import { ProductGallery } from "@/components/ProductGallery";
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
    take: 3
  });
  const specs = Object.entries(product.specifications as Record<string, string>);
  const galleryImages = product.images.length
    ? product.images.map((image) => ({ id: image.id, imagePath: image.imagePath, altText: image.altText }))
    : [{ id: "fallback", imagePath: fallbackImage, altText: product.name }];
  const image = galleryImages[0].imagePath;

  return (
    <main className="page-shell">
      <div className="container">
        <div className="intro-grid">
          <ProductGallery images={galleryImages} productName={product.name} />
          <div className="panel">
            <p className="kicker">{product.category.name}</p><h1>{product.name}</h1><p>{product.shortDescription}</p>
            <div className="price-row"><span className="price">{money(Number(product.priceBdt))}</span><span className="stock">{product.stockQuantity > 0 ? `${product.stockQuantity} in stock` : "Out of stock"} | SKU {product.sku}</span></div>
            <p><strong>Model:</strong> {product.model}</p><p>{product.technicalDescription}</p>
            <div className="pill-row">{specs.map(([key, value]) => <span className="pill light-pill" key={key}>{key}: {String(value)}</span>)}</div>
            <div className="hero-actions">
              <AddToCartButton product={{ id: product.slug, slug: product.slug, name: product.name, price: Number(product.priceBdt), image, sku: product.sku }} />
              {(product.datasheetUrl || product.manualUrl) ? <a className="btn secondary" href={product.datasheetUrl ?? product.manualUrl!} target="_blank" rel="noreferrer"><Download size={18} />Datasheet/manual</a> : null}
            </div>
          </div>
        </div>
        {related.length ? <section className="section tight"><div className="section-heading"><h2>Related products</h2><p>More equipment from this category.</p></div><div className="shop-grid">
          {related.map((item) => <ProductCard key={item.id} product={{ name: item.name, slug: item.slug, sku: item.sku, category: item.category.name, price: Number(item.priceBdt), stock: item.stockQuantity, image: item.images[0]?.imagePath ?? fallbackImage, description: item.shortDescription }} />)}
        </div></section> : null}
        <p><Link className="btn secondary" href="/shop">Back to shop</Link></p>
      </div>
    </main>
  );
}

const fallbackImage = "https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&w=1200&q=80";
