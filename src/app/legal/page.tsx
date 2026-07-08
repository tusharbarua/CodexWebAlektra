import type { Metadata } from "next";
import { LegalDocumentPage } from "@/components/LegalDocumentPage";
import { getLegalDefaultDescription, getPublishedLegalDocument } from "@/lib/legal-documents";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const document = await getPublishedLegalDocument("legal");
  return {
    title: document.title,
    description: getLegalDefaultDescription("legal"),
    alternates: { canonical: "/legal" }
  };
}

export default async function LegalNoticePage() {
  const document = await getPublishedLegalDocument("legal");
  return <LegalDocumentPage document={document} />;
}
