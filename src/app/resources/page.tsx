import Link from "next/link";
import { PublishStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function ResourcesPage() {
  const [articles, categories] = await Promise.all([
    prisma.resourceArticle.findMany({ where: { status: PublishStatus.PUBLISHED }, include: { category: true }, orderBy: { publishedAt: "desc" } }),
    prisma.resourceCategory.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] })
  ]);
  return (
    <main className="page-shell"><div className="container">
      <div className="section-heading"><div><p className="kicker">Resources</p><h1>Solar learning library.</h1></div><p>Practical guidance for owners, engineers and renewable-energy decision makers.</p></div>
      <div className="category-strip">{categories.map((category) => <span key={category.id}>{category.name}</span>)}</div>
      <div className="resource-grid">{articles.map((article) => <Link className="card" href={`/resources/${article.slug}`} key={article.id}>
        {article.coverImage ? <div className="card-media" style={{ backgroundImage: `url(${article.coverImage})` }} /> : null}
        <div className="card-body"><small>{article.category.name}</small><h3>{article.title}</h3><p>{article.excerpt}</p></div>
      </Link>)}</div>
    </div></main>
  );
}
