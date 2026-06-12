"use client";

import { FormEvent, useState } from "react";
import { Send } from "lucide-react";

export function ContactForm() {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());
    const response = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    setStatus(response.ok ? "sent" : "error");
    if (response.ok) event.currentTarget.reset();
  }

  return (
    <form className="panel form-grid" onSubmit={submit}>
      <div className="field">
        <label htmlFor="name">Name</label>
        <input id="name" name="name" required />
      </div>
      <div className="field">
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" required />
      </div>
      <div className="field">
        <label htmlFor="phone">Phone</label>
        <input id="phone" name="phone" />
      </div>
      <div className="field">
        <label htmlFor="company">Company</label>
        <input id="company" name="company" />
      </div>
      <div className="field wide">
        <label htmlFor="interest">Interest</label>
        <select id="interest" name="interest" required>
          <option>Alektra EPC</option>
          <option>Alektra Thermal</option>
          <option>Alektra Sparkle</option>
          <option>Alektra Mapping</option>
          <option>E-commerce order</option>
        </select>
      </div>
      <div className="field wide">
        <label htmlFor="message">Message</label>
        <textarea id="message" name="message" rows={5} required />
      </div>
      <button className="btn wide" type="submit" disabled={status === "sending"}>
        <Send size={18} />
        {status === "sending" ? "Sending" : "Send enquiry"}
      </button>
      {status === "sent" ? <p className="wide">Thank you. Alektra will contact you shortly.</p> : null}
      {status === "error" ? <p className="wide">Something went wrong. Please try again.</p> : null}
    </form>
  );
}
