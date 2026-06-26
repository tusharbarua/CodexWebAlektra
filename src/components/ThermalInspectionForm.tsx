"use client";

import { FormEvent, useMemo, useRef, useState } from "react";
import { MapPin, Plus, Send, Trash2 } from "lucide-react";
import { ThermalLocationPicker } from "@/components/ThermalLocationPicker";

type ModuleRow = { model: string; capacityWp: number; quantity: number };

export function ThermalInspectionForm() {
  const [modules, setModules] = useState<ModuleRow[]>([{ model: "", capacityWp: 0, quantity: 0 }]);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const startedAt = useRef(Date.now());
  const capacity = useMemo(() => modules.reduce((sum, row) => sum + row.capacityWp * row.quantity, 0) / 1000, [modules]);
  const update = (index: number, patch: Partial<ModuleRow>) => setModules((rows) => rows.map((row, rowIndex) => rowIndex === index ? { ...row, ...patch } : row));

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (capacity < 50) { setMessage("Minimum thermal inspection site size is 50 kWp."); return; }
    setSending(true); setMessage("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/thermal-inspections", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...Object.fromEntries(form.entries()), modules, startedAt: startedAt.current })
    });
    const result = await response.json();
    if (response.ok) window.location.href = `/thermal/inspection-request/success?request=${encodeURIComponent(result.requestNumber)}`;
    else { setMessage(result.error ?? "Please check the request and try again."); setSending(false); }
  }

  return <form className="thermal-request-form" onSubmit={submit}>
    <div className="honeypot"><label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
    <label className="thermal-field"><span>Type of inspection</span><select name="inspectionType"><option value="STANDARD">Standard</option><option value="COMPREHENSIVE">Comprehensive</option></select></label>
    <div className="wide"><div className="thermal-form-label">PV module information</div>{modules.map((row, index) => <div className="module-row" key={index}>
      <label className="thermal-field"><span>PV Module Model Number</span><input value={row.model} onChange={(e) => update(index, { model: e.target.value })} required /></label>
      <label className="thermal-field"><span>Module capacity (Wp)</span><input type="number" min="1" value={row.capacityWp || ""} onChange={(e) => update(index, { capacityWp: Number(e.target.value) })} required /></label>
      <label className="thermal-field"><span>Number of modules</span><input type="number" min="1" value={row.quantity || ""} onChange={(e) => update(index, { quantity: Number(e.target.value) })} required /></label>
      {modules.length > 1 ? <button type="button" className="thermal-icon-button" onClick={() => setModules((rows) => rows.filter((_, rowIndex) => rowIndex !== index))} aria-label="Remove module type"><Trash2 size={18}/></button> : null}
    </div>)}
      <button type="button" className="thermal-secondary-button" onClick={() => setModules((rows) => [...rows, { model: "", capacityWp: 0, quantity: 0 }])}><Plus size={17}/> Add another module type</button>
      <div className={`capacity-readout ${capacity < 50 ? "below" : "valid"}`}><strong>{capacity.toFixed(2)} kWp</strong><span>Calculated PV capacity</span></div>
    </div>
    <label className="thermal-field"><span>AC Capacity (kW)</span><input name="acCapacityKw" type="number" min="0" step="0.01" required /></label>
    <ThermalLocationPicker />
    <label className="thermal-field"><span>Institution Name</span><input name="institutionName" required /></label>
    <label className="thermal-field"><span>Address</span><input name="address" required /></label>
    <label className="thermal-field"><span>Mail ID</span><input name="email" type="email" required /></label>
    <label className="thermal-field"><span>Contact Number</span><input name="contactNumber" required /></label>
    <label className="thermal-field wide"><span>Message / Additional Notes</span><textarea name="additionalNotes" rows={5} /></label>
    <label className="thermal-field"><span>Quick check: 6 + 5 = ?</span><input name="mathAnswer" inputMode="numeric" required /></label>
    <div className="thermal-form-submit"><p><MapPin size={16}/> Minimum thermal inspection site size: <strong>50 kWp</strong></p><button className="thermal-primary-button" disabled={sending || capacity < 50}><Send size={18}/>{sending ? "Submitting" : "Request an Inspection"}</button></div>
    {message ? <p className="thermal-form-message">{message}</p> : null}
  </form>;
}
