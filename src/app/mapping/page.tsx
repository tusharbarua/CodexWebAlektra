import { PageKey } from "@prisma/client";
import { SubdivisionCmsPage } from "@/components/SubdivisionCmsPage";
import { getPublishedPage } from "@/lib/page-cms";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const page = await getPublishedPage(PageKey.mapping);
  return {
    title: page?.metaTitle ?? "Alektra Mapping",
    description: page?.metaDescription ?? "Photogrammetry, mapping and aerial survey services."
  };
}

export default function MappingPage() {
  return <SubdivisionCmsPage pageKey={PageKey.mapping} />;
}

