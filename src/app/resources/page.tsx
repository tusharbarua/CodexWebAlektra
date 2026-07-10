import Link from "next/link";
import { PublishStatus } from "@prisma/client";
import { ArrowRight, BookOpen, Clock3, Search, Sparkles } from "lucide-react";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const resourceFallbackImage =
  "linear-gradient(135deg, rgba(0,111,53,0.92), rgba(82,183,72,0.72) 48%, rgba(255,183,0,0.74))";

export default async function ResourcesPage({ searchParams }: { searchParams: Promise<{ category?: string; q?: string; take?: string }> }) {
  const { category: activeCategory = "all", q = "", take } = await searchParams;
  const query = q.trim();
  const requestedTake = Number(take);
  const visibleCount = Number.isFinite(requestedTake) ? Math.min(60, Math.max(12, requestedTake)) : 12;
  const categories = await prisma.resourceCategory.findMany({
    where: { status: PublishStatus.PUBLISHED },
    include: { _count: { select: { articles: { where: { status: PublishStatus.PUBLISHED } } } } },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }]
  });
  const selectedCategory = categories.find((item) => item.slug === activeCategory);

  const articleWhere = {
    status: PublishStatus.PUBLISHED,
    ...(selectedCategory ? { categoryId: selectedCategory.id } : {}),
    ...(query
      ? {
          OR: [
            { title: { contains: query } },
            { excerpt: { contains: query } },
            { category: { name: { contains: query } } }
          ]
        }
      : {})
  };
  const [articlesResult, totalArticles] = await Promise.all([
    prisma.resourceArticle.findMany({
      where: articleWhere,
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        coverImage: true,
        coverImageAlt: true,
        publishedAt: true,
        createdAt: true,
        readTimeMinutes: true,
        isFeatured: true,
        category: { select: { name: true, slug: true } }
      },
      orderBy: [{ isFeatured: "desc" }, { publishedAt: "desc" }, { createdAt: "desc" }],
      take: visibleCount + 1
    }),
    prisma.resourceArticle.count({ where: articleWhere })
  ]);
  const hasMore = articlesResult.length > visibleCount;
  const articles = articlesResult.slice(0, visibleCount);
  const [featured, ...gridArticles] = articles;

  return (
    <main className="resources-page">
      <section className="resources-intro-section">
        <div className="container">
          <div className="resources-intro-card resources-glass-card">
            <div>
              <p className="resources-kicker">Alektra Knowledge Hub</p>
              <h1>Resources & Insights</h1>
              <p>
                Practical knowledge, technical guidance, and renewable-energy insights for solar EPC, inverters,
                energy storage, mounting systems, cable selection, solar modules, and project design.
              </p>
            </div>
            <div className="resources-intro-mark">
              <BookOpen size={38} />
              <span>Technical knowledge for better solar decisions</span>
            </div>
          </div>
        </div>
      </section>

      <section className="resources-filter-section">
        <div className="container">
          <div className="resources-filter-bar resources-glass-card">
            <div className="resources-category-pills">
              <ResourcePill href={`/resources${query ? `?q=${encodeURIComponent(query)}` : ""}`} active={activeCategory === "all"} label="All" count={categories.reduce((sum, item) => sum + item._count.articles, 0)} />
              {categories.map((item) => {
                const href = `/resources?category=${item.slug}${query ? `&q=${encodeURIComponent(query)}` : ""}`;
                return <ResourcePill href={href} active={item.slug === activeCategory} label={item.name} count={item._count.articles} key={item.id} />;
              })}
            </div>
            <form className="resources-search" action="/resources">
              {selectedCategory ? <input type="hidden" name="category" value={selectedCategory.slug} /> : null}
              <Search size={17} />
              <input name="q" defaultValue={query} placeholder="Search resources..." />
              <button type="submit">Search</button>
            </form>
          </div>
        </div>
      </section>

      {featured ? (
        <section className="resources-featured-section">
          <div className="container">
            <p className="resources-kicker">Featured Insight</p>
            <Link className="resources-featured-card resources-glass-card" href={`/resources/${featured.slug}`}>
              <ResourceImage article={featured} className="resources-featured-image" />
              <div className="resources-featured-copy">
                <span className="resources-badge">{featured.category.name}</span>
                <h2>{featured.title}</h2>
                <p>{featured.excerpt}</p>
                <div className="resources-meta">
                  <span>{formatDate(featured.publishedAt ?? featured.createdAt)}</span>
                  <span><Clock3 size={14} /> {featured.readTimeMinutes ?? 1} min read</span>
                </div>
                <span className="resources-read-link">Read Article <ArrowRight size={16} /></span>
              </div>
            </Link>
          </div>
        </section>
      ) : null}

      <section className="resources-grid-section">
        <div className="container">
          <div className="resources-section-heading">
            <div>
              <p className="resources-kicker">Knowledge Articles</p>
              <h2>{selectedCategory ? selectedCategory.name : query ? "Search Results" : "Latest Resources"}</h2>
            </div>
            <p>{articles.length ? `Showing ${articles.length} of ${totalArticles} published article${totalArticles === 1 ? "" : "s"}.` : "Resources are being prepared. Please check back soon."}</p>
          </div>
          {articles.length ? (
            <>
              <div className="resources-card-grid">
                {(featured ? gridArticles : articles).map((article) => <ResourceCard article={article} key={article.id} />)}
              </div>
              {hasMore ? (
                <div className="resources-load-more-wrap">
                  <Link className="resources-load-more" href={resourcesHref({ category: activeCategory, q: query, take: visibleCount + 12 })}>
                    Load More <ArrowRight size={16} />
                  </Link>
                </div>
              ) : null}
            </>
          ) : (
            <div className="resources-empty resources-glass-card">
              <Sparkles size={30} />
              <h3>Resources are being prepared.</h3>
              <p>Please check back soon, or adjust the selected category/search filter.</p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

function ResourcePill({ href, active, label, count }: { href: string; active: boolean; label: string; count: number }) {
  return (
    <Link className={`resources-pill ${active ? "active" : ""}`} href={href}>
      <span>{label}</span>
      <small>{count}</small>
    </Link>
  );
}

type ArticleWithCategory = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  coverImage: string | null;
  coverImageAlt: string | null;
  publishedAt: Date | null;
  createdAt: Date;
  readTimeMinutes: number | null;
  isFeatured: boolean;
  category: { name: string; slug: string };
};

function ResourceCard({ article }: { article: ArticleWithCategory }) {
  return (
    <Link className="resource-card resources-glass-card" href={`/resources/${article.slug}`}>
      <ResourceImage article={article} className="resource-card-image" />
      <div className="resource-card-body">
        <span className="resources-badge">{article.category.name}</span>
        <h3>{article.title}</h3>
        <p>{article.excerpt}</p>
        <div className="resources-meta">
          <span>{formatDate(article.publishedAt ?? article.createdAt)}</span>
          <span><Clock3 size={14} /> {article.readTimeMinutes ?? 1} min read</span>
        </div>
        <span className="resources-read-link">Read Article <ArrowRight size={15} /></span>
      </div>
    </Link>
  );
}

function ResourceImage({ article, className }: { article: { coverImage?: string | null; coverImageAlt?: string | null; title: string }; className: string }) {
  if (!article.coverImage) return <div className={`${className} resources-image-placeholder`} style={{ background: resourceFallbackImage }} aria-label={article.title} />;
  return <div className={className} style={{ backgroundImage: `url(${article.coverImage})` }} role="img" aria-label={article.coverImageAlt || article.title} />;
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-BD", { month: "short", day: "numeric", year: "numeric" }).format(value);
}

function resourcesHref({ category, q, take }: { category: string; q: string; take: number }) {
  const params = new URLSearchParams();
  if (category && category !== "all") params.set("category", category);
  if (q) params.set("q", q);
  params.set("take", String(take));
  const queryString = params.toString();
  return queryString ? `/resources?${queryString}` : "/resources";
}
