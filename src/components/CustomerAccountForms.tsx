"use client";

import { useActionState, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import {
  completeCustomerAccountSetup,
  loginCustomer,
  registerCustomer,
  requestPasswordReset,
  resetCustomerPassword,
  saveCustomerAddress,
  updateCustomerProfile
} from "@/app/account/actions";

type ActionState = {
  ok?: boolean;
  message?: string;
  fieldErrors?: Record<string, string>;
};

const initialState: ActionState = {};

export function CustomerLoginForm() {
  const [state, action, pending] = useActionState(loginCustomer, initialState);
  const [values, setValues] = useState({ email: "", password: "" });
  return (
    <form className="account-form-card" action={action}>
      <FormNotice state={state} />
      <Field name="email" label="Email address" type="email" value={values.email} onChange={(value) => setValues((current) => ({ ...current, email: value }))} placeholder="jd@gmail.com" error={state.fieldErrors?.email} required />
      <Field name="password" label="Password" type="password" value={values.password} onChange={(value) => setValues((current) => ({ ...current, password: value }))} placeholder="Your password" error={state.fieldErrors?.password} required />
      <button className="account-primary-button" disabled={pending} type="submit">{pending ? "Signing in..." : "Sign In"}</button>
    </form>
  );
}

export function CustomerRegisterForm() {
  const [state, action, pending] = useActionState(registerCustomer, initialState);
  const [values, setValues] = useState({ fullName: "", email: "", mobileNumber: "", password: "", repeatPassword: "" });
  const match = passwordMatchState(values.password, values.repeatPassword);
  return (
    <form className="account-form-card" action={action}>
      <FormNotice state={state} />
      <Field name="fullName" label="Full name" value={values.fullName} onChange={(value) => setValues((current) => ({ ...current, fullName: value }))} placeholder="John Doe" error={state.fieldErrors?.fullName} required />
      <Field name="email" label="Email address" type="email" value={values.email} onChange={(value) => setValues((current) => ({ ...current, email: value }))} placeholder="jd@gmail.com" error={state.fieldErrors?.email} required />
      <Field name="mobileNumber" label="Mobile number" value={values.mobileNumber} onChange={(value) => setValues((current) => ({ ...current, mobileNumber: value }))} placeholder="01XXXXXXXXX" error={state.fieldErrors?.mobileNumber} />
      <Field name="password" label="Password" type="password" value={values.password} onChange={(value) => setValues((current) => ({ ...current, password: value }))} placeholder="At least 8 characters including a letter" error={state.fieldErrors?.password} help="Password must be at least 8 characters and include at least one letter." required />
      <Field name="repeatPassword" label="Repeat password" type="password" value={values.repeatPassword} onChange={(value) => setValues((current) => ({ ...current, repeatPassword: value }))} placeholder="Repeat your password" error={state.fieldErrors?.repeatPassword} required />
      <PasswordMatchHint match={match} />
      <button className="account-primary-button" disabled={pending} type="submit">{pending ? "Creating account..." : "Create Account"}</button>
    </form>
  );
}

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(requestPasswordReset, initialState);
  const [email, setEmail] = useState("");
  return (
    <form className="account-form-card" action={action}>
      <FormNotice state={state} />
      <Field name="email" label="Email address" type="email" value={email} onChange={setEmail} placeholder="jd@gmail.com" error={state.fieldErrors?.email} required />
      <button className="account-primary-button" disabled={pending} type="submit">{pending ? "Sending..." : "Send Reset Link"}</button>
    </form>
  );
}

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(resetCustomerPassword, initialState);
  const [values, setValues] = useState({ password: "", repeatPassword: "" });
  const match = passwordMatchState(values.password, values.repeatPassword);
  return (
    <form className="account-form-card" action={action}>
      <FormNotice state={state} />
      <input type="hidden" name="token" value={token} />
      <Field name="password" label="New password" type="password" value={values.password} onChange={(value) => setValues((current) => ({ ...current, password: value }))} placeholder="At least 8 characters including a letter" error={state.fieldErrors?.password} help="Password must be at least 8 characters and include at least one letter." required />
      <Field name="repeatPassword" label="Repeat new password" type="password" value={values.repeatPassword} onChange={(value) => setValues((current) => ({ ...current, repeatPassword: value }))} placeholder="Repeat your new password" error={state.fieldErrors?.repeatPassword} required />
      <PasswordMatchHint match={match} />
      <button className="account-primary-button" disabled={pending || state.ok} type="submit">{pending ? "Resetting..." : "Reset Password"}</button>
    </form>
  );
}

