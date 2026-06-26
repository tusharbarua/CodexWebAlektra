"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { brand } from "@/data/site";
import { brandLogos, brandNames, getDivisionFromPath } from "@/lib/brand";
import type { FooterSettings } from "@/lib/site-settings";

export function Footer({ settings }: { settings: FooterSettings }) {
  const pathname = usePathname();
  const division = getDivisionFromPath(pathname);
  const thermal = division === "thermal";
  const logo = brandLogos[division];
  const brandName = brandNames[division];
  const socialLinks = [
    ["Facebook", settings.facebookUrl],
    ["LinkedIn", settings.linkedinUrl],
    ["YouTube", settings.youtubeUrl]
  ].filter(([, href]) => href);
  return (
    <footer className={`site-footer ${thermal ? "thermal-footer" : ""}`}>
      <div className="container footer-grid">
        <div>
          <span className={`footer-logo footer-logo-${division}`}>
            <Image src={logo} alt={brandName} width={420} height={120} unoptimized />
          </span>
          <p>{settings.footerDescription}</p>
          <p className="footer-copyright">{settings.copyrightText}</p>
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
            <a href={`mailto:${settings.contactEmail}`}>{settings.contactEmail}</a>
            <br />
            <a href={`tel:${settings.contactPhone.replace(/[^\d+]/g, "")}`}>{settings.contactPhone}</a>
            <br />
            {settings.address}
          </p>
          {settings.whatsappNumber ? <p>WhatsApp: {settings.whatsappNumber}</p> : null}
          {socialLinks.length ? (
            <p className="footer-socials">
              {socialLinks.map(([label, href]) => (
                <a href={href} key={label} target="_blank" rel="noreferrer">{label}</a>
              ))}
            </p>
          ) : null}
        </div>
      </div>
    </footer>
  );
}
