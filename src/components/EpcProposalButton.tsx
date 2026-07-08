"use client";

import type { ReactNode } from "react";

export function EpcProposalButton({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <button
      className={className}
      type="button"
      onClick={() => {
        const section = document.getElementById("epc-proposal-form");
        section?.scrollIntoView({ behavior: "smooth", block: "start" });
        window.setTimeout(() => {
          const field = section?.querySelector<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(
            "input:not([type='hidden']), select, textarea"
          );
          field?.focus({ preventScroll: true });
        }, 520);
      }}
    >
      {children}
    </button>
  );
}