export function CompleteAccountSetupForm({ token, email }: { token: string; email: string }) {
  const [state, action, pending] = useActionState(completeCustomerAccountSetup, initialState);
  const [values, setValues] = useState({ password: "", repeatPassword: "" });
  const match = passwordMatchState(values.password, values.repeatPassword);
  return (
    <form className="account-form-card" action={action}>
      <FormNotice state={state} />
      <input type="hidden" name="token" value={token} />
      <label className="account-field">
        <span>Email address</span>
        <input value={email} readOnly />
        <small>This email will be verified when you set your password.</small>
      </label>
      <Field name="password" label="Password" type="password" value={values.password} onChange={(value) => setValues((current) => ({ ...current, password: value }))} placeholder="At least 8 characters including a letter" error={state.fieldErrors?.password} help="Password must be at least 8 characters and include at least one letter." required />
      <Field name="repeatPassword" label="Repeat password" type="password" value={values.repeatPassword} onChange={(value) => setValues((current) => ({ ...current, repeatPassword: value }))} placeholder="Repeat your password" error={state.fieldErrors?.repeatPassword} required />
      <PasswordMatchHint match={match} />
      <button className="account-primary-button" disabled={pending || state.ok} type="submit">{pending ? "Completing..." : "Complete Account Setup"}</button>
    </form>
  );
}

export function CustomerProfileForm({
  fullName,
  mobileNumber,
  email
}: {
  fullName: string;
  mobileNumber?: string | null;
  email: string;
}) {
  const [state, action, pending] = useActionState(updateCustomerProfile, initialState);
  const [values, setValues] = useState({ fullName, mobileNumber: mobileNumber ?? "" });
  return (
    <form className="account-form-card" action={action}>
      <FormNotice state={state} />
      <Field name="fullName" label="Full name" value={values.fullName} onChange={(value) => setValues((current) => ({ ...current, fullName: value }))} placeholder="John Doe" error={state.fieldErrors?.fullName} required />
      <Field name="mobileNumber" label="Mobile number" value={values.mobileNumber} onChange={(value) => setValues((current) => ({ ...current, mobileNumber: value }))} placeholder="01XXXXXXXXX" error={state.fieldErrors?.mobileNumber} />
      <label className="account-field">
        <span>Email address</span>
        <input value={email} readOnly />
        <small>Email changes require a new verification flow, so it is read-only for now.</small>
      </label>
      <button className="account-primary-button" disabled={pending} type="submit">{pending ? "Saving..." : "Save Profile"}</button>
    </form>
  );
}

