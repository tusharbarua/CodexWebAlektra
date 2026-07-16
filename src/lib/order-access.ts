import crypto from "node:crypto";

export function createOrderAccessToken() {
  return crypto.randomBytes(32).toString("base64url");
}

export function isValidOrderAccessToken(value: string | null | undefined) {
  return typeof value === "string" && /^[A-Za-z0-9_-]{32,}$/.test(value);
}
