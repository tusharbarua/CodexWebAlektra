"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ShoppingCart, UserRound } from "lucide-react";
import { brandLogos, brandNames, getDivisionFromPath } from "@/lib/brand";
import { CartBadge } from "@/components/CartBadge";
import { openCartDrawer } from "@/lib/cart";

export function Header() {
  const pathname = usePathname();
  const [customerHref, setCustomerHref] = useState("/account/login");
  const [customerLabel, setCustomerLabel] = useState("Account");
  const division = getDivisionFromPath(pathname);
  const logo = brandLogos[division];
  const brandName = brandNames[division];
  const links = [
    { label: "EPC", href: "/#epc", active: pathname === "/" || pathname === "/epc" },
    { label: "Thermal", href: "/thermal", active: pathname.startsWith("/thermal") },
    { label: "Sparkle", href: "/sparkle", active: pathname.startsWith("/sparkle") },
    { label: "Mapping", href: "/mapping", active: pathname.startsWith("/mapping") },
    { label: "About Us", href: "/company", active: pathname.startsWith("/company") },
    { label: "Resources", href: "/resources", active: pathname.startsWith("/resources") },
    { label: "Shop", href: "/shop", active: pathname.startsWith("/shop") }
  ];
  useEffect(() => {
    let cancelled = false;
    const resetCustomer = () => {
      setCustomerHref("/account/login");
      setCustomerLabel("Account");
    };
    const loadCustomer = () => {
      fetch("/api/account/session", { cache: "no-store", credentials: "same-origin" })
        .then((response) => response.ok ? response.json() : null)
        .then((data) => {
          if (cancelled) return;
          if (data?.authenticated) {
            setCustomerHref("/account");
            setCustomerLabel(customerDisplayName(data.customer));
          } else {
            resetCustomer();
          }
        })
        .catch(() => {
          if (!cancelled) resetCustomer();
        });
    };
    loadCustomer();
    window.addEventListener("alektra-customer-session-changed", loadCustomer);
    window.addEventListener("focus", loadCustomer);
    return () => {
      cancelled = true;
      window.removeEventListener("alektra-customer-session-changed", loadCustomer);
      window.removeEventListener("focus", loadCustomer);
    };
  }, [pathname]);
  return (
    <header className={`site-header ${division}-site-header`}>
      <div className="container nav">
        <Link className={`brand-mark header-logo-frame brand-mark-${division}`} href="/" aria-label={`${brandName} home`}>
          <Image className="brand-logo" src={logo} alt={brandName} width={420} height={120} unoptimized priority />
        </Link>
        <nav className="nav-links" aria-label="Primary navigation">
          {links.map((link) => (
            <Link className={`public-nav-link ${link.active ? "is-active" : ""}`} href={link.href} key={link.href}>
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="nav-actions">
          <Link className="btn secondary" href={customerHref} aria-label={customerLabel}>
            <UserRound size={18} />
            {customerLabel}
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

function customerDisplayName(customer?: { fullName?: string; email?: string } | null) {
  const firstName = customer?.fullName?.trim().split(/\s+/)[0];
  if (firstName) return firstName.length > 16 ? `${firstName.slice(0, 15)}…` : firstName;
  const emailPrefix = customer?.email?.split("@")[0];
  if (emailPrefix) return emailPrefix.length > 16 ? `${emailPrefix.slice(0, 15)}…` : emailPrefix;
  return "Account";
}