export function CustomerAddressForm({
  defaults
}: {
  defaults?: {
    id?: string;
    recipientName?: string;
    mobileNumber?: string;
    divisionId?: string | null;
    divisionName?: string;
    districtId?: string | null;
    districtName?: string;
    upazilaId?: string | null;
    upazilaName?: string;
    addressLine?: string;
    postalCode?: string | null;
    deliveryNotes?: string | null;
    isDefault?: boolean;
  };
}) {
  const [state, action, pending] = useActionState(saveCustomerAddress, initialState);
  const [values, setValues] = useState({
    recipientName: defaults?.recipientName ?? "",
    mobileNumber: defaults?.mobileNumber ?? "",
    divisionName: defaults?.divisionName ?? "",
    districtName: defaults?.districtName ?? "",
    upazilaName: defaults?.upazilaName ?? "",
    addressLine: defaults?.addressLine ?? "",
    postalCode: defaults?.postalCode ?? "",
    deliveryNotes: defaults?.deliveryNotes ?? ""
  });
  return (
    <form className="account-form-card account-address-form" action={action}>
      <FormNotice state={state} />
      {defaults?.id ? <input type="hidden" name="id" value={defaults.id} /> : null}
      <Field name="recipientName" label="Recipient name" value={values.recipientName} onChange={(value) => setValues((current) => ({ ...current, recipientName: value }))} error={state.fieldErrors?.recipientName} required />
      <Field name="mobileNumber" label="Mobile number" value={values.mobileNumber} onChange={(value) => setValues((current) => ({ ...current, mobileNumber: value }))} placeholder="01XXXXXXXXX" error={state.fieldErrors?.mobileNumber} required />
      <Field name="divisionName" label="Division" value={values.divisionName} onChange={(value) => setValues((current) => ({ ...current, divisionName: value }))} error={state.fieldErrors?.divisionName} required />
      <input type="hidden" name="divisionId" value={defaults?.divisionId ?? ""} />
      <Field name="districtName" label="District" value={values.districtName} onChange={(value) => setValues((current) => ({ ...current, districtName: value }))} error={state.fieldErrors?.districtName} required />
      <input type="hidden" name="districtId" value={defaults?.districtId ?? ""} />
      <Field name="upazilaName" label="Upazila / Thana" value={values.upazilaName} onChange={(value) => setValues((current) => ({ ...current, upazilaName: value }))} error={state.fieldErrors?.upazilaName} required />
      <input type="hidden" name="upazilaId" value={defaults?.upazilaId ?? ""} />
      <Field name="addressLine" label="Detailed address" value={values.addressLine} onChange={(value) => setValues((current) => ({ ...current, addressLine: value }))} error={state.fieldErrors?.addressLine} required wide multiline />
      <Field name="postalCode" label="Postal code" value={values.postalCode ?? ""} onChange={(value) => setValues((current) => ({ ...current, postalCode: value }))} />
      <Field name="deliveryNotes" label="Delivery notes" value={values.deliveryNotes ?? ""} onChange={(value) => setValues((current) => ({ ...current, deliveryNotes: value }))} wide multiline />
      <label className="account-check-field">
        <input type="checkbox" name="isDefault" defaultChecked={defaults?.isDefault ?? false} />
        <span>Set as default delivery address</span>
      </label>
      <button className="account-primary-button" disabled={pending} type="submit">{pending ? "Saving..." : "Save Address"}</button>
    </form>
  );
}

function Field({
  name,
  label,
  type = "text",
  value,
  onChange,
  defaultValue = "",
  placeholder,
  error,
  help,
  required = false,
  wide = false,
  multiline = false
}: {
  name: string;
  label: string;
  type?: string;
  value?: string;
  onChange?: (value: string) => void;
  defaultValue?: string;
  placeholder?: string;
  error?: string;
  help?: string;
  required?: boolean;
  wide?: boolean;
  multiline?: boolean;
}) {
  return (
    <label className={`account-field ${wide ? "wide" : ""} ${error ? "field-invalid" : ""}`}>
      <span>{label}{required ? <em>*</em> : null}</span>
      {multiline ? (
        <textarea
          name={name}
          value={value}
          defaultValue={value === undefined ? defaultValue : undefined}
          onChange={onChange ? (event) => onChange(event.currentTarget.value) : undefined}
          placeholder={placeholder}
          required={required}
          aria-invalid={Boolean(error)}
          rows={3}
        />
      ) : (
        <input
          name={name}
          type={type}
          value={value}
          defaultValue={value === undefined ? defaultValue : undefined}
          onChange={onChange ? (event) => onChange(event.currentTarget.value) : undefined}
          placeholder={placeholder}
          required={required}
          aria-invalid={Boolean(error)}
        />
      )}
      {help ? <small className="account-field-help">{help}</small> : null}
      {error ? <small>{error}</small> : null}
    </label>
  );
}

function PasswordMatchHint({ match }: { match: "idle" | "match" | "mismatch" }) {
  if (match === "idle") return null;
  return (
    <p className={`account-password-match ${match === "match" ? "match" : "mismatch"}`}>
      {match === "match" ? <CheckCircle2 size={15} /> : null}
      {match === "match" ? "Password matched." : "Password not matched."}
    </p>
  );
}

function passwordMatchState(password: string, repeatPassword: string) {
  if (!repeatPassword || password.length < 8) return "idle";
  return password === repeatPassword ? "match" : "mismatch";
}

function FormNotice({ state }: { state: ActionState }) {
  if (!state.message) return null;
  return <div className={`account-form-notice ${state.ok ? "success" : "error"}`}>{state.message}</div>;
}
