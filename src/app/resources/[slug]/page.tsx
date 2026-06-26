import { notFound } from "next/navigation";
import { PublishStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function ResourceArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await prisma.resourceArticle.findFirst({ where: { slug, status: PublishStatus.PUBLISHED }, include: { category: true } });
  if (!article) notFound();
  return (
    <main className="page-shell"><article className="container panel article" style={{ maxWidth: 860 }}>
      {article.coverImage ? <div className="card-media article-cover" style={{ backgroundImage: `url(${article.coverImage})` }} /> : null}
      <p className="kicker">{article.category.name}</p><h1>{article.title}</h1><p className="article-lead">{article.excerpt}</p>
      {article.body.split(/\n\n+/).map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
    </article></main>
  );
}
