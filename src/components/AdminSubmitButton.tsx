"use client";

import { useFormStatus } from "react-dom";

export function AdminSubmitButton({ idleLabel, pendingLabel = "Saving..." }: { idleLabel: string; pendingLabel?: string }) {
  const { pending } = useFormStatus();
  return (
    <button className="btn" type="submit" disabled={pending} aria-busy={pending}>
      {pending ? pendingLabel : idleLabel}
    </button>
  );
}

