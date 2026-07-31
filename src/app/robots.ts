import type { MetadataRoute } from "next";

export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "https://alektraepc.com").replace(/\/+$/, "");

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/admin/", "/account", "/account/", "/checkout", "/api/"]
    },
    sitemap: `${baseUrl}/sitemap.xml`
  };
}
