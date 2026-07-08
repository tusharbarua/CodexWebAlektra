import type { Metadata } from "next";
import Link from "next/link";
import { RouteScrollToTop } from "@/components/RouteScrollToTop";
import { getSiteMapGroups } from "@/lib/legal-documents";

export const metadata: Metadata = {
  title: "Site Map",
  description: "Important Alektra Renewable website, service, shop, resource, and legal pages.",
  alternates: { canonical: "/site-map" }
};

export default function SiteMapPage() {
  const groups = getSiteMapGroups();
  return (
    <main className="legal-page">
      <RouteScrollToTop />
      <div className="container">
        <Link className="legal-back-link" href="/">← Back to Alektra Renewable</Link>
        <article className="legal-page-card">
          <p className="kicker">Alektra Legal</p>
          <h1>Site Map</h1>
          <p className="legal-page-meta">Important public pages and resources.</p>
          <div className="site-map-page-grid">
            {groups.map((group) => (
              <section key={group.title}>
                <h2>{group.title}</h2>
                <ul>
                  {group.links.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href}>{link.label}</Link>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </article>
      </div>
    </main>
  );
}
