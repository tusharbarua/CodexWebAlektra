import type { Metadata } from "next";
import { LegalDocumentPage } from "@/components/LegalDocumentPage";
import { getLegalDefaultDescription, getPublishedLegalDocument } from "@/lib/legal-documents";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const document = await getPublishedLegalDocument("privacy");
  return {
    title: document.title,
    description: getLegalDefaultDescription("privacy"),
    alternates: { canonical: "/privacy-policy" }
  };
}

export default async function PrivacyPolicyPage() {
  const document = await getPublishedLegalDocument("privacy");
  return <LegalDocumentPage document={document} />;
}
