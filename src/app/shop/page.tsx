import type { Metadata } from "next";
import { PublishStatus } from "@prisma/client";
import { ProductCard } from "@/components/ProductCard";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Solar Shop",
  description: "Solar modules, inverters, mounting and monitoring products from Alektra Renewable."
};
export const dynamic = "force-dynamic";

export default async function ShopPage({ searchParams }: { searchParams: Promise<{ q?: string; category?: string; sort?: string }> }) {
  const params = await searchParams;
  const products = await prisma.product.findMany({
    where: {
      status: PublishStatus.PUBLISHED,
      category: params.category ? { slug: params.category } : undefined,
      OR: params.q ? [
        { name: { contains: params.q } },
        { sku: { contains: params.q } },
        { model: { contains: params.q } }
      ] : undefined
    },
    include: { category: true, images: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }] } },
    orderBy: params.sort === "price-asc" ? { priceBdt: "asc" } : params.sort === "price-desc" ? { priceBdt: "desc" } : [{ isFeatured: "desc" }, { createdAt: "desc" }]
  });
  const categories = await prisma.productCategory.findMany({ orderBy: { name: "asc" } });

  return (
    <main className="page-shell">
      <div className="container">
        <div className="toolbar">
          <div><p className="kicker">Alektra Shop</p><h1>Solar products and technical accessories.</h1></div>
          <form className="nav-actions">
            <input name="q" placeholder="Search SKU, model or product" defaultValue={params.q} className="toolbar-input" />
            <select name="category" defaultValue={params.category ?? ""} className="toolbar-input">
              <option value="">All categories</option>
              {categories.map((item) => <option value={item.slug} key={item.id}>{item.name}</option>)}
            </select>
            <select name="sort" defaultValue={params.sort ?? "featured"} className="toolbar-input">
              <option value="featured">Featured</option><option value="price-asc">Price low to high</option><option value="price-desc">Price high to low</option>
            </select>
            <button className="btn" type="submit">Filter</button>
          </form>
        </div>
        <div className="shop-grid">
          {products.map((product) => <ProductCard key={product.id} product={{
            name: product.name, slug: product.slug, sku: product.sku, category: product.category.name,
            price: Number(product.priceBdt), stock: product.stockQuantity,
            image: product.images[0]?.imagePath ?? fallbackImage, description: product.shortDescription
          }} />)}
        </div>
        {!products.length ? <div className="panel"><p>No products matched your filters.</p></div> : null}
      </div>
    </main>
  );
}

const fallbackImage = "https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&w=1200&q=80";
