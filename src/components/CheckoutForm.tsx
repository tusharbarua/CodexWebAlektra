"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import type { FocusEventHandler } from "react";
import { AlertCircle, Check, CheckCircle2, CreditCard, MessageSquareText } from "lucide-react";
import { CartItem, CART_UPDATED_EVENT, cartSummary, readCart, writeCart } from "@/lib/cart";
import { PolicyFormattedText } from "@/components/PolicyFormattedText";
import {
  CHECKOUT_WARNING_BODY,
  CHECKOUT_WARNING_TITLE,
  EMAIL_VALIDATION_MESSAGE,
  MOBILE_VALIDATION_MESSAGE,
  OTP_REQUIRED_MESSAGE,
  isValidBangladeshMobile,
  isValidOptionalEmail,
  normalizeBangladeshMobile
} from "@/lib/checkout-validation";
import { money } from "@/lib/format";

type DeliverySettings = {
  courierEnabled: boolean;
  courierMinimumChargeBdt: number;
  pickupEnabled: boolean;
  pickupLabel: string;
  pickupAddress: string;
  pickupChargeBdt: number;
};

type CheckoutSettings = {
  requireOtpVerification: boolean;
};

type LegalSettings = {
  termsVersion: string;
  termsTitle: string;
  termsContent: string;
  termsEffectiveDate: string | null;
  refundPolicyVersion: string;
  refundTitle: string;
  refundContent: string;
  refundEffectiveDate: string | null;
};

type CheckoutErrors = Record<string, string>;

type LocationOption = {
  id: string;
  name: string;
  bnName?: string;
};

type PostcodeOption = {
  divisionId: string;
  districtId: string;
  upazila: string;
  postOffice: string;
  postCode: string;
};

type SearchResult = {
  type: "division" | "district" | "upazila" | "postcode";
  label: string;
  divisionId?: string;
  divisionName?: string;
  districtId?: string;
  districtName?: string;
  upazilaId?: string;
  upazilaName?: string;
  postOffice?: string;
  postCode?: string;
};

type SelectedLocation = {
  divisionId: string;
  divisionName: string;
  districtId: string;
  districtName: string;
  upazilaId: string;
  upazilaName: string;
  postOffice: string;
  postalCode: string;
};

type CheckoutCustomerProfile = {
  fullName: string;
  email: string;
  mobileNumber: string | null;
};

type CheckoutSavedAddress = {
  id: string;
  recipientName: string;
  mobileNumber: string;
  divisionId: string | null;
  divisionName: string;
  districtId: string | null;
  districtName: string;
  upazilaId: string | null;
  upazilaName: string;
  addressLine: string;
  postalCode: string | null;
  deliveryNotes: string | null;
  isDefault: boolean;
};

