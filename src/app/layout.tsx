import type { Metadata } from "next";
import { headers } from "next/headers";
import { PublicChrome } from "@/components/PublicChrome";
import { getFooterSettings } from "@/lib/site-settings";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.alektraepc.com"),
  title: {
    default: "Alektra Renewable | Solar EPC Bangladesh",
    template: "%s | Alektra Renewable"
  },
  description:
    "Premium solar EPC, aerial thermal inspection, solar panel cleaning and mapping services for Bangladesh commercial and industrial clients.",
  openGraph: {
    title: "Alektra Renewable",
    description: "Solar EPC, thermal inspection, panel cleaning and mapping services.",
    url: "https://www.alektraepc.com",
    siteName: "Alektra Renewable",
    images: [{ url: "/brand/alektra-logo.svg", width: 1200, height: 630 }],
    locale: "en_BD",
    type: "website"
  }
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const pathname = (await headers()).get("x-pathname") ?? "";
  const isAdminRoute = pathname.startsWith("/admin");
  const footerSettings = isAdminRoute ? null : await getFooterSettings();
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <PublicChrome footerSettings={footerSettings}>{children}</PublicChrome>
      </body>
    </html>
  );
}
