"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { MapPin, Plus, Send, Trash2 } from "lucide-react";

type ModuleRow = { model: string; capacityWp: number; quantity: number };
type Division = { id: string; name: string; bnName?: string };
type District = { id: string; divisionId: string; name: string; bnName?: string };
type Upazila = { id: string; districtId: string; name: string; bnName?: string };
type Postcode = { divisionId: string; districtId: string; upazila: string; postOffice: string; postCode: string };

const inspectionOptions = [
  ["STANDARD", "Standard Inspection"],
  ["COMPREHENSIVE", "Comprehensive Inspection"]
];

export function ThermalInspectionForm() {
  const [modules, setModules] = useState<ModuleRow[]>([{ model: "", capacityWp: 0, quantity: 0 }]);
  const [message, setMessage] = useState("");
  const [capacityAttempted, setCapacityAttempted] = useState(false);
  const [sending, setSending] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [upazilas, setUpazilas] = useState<Upazila[]>([]);
  const [postcodes, setPostcodes] = useState<Postcode[]>([]);
  const [selectedDivisionId, setSelectedDivisionId] = useState("");
  const [selectedDistrictId, setSelectedDistrictId] = useState("");
  const [selectedUpazilaId, setSelectedUpazilaId] = useState("");
  const [selectedPostcode, setSelectedPostcode] = useState("");
  const [loading, setLoading] = useState("");
  const startedAt = useRef(Date.now());
  const validationSummaryRef = useRef<HTMLDivElement>(null);
  const capacity = useMemo(() => modules.reduce((sum, row) => sum + row.capacityWp * row.quantity, 0) / 1000, [modules]);
  const hasModuleInput = modules.some((row) => row.model || row.capacityWp > 0 || row.quantity > 0);
  const belowMinimumCapacity = capacity < 50;
  const showCapacityWarning = belowMinimumCapacity && (hasModuleInput || capacityAttempted);
  const selectedDivision = divisions.find((item) => item.id === selectedDivisionId);
  const selectedDistrict = districts.find((item) => item.id === selectedDistrictId);
  const selectedUpazila = upazilas.find((item) => item.id === selectedUpazilaId);
  const filteredPostcodes = selectedUpazila
    ? postcodes.filter((item) => item.upazila.toLowerCase() === selectedUpazila.name.toLowerCase())
    : postcodes;
  const selectedPostcodeRow = filteredPostcodes.find((item) => `${item.postOffice}__${item.postCode}` === selectedPostcode);

  useEffect(() => {
    loadJson<{ items: Division[] }>("/api/locations/divisions", "division")
      .then((data) => setDivisions(data.items ?? []))
      .catch(() => setManualMode(true));
  }, []);

  useEffect(() => {
    setSelectedDistrictId("");
    setSelectedUpazilaId("");
    setSelectedPostcode("");
    setDistricts([]);
    setUpazilas([]);
    setPostcodes([]);
    if (!selectedDivisionId) return;
    loadJson<{ items: District[] }>(`/api/locations/districts?divisionId=${encodeURIComponent(selectedDivisionId)}`, "district")
      .then((data) => setDistricts(data.items ?? []))
      .catch(() => setManualMode(true));
  }, [selectedDivisionId]);

  useEffect(() => {
    setSelectedUpazilaId("");
    setSelectedPostcode("");
    setUpazilas([]);
    setPostcodes([]);
    if (!selectedDistrictId) return;
    Promise.all([
      loadJson<{ items: Upazila[] }>(`/api/locations/upazilas?districtId=${encodeURIComponent(selectedDistrictId)}`, "upazila"),
      loadJson<{ items: Postcode[] }>(`/api/locations/postcodes?districtId=${encodeURIComponent(selectedDistrictId)}`, "postcode")
    ])
      .then(([upazilaData, postcodeData]) => {
        setUpazilas(upazilaData.items ?? []);
        setPostcodes(postcodeData.items ?? []);
      })
      .catch(() => setManualMode(true));
  }, [selectedDistrictId]);

  function updateModule(index: number, patch: Partial<ModuleRow>) {
    setModules((rows) => rows.map((row, rowIndex) => rowIndex === index ? { ...row, ...patch } : row));
  }

  function scrollToValidationSummary() {
    window.setTimeout(() => {
      validationSummaryRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 40);
  }

  async function loadJson<T>(url: string, label: string): Promise<T> {
    setLoading(label);
    try {
      const response = await fetch(url);
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error ?? "Location data could not be loaded.");
      return data;
    } finally {
      setLoading("");
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (belowMinimumCapacity) {
      setCapacityAttempted(true);
      setMessage("Minimum Thermal inspection request size is 50 kWp.");
      scrollToValidationSummary();
      return;
    }
    if (!manualMode && (!selectedDivision || !selectedDistrict || !selectedUpazila)) {
      setMessage("Please select division, district and upazila/thana.");
      scrollToValidationSummary();
      return;
    }
    setSending(true);
    setMessage("");
    const form = new FormData(event.currentTarget);
    const payload = {
      ...Object.fromEntries(form.entries()),
      manualAddressFallback: manualMode,
      divisionName: selectedDivision?.name ?? "",
      districtName: selectedDistrict?.name ?? "",
      upazilaName: selectedUpazila?.name ?? "",
      postOffice: selectedPostcodeRow?.postOffice ?? "",
      postalCode: selectedPostcodeRow?.postCode ?? "",
      modules,
      startedAt: startedAt.current
    };
    const response = await fetch("/api/thermal-inspections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const result = await response.json();
    if (response.ok) window.location.href = `/thermal/inspection-request/success?request=${encodeURIComponent(result.requestNumber)}`;
    else {
      setMessage(result.error ?? "Please check the request and try again.");
      setSending(false);
      scrollToValidationSummary();
    }
  }

  return (
    <form className="thermal-request-form" onSubmit={submit}>
      {message ? (
        <div className="thermal-validation-summary" ref={validationSummaryRef} role="alert">
          {message === "Minimum Thermal inspection request size is 50 kWp." ? (
            <>
              <strong>Minimum Capacity Required</strong>
              <p>Alektra Thermal inspection service is available for solar PV systems of 50 kWp or above. Please update your module information or contact us for special consideration.</p>
              <ul><li>Minimum Thermal inspection request size is 50 kWp.</li></ul>
            </>
          ) : (
            <>
              <strong>Please check the highlighted information</strong>
              <p>{message}</p>
            </>
          )}
        </div>
      ) : null}
      <div className="honeypot"><label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label></div>

      <label className="thermal-field">
        <span>Type of inspection</span>
        <select name="inspectionType" required>
          {inspectionOptions.map(([value, label]) => <option value={value} key={value}>{label}</option>)}
        </select>
      </label>

      <div className="wide">
        <div className="thermal-form-label">PV module information</div>
        {modules.map((row, index) => {
          const rowCapacity = row.capacityWp * row.quantity / 1000;
          return (
            <div className="module-row thermal-module-row" key={index}>
              <label className="thermal-field"><span>Module model number</span><input value={row.model} onChange={(event) => updateModule(index, { model: event.target.value })} required /></label>
              <label className="thermal-field"><span>Module capacity (Wp)</span><input type="number" min="1" value={row.capacityWp || ""} onChange={(event) => updateModule(index, { capacityWp: Number(event.target.value) })} required /></label>
              <label className="thermal-field"><span>Number of modules</span><input type="number" min="1" value={row.quantity || ""} onChange={(event) => updateModule(index, { quantity: Number(event.target.value) })} required /></label>
              <div className="thermal-row-capacity"><span>Row capacity</span><strong>{rowCapacity.toFixed(2)} kWp</strong></div>
              {modules.length > 1 ? <button type="button" className="thermal-icon-button" onClick={() => setModules((rows) => rows.filter((_, rowIndex) => rowIndex !== index))} aria-label="Remove module type"><Trash2 size={18} /></button> : null}
            </div>
          );
        })}
        <button type="button" className="thermal-secondary-button" onClick={() => setModules((rows) => [...rows, { model: "", capacityWp: 0, quantity: 0 }])}><Plus size={17} /> Add another module type</button>
        <div className={`capacity-readout thermal-capacity-readout ${belowMinimumCapacity ? "below" : "valid"} ${showCapacityWarning ? "warning" : ""}`}>
          <strong>{capacity.toFixed(2)} kWp</strong>
          <span>Calculated PV capacity</span>
          {showCapacityWarning ? <small>Minimum Thermal inspection request size is 50 kWp.</small> : null}
        </div>
      </div>

      <label className="thermal-field"><span>AC Capacity (kW)</span><input name="acCapacityKw" type="number" min="0" step="0.01" required /></label>

      <div className="wide thermal-location-box">
        <div className="thermal-form-label">Project Location / Address</div>
        {!manualMode ? (
          <>
            <div className="thermal-location-grid">
              <label className="thermal-field"><span>Division</span><select name="divisionId" value={selectedDivisionId} onChange={(event) => setSelectedDivisionId(event.target.value)} required><option value="">Select division</option>{divisions.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label>
              <label className="thermal-field"><span>District</span><select name="districtId" value={selectedDistrictId} onChange={(event) => setSelectedDistrictId(event.target.value)} disabled={!selectedDivisionId || loading === "district"} required><option value="">{loading === "district" ? "Loading..." : "Select district"}</option>{districts.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label>
              <label className="thermal-field"><span>Upazila / Thana</span><select name="upazilaId" value={selectedUpazilaId} onChange={(event) => setSelectedUpazilaId(event.target.value)} disabled={!selectedDistrictId || loading === "upazila"} required><option value="">{loading === "upazila" ? "Loading..." : "Select upazila/thana"}</option>{upazilas.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label>
              <label className="thermal-field"><span>Post Office / Postal Code</span><select name="postcodeSelection" value={selectedPostcode} onChange={(event) => setSelectedPostcode(event.target.value)} disabled={!selectedDistrictId || loading === "postcode"}><option value="">Optional</option>{filteredPostcodes.map((item) => <option value={`${item.postOffice}__${item.postCode}`} key={`${item.postOffice}-${item.postCode}`}>{item.postOffice} - {item.postCode}</option>)}</select></label>
            </div>
            <button className="thermal-secondary-button" type="button" onClick={() => setManualMode(true)}>Can&apos;t find your area? Enter address manually.</button>
          </>
        ) : (
          <div className="thermal-manual-address">
            <label className="thermal-field"><span>Address</span><input name="manualDistrictArea" placeholder="Enter your detailed address here" required /></label>
            <p>Please include building/factory name, road, area, district, and any nearby landmark.</p>
          </div>
        )}
        <input type="hidden" name="divisionName" value={selectedDivision?.name ?? ""} />
        <input type="hidden" name="districtName" value={selectedDistrict?.name ?? ""} />
        <input type="hidden" name="upazilaName" value={selectedUpazila?.name ?? ""} />
        <input type="hidden" name="postOffice" value={selectedPostcodeRow?.postOffice ?? ""} />
        <input type="hidden" name="postalCode" value={selectedPostcodeRow?.postCode ?? ""} />
      </div>

      <label className="thermal-field wide"><span>Detailed Address</span><input name="addressLine" required /></label>
      <label className="thermal-field"><span>Institution Name</span><input name="institutionName" required /></label>
      <label className="thermal-field"><span>Email</span><input name="email" type="email" required /></label>
      <label className="thermal-field"><span>Contact Number</span><input name="contactNumber" required /></label>
      <label className="thermal-field wide"><span>Additional Notes</span><textarea name="additionalNotes" rows={5} /></label>
      <label className="thermal-field"><span>Quick check: 6 + 5 = ?</span><input name="mathAnswer" inputMode="numeric" required /></label>
      <div className="thermal-form-submit"><p><MapPin size={16} /> Minimum Thermal inspection request size: <strong>50 kWp</strong></p><button className="thermal-primary-button" disabled={sending}><Send size={18} />{sending ? "Submitting" : "Request an Inspection"}</button></div>
    </form>
  );
}
