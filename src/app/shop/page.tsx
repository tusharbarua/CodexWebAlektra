import type { Metadata } from "next";
import Link from "next/link";
import { Battery, Cable, ChevronDown, CircuitBoard, Grid3X3, Layers3, PackageSearch, SlidersHorizontal, Sparkles, SunMedium, Zap } from "lucide-react";
import { Prisma, PublishStatus } from "@prisma/client";
import { ProductCard } from "@/components/ProductCard";
import { ShopCartButton } from "@/components/ShopCartButton";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Solar Shop",
  description: "Solar modules, inverters, batteries, cables and mounting equipment from Alektra Renewable."
};
export const dynamic = "force-dynamic";

type ShopParams = {
  q?: string;
  category?: string;
  sort?: string;
  min?: string;
  max?: string;
  brand?: string;
  stock?: string;
  featured?: string;
  view?: string;
  page?: string;
};

const fallbackImage = "https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&w=1200&q=80";
const PRODUCTS_PER_PAGE = 16;

export default async function ShopPage({ searchParams }: { searchParams: Promise<ShopParams> }) {
  const params = await searchParams;
  const categories = await prisma.productCategory.findMany({
    where: { status: PublishStatus.PUBLISHED },
    include: {
      children: {
        where: { status: PublishStatus.PUBLISHED },
        include: { _count: { select: { products: true } } },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }]
      },
      _count: { select: { products: true } }
    },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }]
  });
  const activeCategory = params.category ? categories.find((category) => category.slug === params.category) : null;
  const categorySlugs = activeCategory ? [activeCategory.slug, ...activeCategory.children.map((child) => child.slug)] : [];
  const where: Prisma.ProductWhereInput = {
    status: PublishStatus.PUBLISHED,
    category: categorySlugs.length ? { slug: { in: categorySlugs } } : undefined,
    brand: params.brand ? { contains: params.brand } : undefined,
    isFeatured: params.featured === "true" ? true : undefined,
    stockQuantity: params.stock === "in-stock" ? { gt: 0 } : params.stock === "out-of-stock" ? { lte: 0 } : undefined,
    priceBdt: priceFilter(params),
    OR: params.q ? [
      { name: { contains: params.q } },
      { sku: { contains: params.q } },
      { model: { contains: params.q } },
      { brand: { contains: params.q } }
    ] : undefined
  };
  const [totalResults, brands] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where: { status: PublishStatus.PUBLISHED },
      distinct: ["brand"],
      select: { brand: true },
      orderBy: { brand: "asc" }
    })
  ]);
  const totalPages = totalResults ? Math.ceil(totalResults / PRODUCTS_PER_PAGE) : 0;
  const requestedPage = Number(params.page ?? "1");
  const currentPage = totalPages ? Math.min(Math.max(Number.isFinite(requestedPage) ? Math.trunc(requestedPage) : 1, 1), totalPages) : 0;
  const startItem = totalResults ? (currentPage - 1) * PRODUCTS_PER_PAGE + 1 : 0;
  const endItem = totalResults ? Math.min(currentPage * PRODUCTS_PER_PAGE, totalResults) : 0;
  const products = totalResults ? await prisma.product.findMany({
    where,
    select: {
      id: true,
      name: true,
      slug: true,
      sku: true,
      model: true,
      brand: true,
      isFeatured: true,
      priceBdt: true,
      compareAtPriceBdt: true,
      stockQuantity: true,
      category: { select: { name: true } },
      images: {
        select: { imagePath: true },
        orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
        take: 1
      }
    },
    orderBy: orderBy(params.sort),
    skip: (currentPage - 1) * PRODUCTS_PER_PAGE,
    take: PRODUCTS_PER_PAGE
  }) : [];
  const rootCategories = categories.filter((category) => !category.parentId);
  const productCount = totalResults;

  return (
    <main className="shop-page-shell">
      <div className="shop-container">
        <form className="shop-filter-bar">
          <strong className="shop-toolbar-title">Shop</strong>
          <input name="q" placeholder="Search product, SKU, brand or model" defaultValue={params.q} />
          <select name="sort" defaultValue={params.sort ?? "latest"} aria-label="Sort products">
            <option value="latest">Latest</option>
            <option value="price-asc">Price low to high</option>
            <option value="price-desc">Price high to low</option>
            <option value="popular">Popular</option>
            <option value="featured">Featured</option>
            <option value="name-az">Name A-Z</option>
          </select>
          <select name="brand" defaultValue={params.brand ?? ""} aria-label="Brand filter">
            <option value="">All brands</option>
            {brands.map((item) => <option key={item.brand} value={item.brand}>{item.brand}</option>)}
          </select>
          <select name="stock" defaultValue={params.stock ?? ""} aria-label="Stock filter">
            <option value="">Any stock</option>
            <option value="in-stock">In stock</option>
            <option value="out-of-stock">Out of stock</option>
          </select>
          <input type="hidden" name="category" value={params.category ?? ""} />
          <span className="shop-count-pill">{productCount} product{productCount === 1 ? "" : "s"}</span>
          <button type="submit"><SlidersHorizontal size={16} /> Filter</button>
          <ShopCartButton />
        </form>

        <div className="shop-mobile-chips">
          <Link className={!params.category ? "active" : ""} href="/shop">All</Link>
          {rootCategories.flatMap((category) => [category, ...category.children]).map((category) => (
            <Link key={category.id} className={params.category === category.slug ? "active" : ""} href={categoryHref(category.slug, params)}>{category.name}</Link>
          ))}
        </div>

        <div className="shop-layout">
          <aside className="shop-sidebar" aria-label="Product categories">
            <div className="shop-sidebar-title">
              <PackageSearch size={18} />
              <span>Categories</span>
            </div>
            <nav className="shop-category-list">
              <CategoryLink href="/shop" label="All Products" icon="all" count={categories.reduce((sum, item) => sum + item._count.products, 0)} active={!params.category} />
              {rootCategories.map((category) => (
                <div key={category.id} className="category-block">
                  <CategoryLink href={categoryHref(category.slug, params)} label={category.name} icon={category.icon ?? category.slug} count={category._count.products + childCount(category)} active={params.category === category.slug} />
                  {category.children.length ? (
                    <details open={category.slug === "inverter" || category.children.some((child) => child.slug === params.category)}>
                      <summary><ChevronDown size={14} /> Inverter types</summary>
                      <div>
                        {category.children.map((child) => (
                          <CategoryLink key={child.id} href={categoryHref(child.slug, params)} label={child.name} icon={child.icon ?? child.slug} count={child._count.products} active={params.category === child.slug} nested />
                        ))}
                      </div>
                    </details>
                  ) : null}
                </div>
              ))}
            </nav>
          </aside>

          <section className="shop-main-area" id="shop-results">
            <ShopPagination
              currentPage={currentPage}
              totalPages={totalPages}
              startItem={startItem}
              endItem={endItem}
              totalResults={totalResults}
              params={params}
              position="top"
            />
            {products.length ? (
              <div className={params.view === "list" ? "shop-compact-list" : "shop-product-grid"}>
                {products.map((product) => <ProductCard key={product.id} product={{
                  id: product.id,
                  name: product.name,
                  slug: product.slug,
                  sku: product.sku,
                  model: product.model,
                  brand: product.brand,
                  featured: product.isFeatured,
                  compareAtPrice: product.compareAtPriceBdt ? Number(product.compareAtPriceBdt) : null,
                  category: product.category.name,
                  price: Number(product.priceBdt),
                  stock: product.stockQuantity,
                  image: product.images[0]?.imagePath ?? fallbackImage
                }} />)}
              </div>
            ) : (
              <div className="shop-empty-state">
                <SunMedium size={34} />
                <h2>No products matched your filters</h2>
                <p>Try another category, brand, stock status or search term.</p>
                <Link href="/shop">Clear filters</Link>
              </div>
            )}
            <ShopPagination
              currentPage={currentPage}
              totalPages={totalPages}
              startItem={startItem}
              endItem={endItem}
              totalResults={totalResults}
              params={params}
              position="bottom"
            />
          </section>
        </div>
        <div className="shop-legal-links">
          <Link href="/shop/terms">Shop Terms & Conditions</Link>
          <span>·</span>
          <Link href="/shop/refund-policy">Refund Policy</Link>
        </div>
      </div>
    </main>
  );
}

