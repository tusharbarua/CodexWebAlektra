"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { CartDrawer } from "@/components/CartDrawer";
import { FloatingCartBar } from "@/components/FloatingCartBar";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import type { FooterSettings } from "@/lib/site-settings";

export function PublicChrome({ children, footerSettings }: { children: ReactNode; footerSettings: FooterSettings | null }) {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return <>{children}</>;

  return (
    <>
      <Header />
      {children}
      <FloatingCartBar />
      <CartDrawer />
      {footerSettings ? <Footer settings={footerSettings} /> : null}
    </>
  );
}
