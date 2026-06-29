"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ShoppingCart, UserRound } from "lucide-react";
import { brandLogos, brandNames, getDivisionFromPath } from "@/lib/brand";
import { CartBadge } from "@/components/CartBadge";
import { openCartDrawer } from "@/lib/cart";

export function Header() {
  const pathname = usePathname();
  const division = getDivisionFromPath(pathname);
  const logo = brandLogos[division];
  const brandName = brandNames[division];
  return (
    <header className={`site-header ${division}-site-header`}>
      <div className="container nav">
        <Link className={`brand-mark header-logo-frame brand-mark-${division}`} href="/" aria-label={`${brandName} home`}>
          <Image className="brand-logo" src={logo} alt={brandName} width={420} height={120} unoptimized priority />
        </Link>
        <nav className="nav-links" aria-label="Primary navigation">
          <Link href="/#epc">EPC</Link>
          <Link href="/thermal">Thermal</Link>
          <Link href="/#subdivisions">Sparkle</Link>
          <Link href="/#subdivisions">Mapping</Link>
          <Link href="/resources">Resources</Link>
          <Link href="/shop">Shop</Link>
        </nav>
        <div className="nav-actions">
          <Link className="btn secondary" href="/account/orders" aria-label="Account">
            <UserRound size={18} />
            Account
          </Link>
          <button className="btn dark header-cta" type="button" onClick={openCartDrawer} aria-label="Open cart">
            <ShoppingCart size={18} />
            Cart
            <CartBadge />
          </button>
        </div>
      </div>
    </header>
  );
}