function ShopPagination({
  currentPage,
  totalPages,
  startItem,
  endItem,
  totalResults,
  params,
  position
}: {
  currentPage: number;
  totalPages: number;
  startItem: number;
  endItem: number;
  totalResults: number;
  params: ShopParams;
  position: "top" | "bottom";
}) {
  const pageItems = paginationItems(currentPage, totalPages);
  const hasResults = totalResults > 0;
  const previousPage = currentPage > 1 ? currentPage - 1 : null;
  const nextPage = currentPage < totalPages ? currentPage + 1 : null;

  return (
    <div className={`shop-pagination-shell shop-pagination-shell-${position}`}>
      <div className="shop-pagination-meta">
        {hasResults ? (
          <>
            <strong>Page {currentPage}</strong>
            <span>Showing {startItem}-{endItem} of {totalResults} results</span>
          </>
        ) : (
          <strong>No products found</strong>
        )}
      </div>
      {totalPages > 1 ? (
        <nav className="shop-pagination-controls" aria-label={`Shop pagination ${position}`}>
          {previousPage ? (
            <Link className="shop-page-step" href={shopPageHref(params, previousPage)}>Previous</Link>
          ) : (
            <span className="shop-page-step disabled" aria-disabled="true">Previous</span>
          )}
          <span className="shop-page-compact">Page {currentPage} of {totalPages}</span>
          <div className="shop-page-number-list" aria-label="Page numbers">
            {pageItems.map((item, index) => item === "ellipsis" ? (
              <span className="shop-page-ellipsis" key={`ellipsis-${index}`}>...</span>
            ) : item === currentPage ? (
              <span className="shop-page-number active" aria-current="page" key={item}>{item}</span>
            ) : (
              <Link className="shop-page-number" href={shopPageHref(params, item)} key={item}>{item}</Link>
            ))}
          </div>
          {nextPage ? (
            <Link className="shop-page-step" href={shopPageHref(params, nextPage)}>Next</Link>
          ) : (
            <span className="shop-page-step disabled" aria-disabled="true">Next</span>
          )}
        </nav>
      ) : null}
    </div>
  );
}

