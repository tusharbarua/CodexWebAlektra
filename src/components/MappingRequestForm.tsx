"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { MapPin, Send } from "lucide-react";

type Division = { id: string; name: string; bnName?: string };
type District = { id: string; divisionId: string; name: string; bnName?: string };
type Upazila = { id: string; districtId: string; name: string; bnName?: string };
type Postcode = { divisionId: string; districtId: string; upazila: string; postOffice: string; postCode: string };

const serviceTypes = [
  "Photogrammetry-Based Mapping",
  "LiDAR-Based Mapping",
  "Hybrid Photogrammetry + LiDAR",
  "Power Line / Corridor Mapping",
  "Asset / Industrial Site Mapping",
  "Heritage / Structure Documentation",
  "Solar PV Plant Mapping",
  "Other Mapping Requirement"
];

const siteTypes = [
  "Solar PV Plant",
  "Industrial Rooftop",
  "Factory / Industrial Asset",
  "Power Line / Utility Corridor",
  "Heritage Structure",
  "Construction Site",
  "Land / Terrain",
  "Other"
];

const methods = ["Photogrammetry", "LiDAR", "Hybrid", "Need Alektra Recommendation"];
const deliverables = ["Orthomosaic", "3D Model / Mesh", "Point Cloud", "Digital Twin", "Inspection Report", "Asset Map", "Corridor Map", "Elevation/Contour Model", "Other"];

export function MappingRequestForm() {
  const [message, setMessage] = useState("");
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

  function scrollToValidationSummary() {
    window.setTimeout(() => {
      validationSummaryRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 40);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
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
      requiredDeliverables: form.getAll("requiredDeliverables"),
      startedAt: startedAt.current
    };
    const response = await fetch("/api/mapping-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const result = await response.json();
    if (response.ok) window.location.href = `/mapping/service-request/success?request=${encodeURIComponent(result.requestNumber)}`;
    else {
      setMessage(result.error ?? "Please check the request and try again.");
      setSending(false);
      scrollToValidationSummary();
    }
  }

  return (
    <form className="mapping-request-form" onSubmit={submit}>
      {message ? <div className="mapping-validation-summary" ref={validationSummaryRef} role="alert"><strong>Please complete the required information</strong><p>{message}</p></div> : null}
      <div className="honeypot"><label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
      <label className="mapping-field"><span>Service type</span><select name="serviceType" required>{serviceTypes.map((item) => <option value={item} key={item}>{item}</option>)}</select></label>
      <label className="mapping-field"><span>Project / site type</span><select name="projectSiteType" required>{siteTypes.map((item) => <option value={item} key={item}>{item}</option>)}</select></label>
      <label className="mapping-field"><span>Project area / approximate size</span><input name="projectSize" placeholder="Example: 12 acres, 80,000 sq ft, 4 km route, or 1 MWp" required /></label>
      <label className="mapping-field"><span>Preferred mapping method</span><select name="preferredMethod" required>{methods.map((item) => <option value={item} key={item}>{item}</option>)}</select></label>

      <div className="wide mapping-deliverables">
        <div className="mapping-form-label">Required deliverables</div>
        <div className="mapping-chip-grid">
          {deliverables.map((item) => <label key={item}><input type="checkbox" name="requiredDeliverables" value={item} /> <span>{item}</span></label>)}
        </div>
      </div>

      <div className="wide mapping-location-box">
        <div className="mapping-form-label">Project Location / Address</div>
        {!manualMode ? (
          <>
            <div className="mapping-location-grid">
              <label className="mapping-field"><span>Division</span><select name="divisionId" value={selectedDivisionId} onChange={(event) => setSelectedDivisionId(event.target.value)} required><option value="">Select division</option>{divisions.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label>
              <label className="mapping-field"><span>District</span><select name="districtId" value={selectedDistrictId} onChange={(event) => setSelectedDistrictId(event.target.value)} disabled={!selectedDivisionId || loading === "district"} required><option value="">{loading === "district" ? "Loading..." : "Select district"}</option>{districts.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label>
              <label className="mapping-field"><span>Upazila / Thana</span><select name="upazilaId" value={selectedUpazilaId} onChange={(event) => setSelectedUpazilaId(event.target.value)} disabled={!selectedDistrictId || loading === "upazila"} required><option value="">{loading === "upazila" ? "Loading..." : "Select upazila/thana"}</option>{upazilas.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label>
              <label className="mapping-field"><span>Post Office / Postal Code</span><select name="postcodeSelection" value={selectedPostcode} onChange={(event) => setSelectedPostcode(event.target.value)} disabled={!selectedDistrictId || loading === "postcode"}><option value="">Optional</option>{filteredPostcodes.map((item) => <option value={`${item.postOffice}__${item.postCode}`} key={`${item.postOffice}-${item.postCode}`}>{item.postOffice} - {item.postCode}</option>)}</select></label>
            </div>
            <button className="mapping-secondary-button" type="button" onClick={() => setManualMode(true)}>Can&apos;t find your area? Enter address manually.</button>
          </>
        ) : (
          <div className="mapping-manual-address">
            <label className="mapping-field"><span>Address</span><input name="manualDistrictArea" placeholder="Enter your detailed address here" required /></label>
            <p>Please include building/factory name, road, area, district, and any nearby landmark.</p>
          </div>
        )}
        <input type="hidden" name="divisionName" value={selectedDivision?.name ?? ""} />
        <input type="hidden" name="districtName" value={selectedDistrict?.name ?? ""} />
        <input type="hidden" name="upazilaName" value={selectedUpazila?.name ?? ""} />
        <input type="hidden" name="postOffice" value={selectedPostcodeRow?.postOffice ?? ""} />
        <input type="hidden" name="postalCode" value={selectedPostcodeRow?.postCode ?? ""} />
      </div>

      <label className="mapping-field wide"><span>Detailed address</span><input name="addressLine" required /></label>
      <label className="mapping-field"><span>Institution name</span><input name="institutionName" required /></label>
      <label className="mapping-field"><span>Contact person</span><input name="contactPerson" required /></label>
      <label className="mapping-field"><span>Email</span><input name="email" type="email" /></label>
      <label className="mapping-field"><span>Contact number</span><input name="contactNumber" required /></label>
      <label className="mapping-field wide"><span>Additional notes</span><textarea name="additionalNotes" rows={5} /></label>
      <label className="mapping-field"><span>Quick check: 8 + 4 = ?</span><input name="mathAnswer" inputMode="numeric" required /></label>
      <div className="mapping-form-submit"><p><MapPin size={16} /> Whatever it is, we map it with precision.</p><button className="mapping-primary-button" disabled={sending}><Send size={18} />{sending ? "Submitting" : "Request Mapping Service"}</button></div>
    </form>
  );
}
