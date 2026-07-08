"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { CartDrawer } from "@/components/CartDrawer";
import { FloatingCartBar } from "@/components/FloatingCartBar";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import type { PublicLegalDocument } from "@/lib/legal-documents";
import type { FooterSettings } from "@/lib/site-settings";

type SiteMapGroup = {
  title: string;
  links: Array<{ label: string; href: string }>;
};

export function PublicChrome({
  children,
  footerSettings,
  legalDocuments,
  siteMapGroups
}: {
  children: ReactNode;
  footerSettings: FooterSettings | null;
  legalDocuments: PublicLegalDocument[];
  siteMapGroups: SiteMapGroup[];
}) {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return <>{children}</>;

  return (
    <>
      <Header />
      {children}
      <FloatingCartBar />
      <CartDrawer />
      {footerSettings ? <Footer settings={footerSettings} legalDocuments={legalDocuments} siteMapGroups={siteMapGroups} /> : null}
    </>
  );
}
