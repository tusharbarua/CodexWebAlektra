import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const labels: Record<string, string> = {
  epc: "Alektra EPC",
  thermal: "Alektra Thermal",
  sparkle: "Alektra Sparkle",
  mapping: "Alektra Mapping"
};

export default async function AdminPagesIndex() {
  const pages = await prisma.page.findMany({
    include: { _count: { select: { sections: true } } },
    orderBy: { pageKey: "asc" }
  });

  return (
    <div>
      <p className="kicker">CMS Pages</p>
      <h1>Subdivision page content.</h1>
      <div className="admin-card-grid">
        {pages.map((page) => (
          <article className="admin-media-card" key={page.id}>
            <div>
              <strong>{labels[page.pageKey] ?? page.title}</strong>
              <p>{page.slug} | {page.status} | {page._count.sections} sections</p>
            </div>
            <div className="table-actions">
              <Link className="btn secondary compact" href={`/admin/pages/${page.pageKey}`}>Manage content</Link>
              <Link className="btn secondary compact" href={`/${page.slug}`} target="_blank">Preview</Link>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

