import { PageKey } from "@prisma/client";
import { SubdivisionCmsPage } from "@/components/SubdivisionCmsPage";
import { getPublishedPage } from "@/lib/page-cms";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const page = await getPublishedPage(PageKey.sparkle);
  return {
    title: page?.metaTitle ?? "Alektra Sparkle",
    description: page?.metaDescription ?? "Solar panel cleaning service."
  };
}

export default function SparklePage() {
  return <SubdivisionCmsPage pageKey={PageKey.sparkle} />;
}
