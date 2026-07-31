import type { MetadataRoute } from "next";
import { PublishStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const staticRoutes: Array<{
  path: string;
  priority: number;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
}> = [
  { path: "/", priority: 1, changeFrequency: "weekly" },
  { path: "/epc", priority: 0.9, changeFrequency: "weekly" },
  { path: "/thermal", priority: 0.85, changeFrequency: "weekly" },
  { path: "/sparkle", priority: 0.85, changeFrequency: "weekly" },
  { path: "/mapping", priority: 0.85, changeFrequency: "weekly" },
  { path: "/company", priority: 0.7, changeFrequency: "monthly" },
  { path: "/resources", priority: 0.8, changeFrequency: "daily" },
  { path: "/shop", priority: 0.8, changeFrequency: "daily" },
  { path: "/privacy-policy", priority: 0.3, changeFrequency: "yearly" },
  { path: "/terms-of-use", priority: 0.3, changeFrequency: "yearly" },
  { path: "/sales-and-refunds", priority: 0.3, changeFrequency: "yearly" },
  { path: "/legal", priority: 0.3, changeFrequency: "yearly" },
  { path: "/site-map", priority: 0.3, changeFrequency: "monthly" },
  { path: "/shop/terms", priority: 0.3, changeFrequency: "yearly" },
  { path: "/shop/refund-policy", priority: 0.3, changeFrequency: "yearly" }
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getBaseUrl();
  const [resources, products] = await Promise.all([
    prisma.resourceArticle.findMany({
      where: { status: PublishStatus.PUBLISHED },
      select: { slug: true, publishedAt: true, updatedAt: true },
      orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }]
    }),
    prisma.product.findMany({
      where: { status: PublishStatus.PUBLISHED },
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: "desc" }
    })
  ]);

  return [
    ...staticRoutes.map((route) => ({
      url: absoluteUrl(baseUrl, route.path),
      lastModified: new Date(),
      changeFrequency: route.changeFrequency,
      priority: route.priority
    })),
    ...resources.map((article) => ({
      url: absoluteUrl(baseUrl, `/resources/${article.slug}`),
      lastModified: article.updatedAt ?? article.publishedAt ?? new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7
    })),
    ...products.map((product) => ({
      url: absoluteUrl(baseUrl, `/shop/${product.slug}`),
      lastModified: product.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.65
    }))
  ];
}

function getBaseUrl() {
  const value = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "https://alektraepc.com";
  return value.replace(/\/+$/, "");
}

function absoluteUrl(baseUrl: string, path: string) {
  return `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
}
