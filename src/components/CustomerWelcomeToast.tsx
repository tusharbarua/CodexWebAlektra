"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, X } from "lucide-react";

export function CustomerWelcomeToast({ name }: { name?: string }) {
  const [visible, setVisible] = useState(true);
  const firstName = useMemo(() => name?.trim().split(/\s+/)[0] ?? "", [name]);

  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.has("welcome")) {
      url.searchParams.delete("welcome");
      window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
    }
    const timer = window.setTimeout(() => setVisible(false), 4200);
    return () => window.clearTimeout(timer);
  }, []);

  if (!visible) return null;
  return (
    <div className="customer-toast" role="status" aria-live="polite">
      <CheckCircle2 size={18} />
      <span>{firstName ? `Welcome back, ${firstName}.` : "Welcome back."}</span>
      <button type="button" onClick={() => setVisible(false)} aria-label="Close welcome notification">
        <X size={15} />
      </button>
    </div>
  );
}
