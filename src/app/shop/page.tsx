import type { Metadata } from "next";
import { ProductCard } from "@/components/ProductCard";
import { products } from "@/data/site";

export const metadata: Metadata = {
  title: "Solar Shop",
  description: "Solar modules, inverters, mounting and monitoring products from Alektra Renewable."
};

export default async function ShopPage({
  searchParams
}: {
  searchParams: Promise<{ q?: string; category?: string; sort?: string }>;
}) {
  const params = await searchParams;
  const q = (params.q ?? "").toLowerCase();
  const category = params.category ?? "All";
  const sorted = [...products]
    .filter((product) => (category === "All" ? true : product.category === category))
    .filter((product) => (q ? `${product.name} ${product.sku} ${product.model}`.toLowerCase().includes(q) : true))
    .sort((a, b) =>
      params.sort === "price-asc" ? a.price - b.price : params.sort === "price-desc" ? b.price - a.price : Number(b.featured) - Number(a.featured)
    );
  const categories = ["All", ...Array.from(new Set(products.map((product) => product.category)))];

  return (
    <main className="page-shell">
      <div className="container">
        <div className="toolbar">
          <div>
            <p className="kicker">Alektra Shop</p>
            <h1>Solar products and technical accessories.</h1>
          </div>
          <form className="nav-actions">
            <input name="q" placeholder="Search SKU, model or product" defaultValue={params.q} style={{ minHeight: 44, borderRadius: 999, border: "1px solid var(--line)", padding: "0 14px" }} />
            <select name="category" defaultValue={category} style={{ minHeight: 44, borderRadius: 999, border: "1px solid var(--line)", padding: "0 14px" }}>
              {categories.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
            <select name="sort" defaultValue={params.sort ?? "featured"} style={{ minHeight: 44, borderRadius: 999, border: "1px solid var(--line)", padding: "0 14px" }}>
              <option value="featured">Featured</option>
              <option value="price-asc">Price low to high</option>
              <option value="price-desc">Price high to low</option>
            </select>
            <button className="btn" type="submit">Filter</button>
          </form>
        </div>
        <div className="shop-grid">
          {sorted.map((product) => (
            <ProductCard product={product} key={product.slug} />
          ))}
        </div>
      </div>
    </main>
  );
}
