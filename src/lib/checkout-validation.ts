export const EMAIL_VALIDATION_MESSAGE = "Please enter a valid email address, or leave it blank.";
export const MOBILE_VALIDATION_MESSAGE = "Please enter a valid Bangladeshi mobile number.";
export const OTP_REQUIRED_MESSAGE = "Please verify your mobile number with OTP before placing the order.";
export const CHECKOUT_WARNING_TITLE = "Please complete the required information";
export const CHECKOUT_WARNING_BODY = "Before placing your order, please fix the highlighted fields below.";

export function isValidOptionalEmail(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
}

export function normalizeBangladeshMobile(value: string) {
  const compact = value.replace(/[\s\-().]/g, "");
  if (/^\+8801[3-9]\d{8}$/.test(compact)) return `0${compact.slice(4)}`;
  if (/^8801[3-9]\d{8}$/.test(compact)) return `0${compact.slice(3)}`;
  if (/^01[3-9]\d{8}$/.test(compact)) return compact;
  return null;
}

export function isValidBangladeshMobile(value: string) {
  return Boolean(normalizeBangladeshMobile(value));
}
