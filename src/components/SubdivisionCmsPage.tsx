import { PageKey } from "@prisma/client";
import Link from "next/link";
import { MarkdownBlock, getPublishedPage, sectionByKey, settings } from "@/lib/page-cms";

export async function SubdivisionCmsPage({ pageKey }: { pageKey: PageKey }) {
  const page = await getPublishedPage(pageKey);
  const hero = sectionByKey(page, "hero");
  const overview = sectionByKey(page, "overview");
  const heroSettings = settings(hero?.settingsJson, { primaryCtaText: "Contact Alektra", primaryCtaLink: "/#contact" });

  return (
    <main className="page-shell">
      <div className="container">
        <section className="panel">
          <p className="kicker">{hero?.subtitle ?? page?.title}</p>
          <h1>{hero?.title ?? page?.title}</h1>
          <MarkdownBlock value={hero?.body ?? page?.metaDescription} />
          <p style={{ marginTop: 22 }}><Link className="btn" href={String(heroSettings.primaryCtaLink)}>{String(heroSettings.primaryCtaText)}</Link></p>
        </section>
        {overview ? (
          <section className="section tight">
            <div className="section-heading"><div><p className="kicker">{overview.subtitle}</p><h2>{overview.title}</h2></div><p>{overview.body}</p></div>
          </section>
        ) : null}
      </div>
    </main>
  );
}

