"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { createPortal } from "react-dom";
import { PolicyFormattedText } from "@/components/PolicyFormattedText";
import type { PublicLegalDocument } from "@/lib/legal-documents";

type SiteMapGroup = {
  title: string;
  links: Array<{ label: string; href: string }>;
};

type LegalModal =
  | { type: "document"; document: PublicLegalDocument }
  | { type: "site-map" };

const labels: Record<string, string> = {
  privacy: "Privacy Policy",
  "terms-of-use": "Terms of Use",
  "sales-and-refunds": "Sales and Refunds",
  legal: "Legal"
};

export function FooterLegalBar({
  documents,
  siteMapGroups,
  currentYear
}: {
  documents: PublicLegalDocument[];
  siteMapGroups: SiteMapGroup[];
  currentYear: number;
}) {
  const [modal, setModal] = useState<LegalModal | null>(null);
  const [mounted, setMounted] = useState(false);
  const modalBodyRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const modalTitleId = useId();
  const modalKey = modal?.type === "document" ? modal.document.slug : modal?.type ?? "";
  const orderedDocs = useMemo(() => {
    const order = ["privacy", "terms-of-use", "sales-and-refunds", "legal"];
    return order.map((key) => documents.find((document) => document.documentKey === key)).filter(Boolean) as PublicLegalDocument[];
  }, [documents]);

  const closeModal = useCallback(() => {
    setModal(null);
    window.setTimeout(() => previousFocusRef.current?.focus(), 0);
  }, []);

  const openModal = (nextModal: LegalModal) => {
    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setModal(nextModal);
    window.requestAnimationFrame(() => {
      document.querySelector<HTMLElement>(".footer-legal-modal")?.scrollTo({ top: 0, left: 0, behavior: "auto" });
      modalBodyRef.current?.scrollTo({ top: 0, left: 0, behavior: "auto" });
    });
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!modal) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeModal();
    };
    window.addEventListener("keydown", onKeyDown);
    window.setTimeout(() => document.querySelector<HTMLElement>(".footer-legal-modal-close")?.focus(), 40);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [closeModal, modal]);

  useEffect(() => {
    if (!modal) return;
    window.requestAnimationFrame(() => {
      document.querySelector<HTMLElement>(".footer-legal-modal")?.scrollTo({ top: 0, left: 0, behavior: "auto" });
      modalBodyRef.current?.scrollTo({ top: 0, left: 0, behavior: "auto" });
    });
  }, [modal, modalKey]);

  return (
    <div className="footer-legal-bar">
      <p>Copyright © {currentYear} Alektra Renewable. All rights reserved.</p>
      <nav aria-label="Footer legal links">
        {orderedDocs.map((document) => (
          <button type="button" key={document.documentKey} onClick={() => openModal({ type: "document", document })}>
            {labels[document.documentKey] ?? document.title}
          </button>
        ))}
        <button type="button" onClick={() => openModal({ type: "site-map" })}>Site Map</button>
      </nav>
      {mounted && modal ? createPortal(
        <div className="footer-legal-modal-overlay" onMouseDown={closeModal}>
          <section
            className="footer-legal-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby={modalTitleId}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header>
              <div>
                <p className="kicker">Alektra Legal</p>
                <h2 id={modalTitleId}>{modal.type === "site-map" ? "Site Map" : modal.document.title}</h2>
                {modal.type === "document" ? (
                  <span>Version {modal.document.version}{modal.document.effectiveDate ? ` · Effective ${new Date(modal.document.effectiveDate).toLocaleDateString("en-GB")}` : ""}</span>
                ) : (
                  <span>Important public pages and resources</span>
                )}
              </div>
              <button className="footer-legal-modal-close" type="button" onClick={closeModal} aria-label="Close legal modal">×</button>
            </header>
            <div className="footer-legal-modal-body" ref={modalBodyRef}>
              {modal.type === "document" ? (
                <div className="policy-text"><PolicyFormattedText content={modal.document.content} /></div>
              ) : (
                <SiteMapContent groups={siteMapGroups} />
              )}
            </div>
            <footer>
              <Link href={modal.type === "document" ? `/${modal.document.slug}` : "/site-map"} scroll onClick={() => setModal(null)}>Read full page</Link>
              <button className="btn footer-legal-understand" type="button" onClick={closeModal}>I Understand</button>
            </footer>
          </section>
        </div>,
        document.body
      ) : null}
    </div>
  );
}

function SiteMapContent({ groups }: { groups: SiteMapGroup[] }) {
  return (
    <div className="footer-site-map-grid">
      {groups.map((group) => (
        <section key={group.title}>
          <h3>{group.title}</h3>
          <ul>
            {group.links.map((link) => (
              <li key={link.href}>
                <Link href={link.href}>{link.label}</Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
