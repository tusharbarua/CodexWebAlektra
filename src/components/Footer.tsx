"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Mail, MapPin, Phone } from "lucide-react";
import { brand } from "@/data/site";
import { FooterLegalBar } from "@/components/FooterLegalBar";
import { brandLogos, brandNames, getDivisionFromPath } from "@/lib/brand";
import type { PublicLegalDocument } from "@/lib/legal-documents";
import type { FooterSettings } from "@/lib/site-settings";

type SiteMapGroup = {
  title: string;
  links: Array<{ label: string; href: string }>;
};

export function Footer({
  settings,
  legalDocuments,
  siteMapGroups
}: {
  settings: FooterSettings;
  legalDocuments: PublicLegalDocument[];
  siteMapGroups: SiteMapGroup[];
}) {
  const pathname = usePathname();
  const division = getDivisionFromPath(pathname);
  const epc = division === "epc";
  const thermal = division === "thermal";
  const sparkle = division === "sparkle";
  const mapping = division === "mapping";
  const logo = brandLogos[division];
  const brandName = brandNames[division];
  const socialLinks = [
    ["Facebook", settings.facebookUrl],
    ["LinkedIn", settings.linkedinUrl],
    ["YouTube", settings.youtubeUrl]
  ].filter(([, href]) => href);
  const phoneNumbers = [settings.contactPhone, settings.secondaryPhone].filter((phone): phone is string => Boolean(phone));
  return (
    <footer className={`site-footer ${epc ? "epc-footer" : ""} ${thermal ? "thermal-footer" : ""} ${sparkle ? "sparkle-footer" : ""} ${mapping ? "mapping-footer" : ""}`}>
      <div className="container footer-grid">
        <div>
          <span className={`footer-logo footer-logo-${division}`}>
            <Image src={logo} alt={brandName} width={420} height={120} unoptimized />
          </span>
          <p>{settings.footerDescription}</p>
        </div>
        <div>
          <strong>Company</strong>
          <p>
            <Link href="/#epc">Alektra EPC</Link>
            <br />
            <Link href="/thermal">Alektra Thermal</Link>
            <br />
            <Link href="/sparkle">Alektra Sparkle</Link>
            <br />
            <Link href="/mapping">Alektra Mapping</Link>
          </p>
        </div>
        <div>
          <strong>{brand.domain}</strong>
          <div className="footer-contact-list">
            <p className="footer-contact-item">
              <Mail size={16} aria-hidden="true" />
              <a href={`mailto:${settings.contactEmail}`}>{settings.contactEmail}</a>
            </p>
            <p className="footer-contact-item">
              <Phone size={16} aria-hidden="true" />
              <span>
                {phoneNumbers.map((phone, index) => (
                  <span className="footer-phone-link" key={phone}>
                    <a href={`tel:${phone.replace(/[^\d+]/g, "")}`}>{phone}</a>
                    {index < phoneNumbers.length - 1 ? <span aria-hidden="true"> | </span> : null}
                  </span>
                ))}
              </span>
            </p>
            <p className="footer-contact-item">
              <MapPin size={16} aria-hidden="true" />
              <span>{settings.address}</span>
            </p>
          </div>
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
      <div className="container">
        <FooterLegalBar
          documents={legalDocuments}
          siteMapGroups={siteMapGroups}
          currentYear={new Date().getFullYear()}
        />
      </div>
    </footer>
  );
}
