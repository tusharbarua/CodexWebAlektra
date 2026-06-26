"use client";

import { FormEvent, useRef, useState } from "react";
import { Send } from "lucide-react";

export function ContactForm() {
  const startedAt = useRef(Date.now());
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");
    setMessage("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...Object.fromEntries(form.entries()), startedAt: startedAt.current })
    });
    const result = await response.json();
    if (response.ok) {
      setStatus("sent");
      setMessage("Thank you. Alektra will contact you shortly.");
      event.currentTarget.reset();
      startedAt.current = Date.now();
    } else {
      setStatus("error");
      setMessage(result.error ?? "Please check the form and try again.");
    }
  }

  return (
    <form className="panel form-grid" onSubmit={submit}>
      <div className="honeypot" aria-hidden="true">
        <label htmlFor="website">Website</label>
        <input id="website" name="website" tabIndex={-1} autoComplete="off" />
      </div>
      <div className="field"><label htmlFor="name">Name</label><input id="name" name="name" required /></div>
      <div className="field"><label htmlFor="email">Email</label><input id="email" name="email" type="email" required /></div>
      <div className="field"><label htmlFor="phone">Phone</label><input id="phone" name="phone" /></div>
      <div className="field"><label htmlFor="company">Company</label><input id="company" name="company" /></div>
      <div className="field wide"><label htmlFor="interest">Interest</label><select id="interest" name="interest" required><option>Alektra EPC</option><option>Alektra Thermal</option><option>Alektra Sparkle</option><option>Alektra Mapping</option><option>E-commerce order</option></select></div>
      <div className="field wide"><label htmlFor="message">Message</label><textarea id="message" name="message" rows={5} required /></div>
      <div className="field wide"><label htmlFor="mathAnswer">Quick check: 4 + 7 = ?</label><input id="mathAnswer" name="mathAnswer" inputMode="numeric" required /></div>
      <button className="btn wide" type="submit" disabled={status === "sending"}><Send size={18} />{status === "sending" ? "Sending" : "Send enquiry"}</button>
      {message ? <p className={`wide form-message ${status}`}>{message}</p> : null}
    </form>
  );
}
