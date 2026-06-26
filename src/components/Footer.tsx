"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { brand } from "@/data/site";

export function Footer() {
  const pathname = usePathname();
  const thermal = pathname.startsWith("/thermal");
  return (
    <footer className={`site-footer ${thermal ? "thermal-footer" : ""}`}>
      <div className="container footer-grid">
        <div>
          <span style={{ display: "inline-block", background: "#fff", borderRadius: 8, padding: 10 }}>
            <Image src={brand.logo} alt="Alektra Renewable" width={260} height={80} unoptimized />
          </span>
          <p>Solar EPC, thermal inspection, cleaning and mapping for renewable-energy assets in Bangladesh.</p>
        </div>
        <div>
          <strong>Company</strong>
          <p>
            <Link href="/#epc">Alektra EPC</Link>
            <br />
            <Link href="/thermal">Alektra Thermal</Link>
            <br />
            <Link href="/#subdivisions">Alektra Sparkle</Link>
            <br />
            <Link href="/#subdivisions">Alektra Mapping</Link>
          </p>
        </div>
        <div>
          <strong>{brand.domain}</strong>
          <p>
            {brand.email}
            <br />
            {brand.phone}
            <br />
            {brand.address}
          </p>
        </div>
      </div>
    </footer>
  );
}
