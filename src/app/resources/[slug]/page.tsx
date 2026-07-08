import Link from "next/link";
import { notFound } from "next/navigation";
import { PublishStatus } from "@prisma/client";
import { ArrowLeft, ArrowRight, Clock3, UserRound } from "lucide-react";
import { MarkdownBlock } from "@/lib/page-cms";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const fallbackImage =
  "linear-gradient(135deg, rgba(0,111,53,0.92), rgba(82,183,72,0.70) 48%, rgba(255,183,0,0.76))";

export default async function ResourceArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await prisma.resourceArticle.findFirst({
    where: { slug, status: PublishStatus.PUBLISHED },
    include: { category: true, author: true }
  });
  if (!article) notFound();

  const related = await prisma.resourceArticle.findMany({
    where: {
      status: PublishStatus.PUBLISHED,
      categoryId: article.categoryId,
      id: { not: article.id }
    },
    include: { category: true },
    orderBy: [{ isFeatured: "desc" }, { publishedAt: "desc" }, { createdAt: "desc" }],
    take: 3
  });

  return (
    <main className="resources-page resource-detail-page">
      <section className="resource-detail-shell">
        <div className="container">
          <Link className="resource-back-link" href="/resources"><ArrowLeft size={16} /> Back to Resources</Link>
          <article className="resource-article-card resources-glass-card">
            <div className="resource-article-head">
              <span className="resources-badge">{article.category.name}</span>
              <h1>{article.title}</h1>
              <p>{article.excerpt}</p>
              <div className="resources-meta">
                <span>{formatDate(article.publishedAt ?? article.createdAt)}</span>
                <span><Clock3 size={14} /> {article.readTimeMinutes ?? estimateReadTime(article.body)} min read</span>
                <span><UserRound size={14} /> {article.author?.name || "Alektra Renewable"}</span>
              </div>
            </div>
            <div
              className={`resource-article-cover ${article.coverImage ? "" : "resources-image-placeholder"}`}
              style={article.coverImage ? { backgroundImage: `url(${article.coverImage})` } : { background: fallbackImage }}
              role="img"
              aria-label={article.coverImageAlt || article.title}
            />
            <div className="resource-article-body">
              <MarkdownBlock value={article.body} />
            </div>
          </article>
        </div>
      </section>

      {related.length ? (
        <section className="resource-related-section">
          <div className="container">
            <div className="resources-section-heading compact">
              <div>
                <p className="resources-kicker">Related Articles</p>
                <h2>More from {article.category.name}</h2>
              </div>
            </div>
            <div className="resources-card-grid related">
              {related.map((item) => (
                <Link className="resource-card resources-glass-card" href={`/resources/${item.slug}`} key={item.id}>
                  <div
                    className={`resource-card-image ${item.coverImage ? "" : "resources-image-placeholder"}`}
                    style={item.coverImage ? { backgroundImage: `url(${item.coverImage})` } : { background: fallbackImage }}
                    role="img"
                    aria-label={item.coverImageAlt || item.title}
                  />
                  <div className="resource-card-body">
                    <span className="resources-badge">{item.category.name}</span>
                    <h3>{item.title}</h3>
                    <p>{item.excerpt}</p>
                    <span className="resources-read-link">Read Article <ArrowRight size={15} /></span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </main>
  );
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-BD", { month: "short", day: "numeric", year: "numeric" }).format(value);
}

function estimateReadTime(body: string) {
  return Math.max(1, Math.ceil(body.trim().split(/\s+/).filter(Boolean).length / 180));
}
