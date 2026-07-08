"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, Send } from "lucide-react";

type FormState = {
  institutionName: string;
  contactPerson: string;
  contactNumber: string;
  email: string;
  address: string;
  facilityType: string;
  projectType: string;
  roofArea: string;
  monthlyBill: string;
  preferredCapacity: string;
  transformerInfo: string;
  additionalNotes: string;
  mathAnswer: string;
  website: string;
};

const initialForm: FormState = {
  institutionName: "",
  contactPerson: "",
  contactNumber: "",
  email: "",
  address: "",
  facilityType: "",
  projectType: "",
  roofArea: "",
  monthlyBill: "",
  preferredCapacity: "",
  transformerInfo: "",
  additionalNotes: "",
  mathAnswer: "",
  website: ""
};

const bdMobilePattern = /^(?:\+?8801|01)[3-9]\d{8}$/;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizePhone(value: string) {
  return value.replace(/[\s-]/g, "");
}

function createChallenge() {
  const a = Math.floor(Math.random() * 8) + 4;
  const b = Math.floor(Math.random() * 7) + 3;
  return { a, b, answer: a + b };
}

const initialChallenge = { a: 7, b: 4, answer: 11 };

export function EpcProposalForm() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [summary, setSummary] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [challenge, setChallenge] = useState(initialChallenge);
  const startedAt = useMemo(() => Date.now(), []);
  const summaryRef = useRef<HTMLDivElement>(null);
  const fieldRefs = useRef<Record<string, HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null>>({});

  useEffect(() => {
    setChallenge(createChallenge());
  }, []);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      const next = { ...current };
      delete next[key];
      return next;
    });
    setServerError(null);
  }

  function validate() {
    const next: Record<string, string> = {};
    if (!form.institutionName.trim()) next.institutionName = "Company/institution name is required.";
    if (!form.contactPerson.trim()) next.contactPerson = "Contact person name is required.";
    if (!bdMobilePattern.test(normalizePhone(form.contactNumber))) next.contactNumber = "Please enter a valid Bangladeshi mobile number.";
    if (form.email.trim() && !emailPattern.test(form.email.trim())) next.email = "Please enter a valid email address, or leave it blank.";
    if (!form.address.trim()) next.address = "Project location/address is required.";
    if (!form.facilityType) next.facilityType = "Facility type is required.";
    if (!form.projectType) next.projectType = "Project type is required.";
    if (Number(form.mathAnswer) !== challenge.answer) next.mathAnswer = "Please solve the math challenge correctly before submitting.";
    return next;
  }

  function showValidation(next: Record<string, string>) {
    const messages = Object.values(next);
    setErrors(next);
    setSummary(messages);
    window.setTimeout(() => {
      summaryRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      const firstKey = Object.keys(next)[0];
      window.setTimeout(() => fieldRefs.current[firstKey]?.focus({ preventScroll: true }), 360);
    }, 20);
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSuccess(null);
    setServerError(null);
    const next = validate();
    if (Object.keys(next).length) {
      showValidation(next);
      return;
    }
    setSubmitting(true);
    try {
      const response = await fetch("/api/epc-proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, startedAt, mathA: challenge.a, mathB: challenge.b, mathAnswer: Number(form.mathAnswer) })
      });
      const result = await response.json();
      if (!response.ok) {
        if (result?.fieldErrors) showValidation(result.fieldErrors);
        else setServerError(result?.error ?? "We could not submit your proposal request. Please try again.");
        return;
      }
      setForm(initialForm);
      setChallenge(createChallenge());
      setSummary([]);
      setErrors({});
      setSuccess(`Your proposal request has been received. Reference: ${result.requestNumber}`);
    } catch {
      setServerError("We could not submit your proposal request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass = (name: keyof FormState) => (errors[name] ? "epc-form-invalid" : "");

  return (
    <form className="epc-proposal-form epc-crystal-card" onSubmit={submit} noValidate>
      <input type="text" name="website" value={form.website} onChange={(event) => update("website", event.target.value)} tabIndex={-1} autoComplete="off" className="honeypot-field" />
      <div ref={summaryRef} className={`epc-validation-summary ${summary.length || serverError ? "show" : ""}`} tabIndex={-1}>
        <AlertCircle size={19} />
        <div>
          <strong>Please complete the required information</strong>
          <p>Before submitting your proposal request, please fix the highlighted fields below.</p>
          {serverError ? <p>{serverError}</p> : null}
          {summary.length ? (
            <ul>
              {summary.map((message) => <li key={message}>{message}</li>)}
            </ul>
          ) : null}
        </div>
      </div>

      {success ? (
        <div className="epc-form-success">
          <CheckCircle2 size={20} />
          <span>{success}</span>
        </div>
      ) : null}

      <div className="epc-proposal-grid">
        <Field label="Institution / Company Name" error={errors.institutionName} required>
          <input ref={(node) => { fieldRefs.current.institutionName = node; }} className={inputClass("institutionName")} value={form.institutionName} onChange={(event) => update("institutionName", event.target.value)} />
        </Field>
        <Field label="Contact Person Name" error={errors.contactPerson} required>
          <input ref={(node) => { fieldRefs.current.contactPerson = node; }} className={inputClass("contactPerson")} value={form.contactPerson} onChange={(event) => update("contactPerson", event.target.value)} />
        </Field>
        <Field label="Contact Number" error={errors.contactNumber} required>
          <input ref={(node) => { fieldRefs.current.contactNumber = node; }} className={inputClass("contactNumber")} value={form.contactNumber} onChange={(event) => update("contactNumber", event.target.value)} placeholder="017XXXXXXXX" />
        </Field>
        <Field label="Email" error={errors.email}>
          <input ref={(node) => { fieldRefs.current.email = node; }} className={inputClass("email")} value={form.email} onChange={(event) => update("email", event.target.value)} placeholder="name@example.com" />
        </Field>
        <Field label="Facility Type" error={errors.facilityType} required>
          <select ref={(node) => { fieldRefs.current.facilityType = node; }} className={inputClass("facilityType")} value={form.facilityType} onChange={(event) => update("facilityType", event.target.value)}>
            <option value="">Select facility type</option>
            {["Industrial", "Commercial", "Factory Rooftop", "Warehouse", "Hospital / Institution", "Residential Large System", "Other"].map((option) => <option key={option}>{option}</option>)}
          </select>
        </Field>
        <Field label="Project Type" error={errors.projectType} required>
          <select ref={(node) => { fieldRefs.current.projectType = node; }} className={inputClass("projectType")} value={form.projectType} onChange={(event) => update("projectType", event.target.value)}>
            <option value="">Select project type</option>
            {["On-grid Solar", "Hybrid Solar", "Off-grid Solar", "Solar + ESS", "Net Metering Support", "EPC Consultation", "Other"].map((option) => <option key={option}>{option}</option>)}
          </select>
        </Field>
        <Field label="Project Location / Address" error={errors.address} required wide>
          <textarea ref={(node) => { fieldRefs.current.address = node; }} className={inputClass("address")} value={form.address} onChange={(event) => update("address", event.target.value)} placeholder="Facility address, area, district, and nearby landmark" rows={3} />
        </Field>
        <Field label="Approximate Roof Area or Available Space">
          <input value={form.roofArea} onChange={(event) => update("roofArea", event.target.value)} placeholder="Example: 45,000 sq ft" />
        </Field>
        <Field label="Monthly Electricity Bill or Average Consumption">
          <input value={form.monthlyBill} onChange={(event) => update("monthlyBill", event.target.value)} placeholder="Example: BDT 850,000 / month" />
        </Field>
        <Field label="Preferred System Capacity, if known">
          <input value={form.preferredCapacity} onChange={(event) => update("preferredCapacity", event.target.value)} placeholder="Example: 500 kWp" />
        </Field>
        <Field label="Existing Transformer / Load Information">
          <input value={form.transformerInfo} onChange={(event) => update("transformerInfo", event.target.value)} placeholder="Optional" />
        </Field>
        <Field label="Additional Notes" wide>
          <textarea value={form.additionalNotes} onChange={(event) => update("additionalNotes", event.target.value)} rows={4} />
        </Field>
        <Field label={`Math challenge: What is ${challenge.a} + ${challenge.b}?`} error={errors.mathAnswer} required>
          <input ref={(node) => { fieldRefs.current.mathAnswer = node; }} className={inputClass("mathAnswer")} value={form.mathAnswer} onChange={(event) => update("mathAnswer", event.target.value)} inputMode="numeric" />
        </Field>
      </div>
      <button className="epc-btn primary epc-submit-btn" type="submit" disabled={submitting}>
        <Send size={17} />
        {submitting ? "Submitting..." : "Submit Proposal Request"}
      </button>
    </form>
  );
}

function Field({ label, error, children, required = false, wide = false }: { label: string; error?: string; children: React.ReactNode; required?: boolean; wide?: boolean }) {
  return (
    <label className={`epc-form-field ${wide ? "wide" : ""}`}>
      <span>{label}{required ? <em>*</em> : null}</span>
      {children}
      {error ? <small>{error}</small> : null}
    </label>
  );
}
