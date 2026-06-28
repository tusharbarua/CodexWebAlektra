"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { CheckCircle2, CreditCard, MessageSquareText } from "lucide-react";
import { CartItem, CART_UPDATED_EVENT, cartSummary, readCart, writeCart } from "@/lib/cart";
import { money } from "@/lib/format";

type DeliverySettings = {
  courierEnabled: boolean;
  courierMinimumChargeBdt: number;
  pickupEnabled: boolean;
  pickupLabel: string;
  pickupAddress: string;
  pickupChargeBdt: number;
};

export function CheckoutForm({ deliverySettings }: { deliverySettings: DeliverySettings }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [message, setMessage] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState(deliverySettings.courierEnabled ? "COURIER" : "PICKUP");
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [otpVerified, setOtpVerified] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [otpMessage, setOtpMessage] = useState("");
  const subtotal = useMemo(() => cartSummary(items).total, [items]);
  const deliveryCharge = deliveryMethod === "COURIER" ? deliverySettings.courierMinimumChargeBdt : deliverySettings.pickupChargeBdt;
  const total = subtotal + deliveryCharge;

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

  async function sendOtp() {
    setSendingOtp(true);
    setOtpMessage("Sending OTP...");
    setOtpVerified(false);
    const response = await fetch("/api/checkout/otp/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mobile })
    });
    const data = await response.json();
    setSendingOtp(false);
    setOtpMessage(data.developmentOtp ? `${data.message} Development OTP: ${data.developmentOtp}` : data.message ?? data.error ?? "OTP request completed.");
  }

  async function verifyOtp() {
    const response = await fetch("/api/checkout/otp/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mobile, otp })
    });
    const data = await response.json();
    if (response.ok) {
      setOtpVerified(true);
      setOtpMessage("Mobile number verified.");
    } else {
      setOtpVerified(false);
      setOtpMessage(data.error ?? "OTP verification failed.");
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!otpVerified) {
      setMessage("Verify your mobile number by OTP before confirming the order.");
      return;
    }
    setMessage("Processing order...");
    const form = new FormData(event.currentTarget);
    const payload = {
      customerName: form.get("customerName"),
      customerEmail: form.get("customerEmail") || undefined,
      customerPhone: mobile,
      companyName: form.get("companyName") || undefined,
      couponCode: form.get("couponCode") || undefined,
      paymentMethod: form.get("paymentMethod"),
      deliveryMethod,
      deliveryNotes: form.get("deliveryNotes") || undefined,
      address: {
        line1: form.get("line1") || "",
        line2: form.get("line2") || "",
        district: form.get("district") || "",
        city: form.get("city") || "",
        postalCode: form.get("postalCode") || "",
        pickupAddress: deliverySettings.pickupAddress
      },
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
      setMessage(data.error ?? "Order could not be placed.");
    }
  }

  return (
    <div className="checkout-layout">
      <form className="panel checkout-form" onSubmit={submit}>
        <section>
          <h2>Customer information</h2>
          <div className="form-grid">
            <Field label="Full name" name="customerName" required />
            <label className="field"><span>Mobile number</span><input name="customerPhone" value={mobile} onChange={(event) => { setMobile(event.target.value); setOtpVerified(false); }} required /></label>
            <Field label="Email address (optional)" name="customerEmail" type="email" />
            <Field label="Institution / company (optional)" name="companyName" />
          </div>
          <div className="otp-panel">
            <button className="btn secondary compact" type="button" onClick={sendOtp} disabled={sendingOtp || mobile.length < 7}><MessageSquareText size={15} />Send OTP</button>
            <input value={otp} onChange={(event) => setOtp(event.target.value)} placeholder="6 digit OTP" inputMode="numeric" maxLength={6} />
            <button className="btn secondary compact" type="button" onClick={verifyOtp} disabled={otp.length !== 6}>Verify</button>
            {otpVerified ? <span className="verified-pill"><CheckCircle2 size={14} />Verified</span> : null}
            {otpMessage ? <p>{otpMessage}</p> : null}
          </div>
        </section>

        <section>
          <h2>Delivery method</h2>
          <div className="delivery-option-grid">
            {deliverySettings.courierEnabled ? <label className={deliveryMethod === "COURIER" ? "delivery-option active" : "delivery-option"}><input type="radio" name="deliveryMethod" checked={deliveryMethod === "COURIER"} onChange={() => setDeliveryMethod("COURIER")} /> <strong>Delivery via courier</strong><span>Minimum delivery charge {money(deliverySettings.courierMinimumChargeBdt)}</span></label> : null}
            {deliverySettings.pickupEnabled ? <label className={deliveryMethod === "PICKUP" ? "delivery-option active" : "delivery-option"}><input type="radio" name="deliveryMethod" checked={deliveryMethod === "PICKUP"} onChange={() => setDeliveryMethod("PICKUP")} /> <strong>{deliverySettings.pickupLabel}</strong><span>{deliverySettings.pickupAddress} · {money(deliverySettings.pickupChargeBdt)}</span></label> : null}
          </div>
          {deliveryMethod === "PICKUP" ? <p className="field-help">Pickup from {deliverySettings.pickupAddress}. We will contact you when the order is ready.</p> : null}
        </section>

        {deliveryMethod === "COURIER" ? (
          <section>
            <h2>Shipping address</h2>
            <div className="form-grid">
              <Field label="Address line 1" name="line1" required />
              <Field label="Address line 2 (optional)" name="line2" />
              <Field label="District" name="district" required />
              <Field label="City / Area" name="city" required />
              <Field label="Postal code (optional)" name="postalCode" />
              <Field label="Delivery notes (optional)" name="deliveryNotes" />
            </div>
          </section>
        ) : <input type="hidden" name="deliveryNotes" value="Warehouse pickup" />}

        <section className="form-grid">
          <Field label="Coupon" name="couponCode" />
          <label className="field"><span>Payment</span><select name="paymentMethod" defaultValue="CASH_ON_DELIVERY"><option value="CASH_ON_DELIVERY">Cash on delivery</option><option value="SSLCOMMERZ">SSLCommerz</option></select></label>
        </section>

        <button className="btn wide checkout-submit" type="submit" disabled={!items.length || !otpVerified}>
          <CreditCard size={18} />
          Confirm order
        </button>
        {message ? <p className="checkout-message">{message}</p> : null}
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
    </div>
  );
}

function Field({ label, name, type = "text", required = false }: { label: string; name: string; type?: string; required?: boolean }) {
  return <label className="field"><span>{label}</span><input name={name} type={type} required={required} /></label>;
}
