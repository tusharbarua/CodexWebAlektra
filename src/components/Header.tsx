import Link from "next/link";
import Image from "next/image";
import { ShoppingCart, UserRound } from "lucide-react";
import { brand } from "@/data/site";

export function Header() {
  return (
    <header className="site-header">
      <div className="container nav">
        <Link className="brand-mark" href="/" aria-label="Alektra Renewable home">
          <Image src={brand.logo} alt="Alektra Renewable" width={260} height={80} unoptimized priority />
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
          <Link className="btn dark" href="/cart" aria-label="Cart">
            <ShoppingCart size={18} />
            Cart
          </Link>
        </div>
      </div>
    </header>
  );
}
