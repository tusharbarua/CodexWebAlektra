import type { Metadata } from "next";
import { LegalDocumentPage } from "@/components/LegalDocumentPage";
import { getLegalDefaultDescription, getPublishedLegalDocument } from "@/lib/legal-documents";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const document = await getPublishedLegalDocument("terms-of-use");
  return {
    title: document.title,
    description: getLegalDefaultDescription("terms-of-use"),
    alternates: { canonical: "/terms-of-use" }
  };
}

export default async function TermsOfUsePage() {
  const document = await getPublishedLegalDocument("terms-of-use");
  return <LegalDocumentPage document={document} />;
}