export function CheckoutForm({
  deliverySettings,
  checkoutSettings,
  legalSettings,
  customerProfile,
  savedAddresses = []
}: {
  deliverySettings: DeliverySettings;
  checkoutSettings: CheckoutSettings;
  legalSettings: LegalSettings;
  customerProfile?: CheckoutCustomerProfile | null;
  savedAddresses?: CheckoutSavedAddress[];
}) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<CheckoutErrors>({});
  const [showWarning, setShowWarning] = useState(false);
  const [deliveryMethod, setDeliveryMethod] = useState(deliverySettings.courierEnabled ? "COURIER" : "PICKUP");
  const [mobile, setMobile] = useState(customerProfile?.mobileNumber ?? "");
  const [otp, setOtp] = useState("");
  const [otpVerified, setOtpVerified] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [otpMessage, setOtpMessage] = useState("");
  const [manualAddressFallback, setManualAddressFallback] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [createAccount, setCreateAccount] = useState(false);
  const [locationMessage, setLocationMessage] = useState("");
  const [divisions, setDivisions] = useState<LocationOption[]>([]);
  const [districts, setDistricts] = useState<LocationOption[]>([]);
  const [upazilas, setUpazilas] = useState<LocationOption[]>([]);
  const [postcodes, setPostcodes] = useState<PostcodeOption[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [loadingLocation, setLoadingLocation] = useState<Record<string, boolean>>({});
  const [legalModal, setLegalModal] = useState<"terms" | "refund" | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<SelectedLocation>({
    divisionId: "",
    divisionName: "",
    districtId: "",
    districtName: "",
    upazilaId: "",
    upazilaName: "",
    postOffice: "",
    postalCode: ""
  });
  const subtotal = useMemo(() => cartSummary(items).total, [items]);
  const deliveryCharge = deliveryMethod === "COURIER" ? deliverySettings.courierMinimumChargeBdt : deliverySettings.pickupChargeBdt;
  const total = subtotal + deliveryCharge;
  const otpRequired = checkoutSettings.requireOtpVerification;
  const formRef = useRef<HTMLFormElement>(null);
  const validationSummaryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sync = () => setItems(readCart());
    sync();
    window.addEventListener(CART_UPDATED_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(CART_UPDATED_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  useEffect(() => {
    if (customerProfile?.mobileNumber) setMobile(customerProfile.mobileNumber);
  }, [customerProfile?.mobileNumber]);

  useEffect(() => {
    if (deliveryMethod !== "COURIER" || manualAddressFallback || divisions.length) return;
    let cancelled = false;
    async function loadInitialDivisions() {
      setLoadingLocation((current) => ({ ...current, division: true }));
      try {
        const response = await fetch("/api/locations/divisions");
        const data = await response.json();
        if (!response.ok || !data.ok) throw new Error(data.error ?? "Location list could not be loaded.");
        if (!cancelled) {
          setDivisions(Array.isArray(data.items) ? data.items : []);
          setLocationMessage("");
        }
      } catch {
        if (!cancelled) {
          setDivisions([]);
          setManualAddressFallback(true);
          setLocationMessage("Location dataset could not be loaded. Please enter your address manually.");
        }
      } finally {
        if (!cancelled) setLoadingLocation((current) => ({ ...current, division: false }));
      }
    }
    loadInitialDivisions();
    return () => {
      cancelled = true;
    };
  }, [deliveryMethod, manualAddressFallback, divisions.length]);

  useEffect(() => {
    if (!legalModal) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setLegalModal(null);
      if (event.key === "Tab") trapModalFocus(event);
    };
    window.addEventListener("keydown", onKeyDown);
    window.setTimeout(() => {
      document.querySelector<HTMLElement>(".checkout-legal-modal button, .checkout-legal-modal [href], .checkout-legal-modal [tabindex]:not([tabindex='-1'])")?.focus();
    }, 60);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [legalModal]);

  async function loadDistricts(divisionId: string) {
    if (!divisionId) return;
    await loadLocationOptions(`/api/locations/districts?divisionId=${encodeURIComponent(divisionId)}`, "district", setDistricts);
  }

  async function loadUpazilas(districtId: string) {
    if (!districtId) return;
    await loadLocationOptions(`/api/locations/upazilas?districtId=${encodeURIComponent(districtId)}`, "upazila", setUpazilas);
  }

  async function loadPostcodes(districtId: string) {
    if (!districtId) return;
    await loadLocationOptions(`/api/locations/postcodes?districtId=${encodeURIComponent(districtId)}`, "postcode", setPostcodes);
  }

  async function loadLocationOptions<T>(endpoint: string, key: string, setter: (items: T[]) => void) {
    setLoadingLocation((current) => ({ ...current, [key]: true }));
    try {
      const response = await fetch(endpoint);
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error ?? "Location list could not be loaded.");
      setter(Array.isArray(data.items) ? data.items : []);
      setLocationMessage("");
    } catch {
      setter([]);
      setManualAddressFallback(true);
      setLocationMessage("Location dataset could not be loaded. Please enter your address manually.");
    } finally {
      setLoadingLocation((current) => ({ ...current, [key]: false }));
    }
  }

  function selectDivision(value: string) {
    const option = divisions.find((item) => item.id === value);
    setSelectedLocation({
      divisionId: option?.id ?? "",
      divisionName: option?.name ?? "",
      districtId: "",
      districtName: "",
      upazilaId: "",
      upazilaName: "",
      postOffice: "",
      postalCode: ""
    });
    setDistricts([]);
    setUpazilas([]);
    setPostcodes([]);
    updateError("divisionId", option ? "" : "Please select your division.");
    updateError("districtId", "");
    updateError("upazilaId", "");
    if (option) loadDistricts(option.id);
  }

  function selectDistrict(value: string) {
    const option = districts.find((item) => item.id === value);
    setSelectedLocation((current) => ({
      ...current,
      districtId: option?.id ?? "",
      districtName: option?.name ?? "",
      upazilaId: "",
      upazilaName: "",
      postOffice: "",
      postalCode: ""
    }));
    setUpazilas([]);
    setPostcodes([]);
    updateError("districtId", option ? "" : "Please select your district.");
    updateError("upazilaId", "");
    if (option) {
      loadUpazilas(option.id);
      loadPostcodes(option.id);
    }
  }

  function selectUpazila(value: string) {
    const option = upazilas.find((item) => item.id === value);
    setSelectedLocation((current) => ({
      ...current,
      upazilaId: option?.id ?? "",
      upazilaName: option?.name ?? "",
      postOffice: "",
      postalCode: ""
    }));
    updateError("upazilaId", option ? "" : "Please select your upazila/thana.");
  }

  function selectPostcode(value: string) {
    const option = filteredPostcodes().find((item) => postcodeValue(item) === value);
    setSelectedLocation((current) => ({
      ...current,
      postOffice: option?.postOffice ?? "",
      postalCode: option?.postCode ?? ""
    }));
  }

  async function searchLocation() {
    const query = searchQuery.trim();
    if (!query) {
      setSearchResults([]);
      return;
    }
    setLoadingLocation((current) => ({ ...current, search: true }));
    try {
      const response = await fetch(`/api/locations/search?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error ?? "Location search failed.");
      setSearchResults(Array.isArray(data.items) ? data.items : []);
    } catch {
      setSearchResults([]);
      setLocationMessage("Location search is unavailable. Please enter your address manually.");
    } finally {
      setLoadingLocation((current) => ({ ...current, search: false }));
    }
  }

  async function applySearchResult(result: SearchResult) {
    setManualAddressFallback(false);
    if (!divisions.length) await loadLocationOptions("/api/locations/divisions", "division", setDivisions);
    setSelectedLocation({
      divisionId: result.divisionId ?? "",
      divisionName: result.divisionName ?? "",
      districtId: result.districtId ?? "",
      districtName: result.districtName ?? "",
      upazilaId: result.upazilaId ?? "",
      upazilaName: result.upazilaName ?? "",
      postOffice: result.postOffice ?? "",
      postalCode: result.postCode ?? ""
    });
    if (result.divisionId) await loadDistricts(result.divisionId);
    if (result.districtId) {
      await loadUpazilas(result.districtId);
      await loadPostcodes(result.districtId);
    }
    setSearchResults([]);
    setLocationMessage(result.type === "postcode" ? "Post office and postal code selected from local Bangladesh dataset." : "Location selected from local Bangladesh dataset. Add your detailed address below.");
    updateError("divisionId", result.divisionId ? "" : "Please select your division.");
    updateError("districtId", result.districtId ? "" : "Please select your district.");
    updateError("upazilaId", result.upazilaName ? "" : "Please select your upazila/thana.");
  }

  async function sendOtp() {
    const mobileError = validateMobile(mobile);
    if (mobileError) {
      updateError("customerPhone", mobileError);
      setShowWarning(true);
      setOtpMessage(mobileError);
      focusFirstError({ customerPhone: mobileError });
      return;
    }
    setSendingOtp(true);
    setOtpMessage("Sending OTP...");
    setOtpVerified(false);
    const normalizedMobile = normalizeBangladeshMobile(mobile) ?? mobile;
    setMobile(normalizedMobile);
    const response = await fetch("/api/checkout/otp/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mobile: normalizedMobile })
    });
    const data = await response.json();
    setSendingOtp(false);
    if (!response.ok) updateError("customerPhone", data.fieldErrors?.customerPhone ?? data.error ?? MOBILE_VALIDATION_MESSAGE);
    else updateError("customerPhone", "");
    setOtpMessage(data.developmentOtp ? `${data.message} Development OTP: ${data.developmentOtp}` : data.message ?? data.error ?? "OTP request completed.");
  }

  async function verifyOtp() {
    const mobileError = validateMobile(mobile);
    if (mobileError) {
      updateError("customerPhone", mobileError);
      setOtpVerified(false);
      setOtpMessage(mobileError);
      focusFirstError({ customerPhone: mobileError });
      return;
    }
    const response = await fetch("/api/checkout/otp/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mobile: normalizeBangladeshMobile(mobile) ?? mobile, otp })
    });
    const data = await response.json();
    if (response.ok) {
      setOtpVerified(true);
      updateError("otp", "");
      setOtpMessage("Mobile number verified.");
    } else {
      setOtpVerified(false);
      updateError("otp", data.fieldErrors?.otp ?? data.error ?? "OTP verification failed.");
      setOtpMessage(data.error ?? "OTP verification failed.");
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const validationErrors = validateCheckout(form);
    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors);
      setShowWarning(true);
      setMessage("");
      guideToValidationSummary(validationErrors);
      return;
    }
    setErrors({});
    setShowWarning(false);
    setMessage("Processing order...");
    const normalizedMobile = normalizeBangladeshMobile(mobile) ?? mobile;
    const shippingAddress = buildShippingAddress(form);
    const payload = {
      customerName: form.get("customerName"),
      customerEmail: form.get("customerEmail") || undefined,
      customerPhone: normalizedMobile,
      companyName: form.get("companyName") || undefined,
      couponCode: form.get("couponCode") || undefined,
      paymentMethod: form.get("paymentMethod"),
      deliveryMethod,
      deliveryNotes: form.get("deliveryNotes") || undefined,
      address: shippingAddress,
      termsAccepted: form.get("termsAccepted") === "on",
      saveAddress: form.get("saveAddress") === "on",
      createAccount: form.get("createAccount") === "on",
      termsVersion: legalSettings.termsVersion,
      refundPolicyVersion: legalSettings.refundPolicyVersion,
      items: items.map((item) => ({ productId: item.id, quantity: item.quantity }))
    };
    const response = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (data.redirectUrl) {
      writeCart([]);
      window.location.href = data.redirectUrl;
      return;
    }
    if (response.ok) {
      writeCart([]);
      setMessage(`Order ${data.orderNumber} received.`);
    } else {
      const serverErrors = data.fieldErrors ?? {};
      if (Object.keys(serverErrors).length) {
        setErrors(serverErrors);
        setShowWarning(true);
        guideToValidationSummary(serverErrors);
      }
      setMessage(data.error ?? "Order could not be placed.");
    }
  }

  function updateError(field: string, error: string) {
    setErrors((current) => {
      const next = { ...current };
      if (error) next[field] = error;
      else delete next[field];
      return next;
    });
  }

  function validateCheckout(form: FormData) {
    const nextErrors: CheckoutErrors = {};
    if (!String(form.get("customerName") ?? "").trim()) nextErrors.customerName = "Please enter your full name.";
    const email = String(form.get("customerEmail") ?? "");
    if (!isValidOptionalEmail(email)) nextErrors.customerEmail = EMAIL_VALIDATION_MESSAGE;
    if (!customerProfile && String(form.get("createAccount") ?? "") === "on") {
      if (!email.trim()) nextErrors.customerEmail = "Email address is required to create an account.";
      else if (!isValidOptionalEmail(email)) nextErrors.customerEmail = "Please enter a valid email address to create an account.";
    }
    const mobileError = validateMobile(mobile);
    if (mobileError) nextErrors.customerPhone = mobileError;
    if (otpRequired && !otpVerified) nextErrors.otp = OTP_REQUIRED_MESSAGE;
    if (String(form.get("termsAccepted") ?? "") !== "on") nextErrors.termsAccepted = "Please accept the Shop Terms & Conditions and Refund Policy before placing your order.";
    if (!items.length) nextErrors.items = "Your cart is empty. Please add at least one product before checkout.";
    if (deliveryMethod === "COURIER") {
      if (manualAddressFallback) {
        if (!String(form.get("manualDivision") ?? "").trim()) nextErrors.manualDivision = "Please select your division.";
        if (!String(form.get("manualDistrict") ?? "").trim()) nextErrors.manualDistrict = "Please select your district.";
        if (!String(form.get("manualUpazila") ?? "").trim()) nextErrors.manualUpazila = "Please select your upazila/thana.";
      } else {
        if (!selectedLocation.divisionId || !selectedLocation.divisionName) nextErrors.divisionId = "Please select your division.";
        if (!selectedLocation.districtId || !selectedLocation.districtName) nextErrors.districtId = "Please select your district.";
        if (!selectedLocation.upazilaId || !selectedLocation.upazilaName) nextErrors.upazilaId = "Please select your upazila/thana.";
      }
      if (!String(form.get("addressLine") ?? "").trim()) nextErrors.addressLine = "Please enter your detailed delivery address.";
    }
    return nextErrors;
  }

  function buildShippingAddress(form: FormData) {
    if (deliveryMethod === "PICKUP") {
      return {
        pickupAddress: deliverySettings.pickupAddress,
        manualAddressFallback: false
      };
    }

    const divisionName = manualAddressFallback ? String(form.get("manualDivision") ?? "").trim() : selectedLocation.divisionName;
    const districtName = manualAddressFallback ? String(form.get("manualDistrict") ?? "").trim() : selectedLocation.districtName;
    const upazilaName = manualAddressFallback ? String(form.get("manualUpazila") ?? "").trim() : selectedLocation.upazilaName;
    const addressLine = String(form.get("addressLine") ?? "").trim();
    const postOffice = manualAddressFallback ? "" : selectedLocation.postOffice;
    const postalCode = manualAddressFallback ? String(form.get("manualPostalCode") ?? "").trim() : selectedLocation.postalCode;
    const deliveryNotes = String(form.get("deliveryNotes") ?? "").trim();

    return {
      divisionId: manualAddressFallback ? "" : selectedLocation.divisionId,
      divisionName,
      districtId: manualAddressFallback ? "" : selectedLocation.districtId,
      districtName,
      upazilaId: manualAddressFallback ? "" : selectedLocation.upazilaId,
      upazilaName,
      thanaName: upazilaName,
      postOffice,
      addressLine,
      postalCode,
      deliveryNotes,
      manualAddressFallback,
      locationSource: "bangladesh-geojson",
      line1: addressLine,
      district: districtName,
      city: upazilaName,
      pickupAddress: deliverySettings.pickupAddress
    };
  }

  function applySavedAddress(addressId: string) {
    const address = savedAddresses.find((item) => item.id === addressId);
    if (!address || !formRef.current) return;
    setDeliveryMethod("COURIER");
    setManualAddressFallback(true);
    window.setTimeout(() => {
      setNamedValue("manualDivision", address.divisionName);
      setNamedValue("manualDistrict", address.districtName);
      setNamedValue("manualUpazila", address.upazilaName);
      setNamedValue("manualPostalCode", address.postalCode ?? "");
      setNamedValue("addressLine", address.addressLine);
      setNamedValue("deliveryNotes", address.deliveryNotes ?? "");
      setMobile(address.mobileNumber);
      updateError("manualDivision", "");
      updateError("manualDistrict", "");
      updateError("manualUpazila", "");
      updateError("addressLine", "");
    }, 0);
  }

  function setNamedValue(name: string, value: string) {
    const input = formRef.current?.querySelector<HTMLInputElement | HTMLTextAreaElement>(`[name="${name}"]`);
    if (input) input.value = value;
  }

  function focusFirstError(nextErrors: CheckoutErrors) {
    const firstField = Object.keys(nextErrors)[0];
    if (!firstField || !formRef.current) return;
    const targetName = firstField === "otp" ? "customerPhone" : firstField;
    const target = formRef.current.querySelector<HTMLElement>(`[name="${targetName}"]`);
    target?.focus({ preventScroll: true });
  }

  function guideToValidationSummary(nextErrors: CheckoutErrors) {
    window.requestAnimationFrame(() => {
      validationSummaryRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      validationSummaryRef.current?.focus({ preventScroll: true });
      window.setTimeout(() => focusFirstError(nextErrors), 520);
    });
  }

  function issueList() {
    return Array.from(new Set(Object.values(errors)));
  }

  function filteredPostcodes() {
    if (!selectedLocation.upazilaName) return postcodes;
    const upazila = selectedLocation.upazilaName.trim().toLowerCase();
    return postcodes.filter((postcode) => postcode.upazila.trim().toLowerCase() === upazila);
  }

  function postcodeValue(postcode: PostcodeOption) {
    return `${postcode.postOffice}__${postcode.postCode}`;
  }

  function trapModalFocus(event: KeyboardEvent) {
    const modal = document.querySelector<HTMLElement>(".checkout-legal-modal");
    if (!modal) return;
    const focusable = Array.from(modal.querySelectorAll<HTMLElement>("button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])"))
      .filter((element) => !element.hasAttribute("disabled"));
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  return (
    <div className="checkout-layout">
      <form ref={formRef} className="panel checkout-form" onSubmit={submit} noValidate>
        {showWarning && Object.keys(errors).length ? (
          <div className="checkout-warning" role="alert" tabIndex={-1} ref={validationSummaryRef}>
            <AlertCircle size={18} />
            <div>
              <strong>{CHECKOUT_WARNING_TITLE}</strong>
              <p>{CHECKOUT_WARNING_BODY}</p>
              <ul>{issueList().map((issue) => <li key={issue}>{issue}</li>)}</ul>
            </div>
          </div>
        ) : null}
        <section>
          <h2>Customer information</h2>
          <div className="form-grid">
            <Field label="Full name" name="customerName" defaultValue={customerProfile?.fullName ?? ""} required error={errors.customerName} onBlur={(event) => updateError("customerName", event.currentTarget.value.trim() ? "" : "Please enter your full name.")} />
            <label className={`field ${errors.customerPhone ? "field-invalid" : ""}`}>
              <span>Mobile number</span>
              <input
                name="customerPhone"
                aria-invalid={Boolean(errors.customerPhone)}
                value={mobile}
                onBlur={() => updateError("customerPhone", validateMobile(mobile))}
                onChange={(event) => {
                  setMobile(event.target.value);
                  setOtpVerified(false);
                  if (otpRequired) updateError("otp", OTP_REQUIRED_MESSAGE);
                  if (errors.customerPhone) updateError("customerPhone", validateMobile(event.target.value));
                }}
                required
              />
              {errors.customerPhone ? <small className="field-error">{errors.customerPhone}</small> : null}
            </label>
            <Field label="Email address (optional)" name="customerEmail" inputMode="email" defaultValue={customerProfile?.email ?? ""} error={errors.customerEmail} onBlur={(event) => updateError("customerEmail", isValidOptionalEmail(event.currentTarget.value) ? "" : EMAIL_VALIDATION_MESSAGE)} />
            <Field label="Institution / company (optional)" name="companyName" />
          </div>
          {otpRequired ? <div className={`otp-panel ${errors.otp ? "field-invalid" : ""}`}>
            <button className="btn secondary compact" type="button" onClick={sendOtp} disabled={sendingOtp || mobile.length < 7}><MessageSquareText size={15} />Send OTP</button>
            <input value={otp} onChange={(event) => setOtp(event.target.value)} placeholder="6 digit OTP" inputMode="numeric" maxLength={6} />
            <button className="btn secondary compact" type="button" onClick={verifyOtp} disabled={otp.length !== 6}>Verify</button>
            {otpVerified ? <span className="verified-pill"><CheckCircle2 size={14} />Verified</span> : null}
            {otpMessage ? <p>{otpMessage}</p> : null}
            {errors.otp ? <p className="field-error">{errors.otp}</p> : null}
          </div> : <p className="field-help">OTP verification is currently not required. Please enter a valid mobile number for order coordination.</p>}
        </section>

        <section>
          <h2>Delivery method</h2>
          <div className="delivery-option-grid">
            {deliverySettings.courierEnabled ? (
              <label className={deliveryMethod === "COURIER" ? "delivery-option active" : "delivery-option"}>
                <input type="radio" name="deliveryMethod" checked={deliveryMethod === "COURIER"} onChange={() => setDeliveryMethod("COURIER")} />
                <strong>Delivery via courier</strong>
                <span>Minimum delivery charge {money(deliverySettings.courierMinimumChargeBdt)}</span>
                {deliveryMethod === "COURIER" ? <span className="checkout-select-tick" aria-hidden="true"><Check size={14} /></span> : null}
              </label>
            ) : null}
            {deliverySettings.pickupEnabled ? (
              <label className={deliveryMethod === "PICKUP" ? "delivery-option active" : "delivery-option"}>
                <input type="radio" name="deliveryMethod" checked={deliveryMethod === "PICKUP"} onChange={() => setDeliveryMethod("PICKUP")} />
                <strong>{deliverySettings.pickupLabel}</strong>
                <span>{deliverySettings.pickupAddress} · {money(deliverySettings.pickupChargeBdt)}</span>
                {deliveryMethod === "PICKUP" ? <span className="checkout-select-tick" aria-hidden="true"><Check size={14} /></span> : null}
              </label>
            ) : null}
          </div>
          {deliveryMethod === "PICKUP" ? <p className="field-help">Pickup from {deliverySettings.pickupAddress}. We will contact you when the order is ready.</p> : null}
        </section>

        {deliveryMethod === "COURIER" ? (
          <section>
            <h2>Shipping address</h2>
            {savedAddresses.length ? (
              <div className="checkout-saved-addresses">
                <label className="field">
                  <span>Saved delivery address</span>
                  <select defaultValue="" onChange={(event) => applySavedAddress(event.target.value)}>
                    <option value="">Select a saved address</option>
                    {savedAddresses.map((address) => (
                      <option value={address.id} key={address.id}>
                        {address.isDefault ? "Default - " : ""}{address.recipientName}, {address.upazilaName}, {address.districtName}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            ) : null}
            <div className="location-search-box">
              <label className="field">
                <span>Can&apos;t find your area? Search Bangladesh location</span>
                <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search by English, Bangla, post office or postcode" />
              </label>
              <button className="btn secondary compact" type="button" onClick={searchLocation} disabled={loadingLocation.search || !searchQuery.trim()}>{loadingLocation.search ? "Searching..." : "Search"}</button>
              {searchResults.length ? (
                <div className="location-search-results">
                  {searchResults.map((result, index) => (
                    <button type="button" key={`${result.type}-${result.label}-${index}`} onClick={() => applySearchResult(result)}>
                      <strong>{result.label}</strong>
                      <span>{result.type}</span>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
            {!manualAddressFallback ? (
              <div className="location-select-grid">
                <label className={`field ${errors.divisionId ? "field-invalid" : ""}`}>
                  <span>Division</span>
                  <select name="divisionId" value={selectedLocation.divisionId} onChange={(event) => selectDivision(event.target.value)} aria-invalid={Boolean(errors.divisionId)} disabled={loadingLocation.division}>
                    <option value="">{loadingLocation.division ? "Loading divisions..." : "Select division"}</option>
                    {divisions.map((division) => <option value={division.id} key={division.id}>{division.name}</option>)}
                  </select>
                  {errors.divisionId ? <small className="field-error">{errors.divisionId}</small> : null}
                </label>
                <label className={`field ${errors.districtId ? "field-invalid" : ""}`}>
                  <span>District</span>
                  <select name="districtId" value={selectedLocation.districtId} onChange={(event) => selectDistrict(event.target.value)} aria-invalid={Boolean(errors.districtId)} disabled={!selectedLocation.divisionId || loadingLocation.district}>
                    <option value="">{loadingLocation.district ? "Loading districts..." : "Select district"}</option>
                    {districts.map((district) => <option value={district.id} key={district.id}>{district.name}</option>)}
                  </select>
                  {errors.districtId ? <small className="field-error">{errors.districtId}</small> : null}
                </label>
                <label className={`field ${errors.upazilaId ? "field-invalid" : ""}`}>
                  <span>Upazila / Thana</span>
                  <select name="upazilaId" value={selectedLocation.upazilaId} onChange={(event) => selectUpazila(event.target.value)} aria-invalid={Boolean(errors.upazilaId)} disabled={!selectedLocation.districtId || loadingLocation.upazila}>
                    <option value="">{loadingLocation.upazila ? "Loading upazila/thana..." : "Select upazila/thana"}</option>
                    {upazilas.map((upazila) => <option value={upazila.id} key={upazila.id}>{upazila.name}</option>)}
                  </select>
                  {errors.upazilaId ? <small className="field-error">{errors.upazilaId}</small> : null}
                </label>
                <label className="field">
                  <span>Post office / Postal code (optional)</span>
                  <select name="postcode" value={selectedLocation.postOffice ? `${selectedLocation.postOffice}__${selectedLocation.postalCode}` : ""} onChange={(event) => selectPostcode(event.target.value)} disabled={!selectedLocation.districtId || loadingLocation.postcode}>
                    <option value="">{loadingLocation.postcode ? "Loading post offices..." : "Select post office if available"}</option>
                    {filteredPostcodes().map((postcode) => <option value={postcodeValue(postcode)} key={postcodeValue(postcode)}>{postcode.postOffice} - {postcode.postCode}</option>)}
                  </select>
                </label>
              </div>
            ) : (
              <div className="location-fallback-box">
                <p>{locationMessage || "Cannot find your area? Enter address manually."}</p>
                <div className="form-grid">
                  <Field label="Division" name="manualDivision" required error={errors.manualDivision} onBlur={(event) => updateError("manualDivision", event.currentTarget.value.trim() ? "" : "Please select your division.")} />
                  <Field label="District" name="manualDistrict" required error={errors.manualDistrict} onBlur={(event) => updateError("manualDistrict", event.currentTarget.value.trim() ? "" : "Please select your district.")} />
                  <Field label="Upazila / Thana" name="manualUpazila" required error={errors.manualUpazila} onBlur={(event) => updateError("manualUpazila", event.currentTarget.value.trim() ? "" : "Please select your upazila/thana.")} />
                  <Field label="Postal code (optional)" name="manualPostalCode" />
                </div>
              </div>
            )}
            {!manualAddressFallback && locationMessage ? <p className="field-help">{locationMessage}</p> : null}
            {!manualAddressFallback ? <button className="btn secondary compact" type="button" onClick={() => setManualAddressFallback(true)}>Enter address manually</button> : null}
            <div className="form-grid">
              <label className={`field wide ${errors.addressLine ? "field-invalid" : ""}`}>
                <span>Address line / Road / House / Factory location</span>
                <textarea name="addressLine" rows={3} required aria-invalid={Boolean(errors.addressLine)} onBlur={(event) => updateError("addressLine", event.currentTarget.value.trim() ? "" : "Please enter your detailed delivery address.")} />
                {errors.addressLine ? <small className="field-error">{errors.addressLine}</small> : null}
              </label>
              <Field label="Delivery notes (optional)" name="deliveryNotes" />
            </div>
            {customerProfile ? (
              <label className="check-field">
                <input name="saveAddress" type="checkbox" />
                <span>Save this address for future orders</span>
              </label>
            ) : null}
          </section>
        ) : <input type="hidden" name="deliveryNotes" value="Warehouse pickup" />}

        {!customerProfile ? (
          <label className={`checkout-account-create-row ${createAccount ? "is-checked" : ""}`}>
            <input
              name="createAccount"
              type="checkbox"
              checked={createAccount}
              onChange={(event) => {
                setCreateAccount(event.currentTarget.checked);
                if (!event.currentTarget.checked && errors.customerEmail === "Email address is required to create an account.") updateError("customerEmail", "");
              }}
            />
            <span className="checkout-custom-checkbox" aria-hidden="true">{createAccount ? <Check size={14} /> : null}</span>
            <span>Create an Alektra account to track this order and save my delivery details.</span>
          </label>
        ) : null}

        <section className="form-grid">
          <Field label="Coupon" name="couponCode" />
          <label className="field"><span>Payment</span><select name="paymentMethod" defaultValue="CASH_ON_DELIVERY"><option value="CASH_ON_DELIVERY">Cash on delivery</option><option value="SSLCOMMERZ">SSLCommerz</option></select></label>
        </section>

        <div className={`checkout-legal-card ${errors.termsAccepted ? "field-invalid" : ""}`}>
          <label className={`checkout-legal-row ${termsAccepted ? "is-checked" : ""}`}>
            <input
              name="termsAccepted"
              type="checkbox"
              checked={termsAccepted}
              onChange={(event) => {
                setTermsAccepted(event.currentTarget.checked);
                updateError("termsAccepted", event.currentTarget.checked ? "" : "Please accept the Shop Terms & Conditions and Refund Policy before placing your order.");
              }}
            />
            <span className="checkout-custom-checkbox" aria-hidden="true">{termsAccepted ? <Check size={14} /> : null}</span>
            <span className="checkout-legal-text">
              I agree to Alektra Renewable Shop{" "}
              <button className="checkout-policy-link" type="button" onClick={(event) => { event.preventDefault(); event.stopPropagation(); setLegalModal("terms"); }}>Terms & Conditions</button>
              {" "}and{" "}
              <button className="checkout-policy-link" type="button" onClick={(event) => { event.preventDefault(); event.stopPropagation(); setLegalModal("refund"); }}>Refund Policy</button>.
            </span>
          </label>
          {errors.termsAccepted ? <p className="checkout-legal-error">{errors.termsAccepted}</p> : null}
        </div>

        {otpRequired && !otpVerified ? <p className="field-help">Verify your mobile number with OTP to enable order confirmation.</p> : null}
        <button className="btn wide checkout-submit" type="submit" disabled={!items.length || (otpRequired && !otpVerified)}>
          <CreditCard size={18} />
          Confirm order
        </button>
        {message ? <p className={`checkout-message ${showWarning ? "error" : ""}`}>{message}</p> : null}
      </form>

      <aside className="checkout-summary panel">
        <h2>Order summary</h2>
        {items.length ? items.map((item) => (
          <div className="checkout-summary-item" key={item.id}>
            <span>{item.name}<small>{item.sku} x {item.quantity}</small></span>
            <strong>{money(item.price * item.quantity)}</strong>
          </div>
        )) : <p>Your cart is empty.</p>}
        <div className="checkout-total-row"><span>Subtotal</span><strong>{money(subtotal)}</strong></div>
        <div className="checkout-total-row"><span>Delivery</span><strong>{money(deliveryCharge)}</strong></div>
        <div className="checkout-total-row grand"><span>Total payable</span><strong>{money(total)}</strong></div>
      </aside>
      {legalModal ? (
        <LegalPolicyModal
          type={legalModal}
          legalSettings={legalSettings}
          onClose={() => setLegalModal(null)}
        />
      ) : null}
    </div>
  );
}

function LegalPolicyModal({
  type,
  legalSettings,
  onClose
}: {
  type: "terms" | "refund";
  legalSettings: LegalSettings;
  onClose: () => void;
}) {
  const isTerms = type === "terms";
  const title = isTerms ? legalSettings.termsTitle : legalSettings.refundTitle;
  const version = isTerms ? legalSettings.termsVersion : legalSettings.refundPolicyVersion;
  const effectiveDate = isTerms ? legalSettings.termsEffectiveDate : legalSettings.refundEffectiveDate;
  const content = (isTerms ? legalSettings.termsContent : legalSettings.refundContent).trim();
  const modalTitleId = `checkout-${type}-modal-title`;
  return (
    <div className="checkout-legal-modal-overlay" onMouseDown={onClose}>
      <section className="checkout-legal-modal" role="dialog" aria-modal="true" aria-labelledby={modalTitleId} onMouseDown={(event) => event.stopPropagation()}>
        <header>
          <div>
            <p className="kicker">Shop Legal</p>
            <h2 id={modalTitleId}>{title}</h2>
            <span>Version {version}{effectiveDate ? ` · Effective ${new Date(effectiveDate).toLocaleDateString("en-GB")}` : ""}</span>
          </div>
          <button className="checkout-legal-modal-close" type="button" onClick={onClose} aria-label="Close policy modal">×</button>
        </header>
        <div className="checkout-legal-modal-body"><PolicyFormattedText content={content} /></div>
        <footer>
          <button className="btn checkout-legal-understand" type="button" onClick={onClose}>I Understand</button>
        </footer>
      </section>
    </div>
  );
}

function validateMobile(value: string) {
  if (!value.trim()) return MOBILE_VALIDATION_MESSAGE;
  return isValidBangladeshMobile(value) ? "" : MOBILE_VALIDATION_MESSAGE;
}

function Field({
  label,
  name,
  type = "text",
  inputMode,
  required = false,
  error,
  onBlur,
  defaultValue = ""
}: {
  label: string;
  name: string;
  type?: string;
  inputMode?: "email" | "text" | "numeric";
  required?: boolean;
  error?: string;
  onBlur?: FocusEventHandler<HTMLInputElement>;
  defaultValue?: string;
}) {
  return (
    <label className={`field ${error ? "field-invalid" : ""}`}>
      <span>{label}</span>
      <input name={name} type={type} inputMode={inputMode} required={required} aria-invalid={Boolean(error)} onBlur={onBlur} defaultValue={defaultValue} />
      {error ? <small className="field-error">{error}</small> : null}
    </label>
  );
}
