import Link from "next/link";
import { PolicyFormattedText } from "@/components/PolicyFormattedText";
import { RouteScrollToTop } from "@/components/RouteScrollToTop";
import type { PublicLegalDocument } from "@/lib/legal-documents";

export function LegalDocumentPage({ document }: { document: PublicLegalDocument }) {
  return (
    <main className="legal-page">
      <RouteScrollToTop />
      <div className="container">
        <Link className="legal-back-link" href="/">← Back to Alektra Renewable</Link>
        <article className="legal-page-card">
          <p className="kicker">Alektra Legal</p>
          <h1>{document.title}</h1>
          <p className="legal-page-meta">
            Version {document.version}{document.effectiveDate ? ` · Effective ${new Date(document.effectiveDate).toLocaleDateString("en-GB")}` : ""}
          </p>
          <div className="policy-text">
            <PolicyFormattedText content={document.content} />
          </div>
        </article>
      </div>
    </main>
  );
}
