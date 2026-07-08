import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

const CUSTOMER_SESSION_COOKIE = "alektra_customer_session";
const SESSION_DAYS = 30;

type CustomerSessionPayload = {
  customerId: string;
  exp: number;
};

export type CustomerSession = {
  id: string;
  fullName: string;
  email: string;
  mobileNumber: string | null;
  emailVerified: boolean;
  isActive: boolean;
};

export async function hashCustomerPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyCustomerPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function createCustomerSession(customerId: string) {
  const expires = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  const payload: CustomerSessionPayload = {
    customerId,
    exp: expires.getTime()
  };
  const token = signPayload(payload);
  (await cookies()).set(CUSTOMER_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires
  });
}

export async function clearCustomerSession() {
  (await cookies()).set(CUSTOMER_SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(0),
    maxAge: 0
  });
}

export async function getCustomerSession(): Promise<CustomerSession | null> {
  const token = (await cookies()).get(CUSTOMER_SESSION_COOKIE)?.value;
  const payload = token ? verifySignedPayload(token) : null;
  if (!payload || payload.exp < Date.now()) return null;
  const customer = await prisma.customer.findUnique({
    where: { id: payload.customerId },
    select: {
      id: true,
      fullName: true,
      email: true,
      mobileNumber: true,
      emailVerified: true,
      isActive: true
    }
  });
  if (!customer?.isActive || !customer.emailVerified) return null;
  await linkVerifiedGuestOrders(customer.id, customer.email);
  return customer;
}

export async function requireCustomer() {
  const customer = await getCustomerSession();
  if (!customer) redirect("/account/login");
  return customer;
}

export function createRawToken() {
  return crypto.randomBytes(32).toString("base64url");
}

export function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function createEmailVerificationToken(customerId: string) {
  const token = createRawToken();
  await prisma.customerEmailVerificationToken.create({
    data: {
      customerId,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    }
  });
  return token;
}

export async function createPasswordResetToken(customerId: string) {
  const token = createRawToken();
  await prisma.customerPasswordResetToken.create({
    data: {
      customerId,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + 60 * 60 * 1000)
    }
  });
  return token;
}

export async function verifyCustomerEmailToken(token: string) {
  const tokenHash = hashToken(token);
  const row = await prisma.customerEmailVerificationToken.findUnique({
    where: { tokenHash },
    include: { customer: true }
  });
  if (!row || row.usedAt || row.expiresAt < new Date()) {
    return { ok: false, message: "Verification link is invalid or expired." };
  }
  const customer = await prisma.$transaction(async (tx) => {
    const updated = await tx.customer.update({
      where: { id: row.customerId },
      data: {
        emailVerified: true,
        emailVerifiedAt: new Date()
      }
    });
    await tx.customerEmailVerificationToken.update({
      where: { id: row.id },
      data: { usedAt: new Date() }
    });
    return updated;
  });
  await linkVerifiedGuestOrders(customer.id, customer.email);
  return { ok: true, message: "Your email has been verified. You can now sign in.", customer };
}

export async function getValidPasswordResetCustomer(token: string) {
  const row = await prisma.customerPasswordResetToken.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { customer: true }
  });
  if (!row || row.usedAt || row.expiresAt < new Date()) return null;
  if (!row.customer.isActive) return null;
  return { row, customer: row.customer };
}

export async function getValidEmailSetupCustomer(token: string) {
  const row = await prisma.customerEmailVerificationToken.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { customer: true }
  });
  if (!row || row.usedAt || row.expiresAt < new Date()) return null;
  if (!row.customer.isActive) return null;
  return { row, customer: row.customer };
}

export async function linkVerifiedGuestOrders(customerId: string, email: string) {
  if (!email) return;
  await prisma.order.updateMany({
    where: {
      customerId: null,
      customerEmail: email
    },
    data: { customerId }
  });
}

function signPayload(payload: CustomerSessionPayload) {
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto.createHmac("sha256", customerSecret()).update(encoded).digest("base64url");
  return `${encoded}.${signature}`;
}

function verifySignedPayload(token: string): CustomerSessionPayload | null {
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return null;
  const expected = crypto.createHmac("sha256", customerSecret()).update(encoded).digest("base64url");
  if (signature.length !== expected.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
  try {
    return JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as CustomerSessionPayload;
  } catch {
    return null;
  }
}

function customerSecret() {
  const secret = process.env.CUSTOMER_SESSION_SECRET ?? process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
  if (secret) return secret;
  if (process.env.NODE_ENV === "production") {
    throw new Error("CUSTOMER_SESSION_SECRET or AUTH_SECRET must be configured in production.");
  }
  return "alektra-development-customer-session-secret";
}