function orderBy(sort?: string): Prisma.ProductOrderByWithRelationInput[] {
  if (sort === "price-asc") return [{ priceBdt: "asc" }];
  if (sort === "price-desc") return [{ priceBdt: "desc" }];
  if (sort === "name-az") return [{ name: "asc" }];
  if (sort === "popular" || sort === "featured") return [{ isFeatured: "desc" }, { createdAt: "desc" }];
  return [{ createdAt: "desc" }];
}

function priceFilter(params: ShopParams): Prisma.DecimalFilter | undefined {
  const gte = params.min ? Number(params.min) : undefined;
  const lte = params.max ? Number(params.max) : undefined;
  if (!Number.isFinite(gte) && !Number.isFinite(lte)) return undefined;
  return {
    ...(Number.isFinite(gte) ? { gte } : {}),
    ...(Number.isFinite(lte) ? { lte } : {})
  };
}

function categoryHref(category: string, params: ShopParams) {
  const search = new URLSearchParams();
  search.set("category", category);
  if (params.q) search.set("q", params.q);
  if (params.sort) search.set("sort", params.sort);
  if (params.brand) search.set("brand", params.brand);
  if (params.stock) search.set("stock", params.stock);
  return `/shop?${search.toString()}`;
}

function shopPageHref(params: ShopParams, page: number) {
  const search = new URLSearchParams();
  if (params.category) search.set("category", params.category);
  if (params.q) search.set("q", params.q);
  if (params.sort) search.set("sort", params.sort);
  if (params.brand) search.set("brand", params.brand);
  if (params.stock) search.set("stock", params.stock);
  if (params.min) search.set("min", params.min);
  if (params.max) search.set("max", params.max);
  if (params.featured) search.set("featured", params.featured);
  if (params.view) search.set("view", params.view);
  if (page > 1) search.set("page", String(page));
  const query = search.toString();
  return query ? `/shop?${query}#shop-results` : "/shop#shop-results";
}

function paginationItems(currentPage: number, totalPages: number): Array<number | "ellipsis"> {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, index) => index + 1);
  const items = new Set([1, totalPages, currentPage - 1, currentPage, currentPage + 1]);
  const sorted = Array.from(items)
    .filter((item) => item >= 1 && item <= totalPages)
    .sort((a, b) => a - b);
  const output: Array<number | "ellipsis"> = [];
  for (const item of sorted) {
    const previous = output[output.length - 1];
    if (typeof previous === "number" && item - previous > 1) output.push("ellipsis");
    output.push(item);
  }
  return output;
}

function childCount(category: { children: Array<{ _count: { products: number } }> }) {
  return category.children.reduce((sum, child) => sum + child._count.products, 0);
}

function CategoryLink({ href, label, icon, count, active, nested = false }: { href: string; label: string; icon: string; count: number; active: boolean; nested?: boolean }) {
  const Icon = iconFor(icon);
  return (
    <Link className={`shop-category-link${active ? " active" : ""}${nested ? " nested" : ""}`} href={href}>
      <Icon size={17} />
      <span>{label}</span>
      <small>{count}</small>
    </Link>
  );
}

function iconFor(icon: string) {
  const key = icon.toLowerCase();
  if (key.includes("solar") || key.includes("module")) return SunMedium;
  if (key.includes("hybrid")) return Zap;
  if (key.includes("offgrid") || key.includes("off-grid")) return Battery;
  if (key.includes("grid") || key.includes("inverter")) return CircuitBoard;
  if (key.includes("battery")) return Battery;
  if (key.includes("cable")) return Cable;
  if (key.includes("mount")) return Layers3;
  if (key.includes("bos") || key.includes("balance")) return Grid3X3;
  if (key.includes("featured")) return Sparkles;
  return PackageSearch;
}
