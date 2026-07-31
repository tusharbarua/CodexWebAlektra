import Link from "next/link";
import { notFound } from "next/navigation";
import { PublishStatus } from "@prisma/client";
import { ArrowLeft, ArrowRight, Clock3, UserRound } from "lucide-react";
import { SafePublicImage } from "@/components/SafePublicImage";
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
  const sourceProject = article.sourceProjectId
    ? await prisma.project.findUnique({
        where: { id: article.sourceProjectId },
        select: {
          coverImage: true,
          images: {
            orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
            take: 1,
            select: { imagePath: true }
          }
        }
      })
    : null;
  const articleImage = article.coverImage || sourceProject?.images[0]?.imagePath || sourceProject?.coverImage || null;

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
  const relatedProjectIds = related.map((item) => item.sourceProjectId).filter((id): id is string => Boolean(id));
  const relatedProjects = relatedProjectIds.length
    ? await prisma.project.findMany({
        where: { id: { in: relatedProjectIds } },
        select: {
          id: true,
          coverImage: true,
          images: {
            orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
            take: 1,
            select: { imagePath: true }
          }
        }
      })
    : [];
  const relatedProjectImageById = new Map(relatedProjects.map((project) => [project.id, project.images[0]?.imagePath || project.coverImage || null]));

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
            <SafePublicImage
              src={article.coverImage || articleImage}
              fallbackSrc={sourceProject?.images[0]?.imagePath || sourceProject?.coverImage || null}
              className="resource-article-cover"
              alt={article.coverImageAlt || article.title}
              fallbackStyle={{ background: fallbackImage }}
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
                  <SafePublicImage
                    src={item.coverImage || (item.sourceProjectId ? relatedProjectImageById.get(item.sourceProjectId) : null)}
                    fallbackSrc={item.sourceProjectId ? relatedProjectImageById.get(item.sourceProjectId) : null}
                    className="resource-card-image"
                    alt={item.coverImageAlt || item.title}
                    fallbackStyle={{ background: fallbackImage }}
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
