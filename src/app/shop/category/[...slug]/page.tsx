import { redirect } from "next/navigation";

export default async function ShopCategoryPage({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  redirect(`/shop?category=${encodeURIComponent(slug.at(-1) ?? "")}`);
}
