import Link from "next/link";
import { ShoppingCart, UserRound } from "lucide-react";
import { brand } from "@/data/site";

export function Header() {
  return (
    <header className="site-header">
      <div className="container nav">
        <Link className="brand-mark" href="/" aria-label="Alektra Renewable home">
          <img src={brand.logo} alt="Alektra Renewable" />
        </Link>
        <nav className="nav-links" aria-label="Primary navigation">
          <a href="/#epc">EPC</a>
          <a href="/#subdivisions">Thermal</a>
          <a href="/#subdivisions">Sparkle</a>
          <a href="/#subdivisions">Mapping</a>
          <Link href="/resources">Resources</Link>
          <Link href="/shop">Shop</Link>
        </nav>
        <div className="nav-actions">
          <Link className="btn secondary" href="/account/orders" aria-label="Account">
            <UserRound size={18} />
            Account
          </Link>
          <Link className="btn dark" href="/cart" aria-label="Cart">
            <ShoppingCart size={18} />
            Cart
          </Link>
        </div>
      </div>
    </header>
  );
}
