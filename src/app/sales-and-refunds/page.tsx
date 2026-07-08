import type { Metadata } from "next";
import { LegalDocumentPage } from "@/components/LegalDocumentPage";
import { getLegalDefaultDescription, getPublishedLegalDocument } from "@/lib/legal-documents";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const document = await getPublishedLegalDocument("sales-and-refunds");
  return {
    title: document.title,
    description: getLegalDefaultDescription("sales-and-refunds"),
    alternates: { canonical: "/sales-and-refunds" }
  };
}

export default async function SalesAndRefundsPage() {
  const document = await getPublishedLegalDocument("sales-and-refunds");
  return <LegalDocumentPage document={document} />;
}
