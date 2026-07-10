"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { Home, LogIn, Menu, Search, ShoppingBag, ShoppingCart, UserRound, X } from "lucide-react";
import { brandLogos, brandNames, getDivisionFromPath } from "@/lib/brand";
import { CartBadge } from "@/components/CartBadge";
import { CustomerLogoutForm } from "@/components/CustomerLogoutForm";
import { CART_UPDATED_EVENT, cartSummary, openCartDrawer, readCart } from "@/lib/cart";

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [customerHref, setCustomerHref] = useState("/account/login");
  const [customerLabel, setCustomerLabel] = useState("Account");
  const [isCustomerLoggedIn, setIsCustomerLoggedIn] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cartQuantity, setCartQuantity] = useState(0);
  const [mobileSearch, setMobileSearch] = useState("");
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
      setIsCustomerLoggedIn(false);
    };
    const loadCustomer = () => {
      fetch("/api/account/session", { cache: "no-store", credentials: "same-origin" })
        .then((response) => response.ok ? response.json() : null)
        .then((data) => {
          if (cancelled) return;
          if (data?.authenticated) {
            setCustomerHref("/account");
            setCustomerLabel(customerDisplayName(data.customer));
            setIsCustomerLoggedIn(true);
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

  useEffect(() => {
    const syncCart = () => setCartQuantity(cartSummary(readCart()).quantity);
    syncCart();
    window.addEventListener(CART_UPDATED_EVENT, syncCart);
    window.addEventListener("storage", syncCart);
    return () => {
      window.removeEventListener(CART_UPDATED_EVENT, syncCart);
      window.removeEventListener("storage", syncCart);
    };
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileMenuOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [mobileMenuOpen]);

  const mobileLogoHref = division === "epc" ? "/" : `/${division}`;
  const accountInitial = customerLabel && customerLabel !== "Account" ? customerLabel.charAt(0).toUpperCase() : null;
  const closeMobileMenu = () => setMobileMenuOpen(false);

  function submitMobileSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = mobileSearch.trim();
    if (!query) return;
    closeMobileMenu();
    router.push(`/shop?q=${encodeURIComponent(query)}`);
  }

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
      <div className="mobile-public-header" aria-label="Mobile public navigation">
        <button className="mobile-header-icon-button mobile-menu-button" type="button" onClick={() => setMobileMenuOpen(true)} aria-label="Open navigation menu" aria-expanded={mobileMenuOpen}>
          <Menu size={21} />
        </button>
        <Link className={`mobile-header-logo brand-mark-${division}`} href={mobileLogoHref} aria-label={`${brandName} section`}>
          <Image className="brand-logo" src={logo} alt={brandName} width={360} height={104} unoptimized priority />
        </Link>
        <div className="mobile-header-actions">
          <Link className="mobile-header-icon-button mobile-account-button" href={customerHref} aria-label={isCustomerLoggedIn ? `Open account for ${customerLabel}` : "Customer account"}>
            {accountInitial ? <span aria-hidden="true">{accountInitial}</span> : <UserRound size={19} />}
          </Link>
          <button className="mobile-header-icon-button mobile-cart-button" type="button" onClick={openCartDrawer} aria-label="Open cart">
            <ShoppingBag size={19} />
            {cartQuantity ? <span className="mobile-cart-count" aria-label={`${cartQuantity} cart items`}>{cartQuantity}</span> : null}
          </button>
        </div>
      </div>
      {mobileMenuOpen ? (
        <div className="mobile-menu-layer" role="presentation">
          <div className="mobile-menu-overlay" onMouseDown={closeMobileMenu} />
          <aside className={`mobile-menu-panel mobile-menu-panel-${division}`} aria-label="Mobile navigation menu">
            <header className="mobile-menu-panel-header">
              <div>
                <p className="kicker">Alektra Navigation</p>
                <strong>{brandName}</strong>
              </div>
              <button className="mobile-menu-close" type="button" onClick={closeMobileMenu} aria-label="Close navigation menu">
                <X size={20} />
              </button>
            </header>
            <form className="mobile-menu-search" onSubmit={submitMobileSearch}>
              <Search size={17} />
              <input value={mobileSearch} onChange={(event) => setMobileSearch(event.target.value)} placeholder="Search products, resources, services..." />
              <button type="submit">Search</button>
            </form>
            <nav className="mobile-menu-nav" aria-label="Main pages">
              {links.map((link) => (
                <Link className={link.active ? "is-active" : ""} href={link.href} key={link.href} onClick={closeMobileMenu}>
                  <span>{link.label}</span>
                </Link>
              ))}
            </nav>
            <div className="mobile-menu-section">
              <p>Customer</p>
              {isCustomerLoggedIn ? (
                <>
                  <Link href="/account" onClick={closeMobileMenu}><UserRound size={17} /> My Account</Link>
                  <Link href="/account/orders" onClick={closeMobileMenu}><Home size={17} /> Orders</Link>
                  <Link href="/account/addresses" onClick={closeMobileMenu}><Home size={17} /> Addresses</Link>
                  <CustomerLogoutForm />
                </>
              ) : (
                <>
                  <Link href="/account/login" onClick={closeMobileMenu}><LogIn size={17} /> Login</Link>
                  <Link href="/account/register" onClick={closeMobileMenu}><UserRound size={17} /> Register</Link>
                </>
              )}
            </div>
            <div className="mobile-menu-section">
              <p>Shop</p>
              <button type="button" onClick={() => { closeMobileMenu(); openCartDrawer(); }}><ShoppingBag size={17} /> Cart{cartQuantity ? ` (${cartQuantity})` : ""}</button>
              {cartQuantity ? <Link href="/checkout" onClick={closeMobileMenu}>Checkout</Link> : null}
            </div>
          </aside>
        </div>
      ) : null}
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
