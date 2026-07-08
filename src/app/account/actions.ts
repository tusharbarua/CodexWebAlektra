"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  clearCustomerSession,
  createCustomerSession,
  createEmailVerificationToken,
  createPasswordResetToken,
  getCustomerSession,
  getValidEmailSetupCustomer,
  getValidPasswordResetCustomer,
  hashCustomerPassword,
  linkVerifiedGuestOrders,
  verifyCustomerPassword
} from "@/lib/customer-auth";
import { sendCustomerPasswordResetEmail, sendCustomerVerificationEmail } from "@/lib/mail";
import { normalizeBangladeshMobile } from "@/lib/checkout-validation";

type ActionState = {
  ok?: boolean;
  message?: string;
  fieldErrors?: Record<string, string>;
};

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

const rateLimitBuckets = new Map<string, RateLimitBucket>();

const emailSchema = z.string().trim().email("Please enter a valid email address.");
const passwordSchema = z.string()
  .min(8, "Password must be at least 8 characters.")
  .regex(/[A-Za-z]/, "Password must include at least one letter.");

export async function registerCustomer(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = z.object({
    fullName: z.string().trim().min(2, "Please enter your full name."),
    email: emailSchema,
    mobileNumber: z.string().trim().optional(),
    password: passwordSchema,
    repeatPassword: z.string().min(1, "Please repeat your password.")
  }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: flatten(parsed.error), message: "Please fix the highlighted fields." };
  const data = { ...parsed.data, email: parsed.data.email.toLowerCase() };
  if (data.password !== data.repeatPassword) {
    return { fieldErrors: { repeatPassword: "Passwords do not match." }, message: "Please fix the highlighted fields." };
  }
  const registerLimit = checkCustomerRateLimit(`register:${data.email}`, 5, 60 * 60 * 1000);
  if (registerLimit) return { message: registerLimit };
  const mobile = data.mobileNumber ? normalizeBangladeshMobile(data.mobileNumber) : null;
  if (data.mobileNumber && !mobile) {
    return { fieldErrors: { mobileNumber: "Please enter a valid Bangladeshi mobile number." }, message: "Please fix the highlighted fields." };
  }
  const existing = await prisma.customer.findUnique({ where: { email: data.email } });
  if (existing?.emailVerified) {
    return { fieldErrors: { email: "An account already exists with this email. Please sign in." }, message: "Account already exists." };
  }
  const customer = existing
    ? await prisma.customer.update({
      where: { id: existing.id },
      data: {
        fullName: data.fullName,
        mobileNumber: mobile,
        passwordHash: await hashCustomerPassword(data.password),
        isActive: true
      }
    })
    : await prisma.customer.create({
      data: {
        fullName: data.fullName,
        email: data.email,
        mobileNumber: mobile,
        passwordHash: await hashCustomerPassword(data.password)
      }
    });
  const token = await createEmailVerificationToken(customer.id);
  try {
    const result = await sendCustomerVerificationEmail({ email: customer.email, fullName: customer.fullName, token });
    if (result.skipped) {
      return { ok: true, message: "Account created, but verification email could not be sent because email is not configured. Please contact Alektra Renewable if you did not receive the verification email." };
    }
    return { ok: true, message: "We have sent a verification link to your email. Please verify your email to activate your account." };
  } catch {
    return { ok: true, message: "Account created, but verification email could not be sent. Please contact Alektra Renewable if you did not receive the verification email." };
  }
}

export async function loginCustomer(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = z.object({
    email: emailSchema,
    password: z.string().min(1, "Please enter your password.")
  }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: flatten(parsed.error), message: "Please fix the highlighted fields." };
  const email = parsed.data.email.toLowerCase();
  const loginLimit = checkCustomerRateLimit(`login:${email}`, 8, 15 * 60 * 1000);
  if (loginLimit) return { message: loginLimit };
  const customer = await prisma.customer.findUnique({ where: { email } });
  if (!customer?.isActive || !(await verifyCustomerPassword(parsed.data.password, customer.passwordHash))) {
    return { message: "Invalid email or password." };
  }
  if (!customer.emailVerified) {
    return { fieldErrors: { email: "Please verify your email before signing in." }, message: "Please verify your email before signing in." };
  }
  clearCustomerRateLimit(`login:${email}`);
  await prisma.customer.update({ where: { id: customer.id }, data: { lastLoginAt: new Date() } });
  await createCustomerSession(customer.id);
  redirect("/account?welcome=1");
}

export async function resendVerification(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = z.object({ email: emailSchema }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: flatten(parsed.error), message: "Please enter a valid email address." };
  const email = parsed.data.email.toLowerCase();
  const resendLimit = checkCustomerRateLimit(`resend:${email}`, 3, 60 * 60 * 1000);
  if (resendLimit) return { message: resendLimit };
  const customer = await prisma.customer.findUnique({ where: { email } });
  if (!customer || customer.emailVerified) {
    return { ok: true, message: "If this email needs verification, a new link will be sent shortly." };
  }
  const token = await createEmailVerificationToken(customer.id);
  try {
    const result = await sendCustomerVerificationEmail({ email: customer.email, fullName: customer.fullName, token });
    if (result.skipped) return { message: "Verification email could not be sent because email is not configured." };
    return { ok: true, message: "A new verification link has been sent." };
  } catch {
    return { message: "Verification email could not be sent. Please try again later." };
  }
}

export async function requestPasswordReset(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = z.object({ email: emailSchema }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: flatten(parsed.error), message: "Please enter a valid email address." };
  const email = parsed.data.email.toLowerCase();
  const limit = checkCustomerRateLimit(`forgot:${email}`, 4, 60 * 60 * 1000);
  if (limit) return { message: limit };
  const neutralMessage = "If an account exists with this email, a password reset link will be sent.";
  const customer = await prisma.customer.findUnique({ where: { email } });
  if (!customer?.isActive) return { ok: true, message: neutralMessage };
  const token = await createPasswordResetToken(customer.id);
  try {
    await sendCustomerPasswordResetEmail({ email: customer.email, fullName: customer.fullName, token });
  } catch {
    return { ok: true, message: "If an account exists with this email, a password reset link will be sent. If you do not receive it, please contact Alektra Renewable." };
  }
  return { ok: true, message: neutralMessage };
}

export async function resetCustomerPassword(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = z.object({
    token: z.string().min(1, "Reset token is missing."),
    password: passwordSchema,
    repeatPassword: z.string().min(1, "Please repeat your new password.")
  }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: flatten(parsed.error), message: "Please fix the highlighted fields." };
  if (parsed.data.password !== parsed.data.repeatPassword) {
    return { fieldErrors: { repeatPassword: "Password not matched." }, message: "Please fix the highlighted fields." };
  }
  const valid = await getValidPasswordResetCustomer(parsed.data.token);
  if (!valid) return { message: "Password reset link is invalid or expired." };
  await prisma.$transaction([
    prisma.customer.update({
      where: { id: valid.customer.id },
      data: { passwordHash: await hashCustomerPassword(parsed.data.password) }
    }),
    prisma.customerPasswordResetToken.update({
      where: { id: valid.row.id },
      data: { usedAt: new Date() }
    })
  ]);
  clearCustomerRateLimit(`login:${valid.customer.email}`);
  return { ok: true, message: "Password reset successful. You can now sign in." };
}

export async function completeCustomerAccountSetup(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = z.object({
    token: z.string().min(1, "Setup token is missing."),
    password: passwordSchema,
    repeatPassword: z.string().min(1, "Please repeat your password.")
  }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: flatten(parsed.error), message: "Please fix the highlighted fields." };
  if (parsed.data.password !== parsed.data.repeatPassword) {
    return { fieldErrors: { repeatPassword: "Password not matched." }, message: "Please fix the highlighted fields." };
  }
  const valid = await getValidEmailSetupCustomer(parsed.data.token);
  if (!valid) return { message: "Account setup link is invalid or expired." };
  const customer = await prisma.$transaction(async (tx) => {
    const updated = await tx.customer.update({
      where: { id: valid.customer.id },
      data: {
        passwordHash: await hashCustomerPassword(parsed.data.password),
        emailVerified: true,
        emailVerifiedAt: new Date()
      }
    });
    await tx.customerEmailVerificationToken.update({
      where: { id: valid.row.id },
      data: { usedAt: new Date() }
    });
    return updated;
  });
  await linkVerifiedGuestOrders(customer.id, customer.email);
  return { ok: true, message: "Account setup complete. You can now sign in and track your order." };
}

export async function logoutCustomer() {
  await clearCustomerSession();
  redirect("/shop");
}

export async function updateCustomerProfile(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const customer = await getCustomerSession();
  if (!customer) redirect("/account/login");
  const parsed = z.object({
    fullName: z.string().trim().min(2, "Please enter your full name."),
    mobileNumber: z.string().trim().optional()
  }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: flatten(parsed.error), message: "Please fix the highlighted fields." };
  const mobile = parsed.data.mobileNumber ? normalizeBangladeshMobile(parsed.data.mobileNumber) : null;
  if (parsed.data.mobileNumber && !mobile) {
    return { fieldErrors: { mobileNumber: "Please enter a valid Bangladeshi mobile number." }, message: "Please fix the highlighted fields." };
  }
  await prisma.customer.update({ where: { id: customer.id }, data: { fullName: parsed.data.fullName, mobileNumber: mobile } });
  revalidatePath("/account");
  revalidatePath("/account/profile");
  return { ok: true, message: "Profile updated." };
}

export async function saveCustomerAddress(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const customer = await getCustomerSession();
  if (!customer) redirect("/account/login");
  const parsed = addressSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: flatten(parsed.error), message: "Please fix the highlighted fields." };
  const data = parsed.data;
  const mobile = normalizeBangladeshMobile(data.mobileNumber);
  if (!mobile) return { fieldErrors: { mobileNumber: "Please enter a valid Bangladeshi mobile number." }, message: "Please fix the highlighted fields." };
  await prisma.$transaction(async (tx) => {
    if (data.isDefault === "on") {
      await tx.customerAddress.updateMany({ where: { customerId: customer.id }, data: { isDefault: false } });
    }
    const payload = {
      recipientName: data.recipientName,
      mobileNumber: mobile,
      divisionId: data.divisionId || null,
      divisionName: data.divisionName,
      districtId: data.districtId || null,
      districtName: data.districtName,
      upazilaId: data.upazilaId || null,
      upazilaName: data.upazilaName,
      addressLine: data.addressLine,
      postalCode: data.postalCode || null,
      deliveryNotes: data.deliveryNotes || null,
      isDefault: data.isDefault === "on"
    };
    if (data.id) {
      await tx.customerAddress.updateMany({ where: { id: data.id, customerId: customer.id }, data: payload });
    } else {
      await tx.customerAddress.create({ data: { ...payload, customerId: customer.id } });
    }
  });
  revalidatePath("/account/addresses");
  return { ok: true, message: "Address saved." };
}

export async function deleteCustomerAddress(formData: FormData) {
  const customer = await getCustomerSession();
  if (!customer) redirect("/account/login");
  const id = z.string().min(1).parse(formData.get("id"));
  await prisma.customerAddress.deleteMany({ where: { id, customerId: customer.id } });
  revalidatePath("/account/addresses");
}

export async function setDefaultCustomerAddress(formData: FormData) {
  const customer = await getCustomerSession();
  if (!customer) redirect("/account/login");
  const id = z.string().min(1).parse(formData.get("id"));
  await prisma.$transaction([
    prisma.customerAddress.updateMany({ where: { customerId: customer.id }, data: { isDefault: false } }),
    prisma.customerAddress.updateMany({ where: { id, customerId: customer.id }, data: { isDefault: true } })
  ]);
  revalidatePath("/account/addresses");
}

const addressSchema = z.object({
  id: z.string().optional(),
  recipientName: z.string().trim().min(2, "Recipient name is required."),
  mobileNumber: z.string().trim().min(1, "Mobile number is required."),
  divisionId: z.string().trim().optional(),
  divisionName: z.string().trim().min(2, "Division is required."),
  districtId: z.string().trim().optional(),
  districtName: z.string().trim().min(2, "District is required."),
  upazilaId: z.string().trim().optional(),
  upazilaName: z.string().trim().min(2, "Upazila/thana is required."),
  addressLine: z.string().trim().min(4, "Detailed address is required."),
  postalCode: z.string().trim().optional(),
  deliveryNotes: z.string().trim().optional(),
  isDefault: z.string().optional()
});

function flatten(error: z.ZodError) {
  const fields: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path[0]?.toString();
    if (key && !fields[key]) fields[key] = issue.message;
  }
  return fields;
}

function checkCustomerRateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const current = rateLimitBuckets.get(key);
  if (!current || current.resetAt <= now) {
    rateLimitBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return "";
  }
  current.count += 1;
  if (current.count > limit) {
    const waitMinutes = Math.max(1, Math.ceil((current.resetAt - now) / 60000));
    return `Too many attempts. Please try again in ${waitMinutes} minute${waitMinutes === 1 ? "" : "s"}.`;
  }
  return "";
}

function clearCustomerRateLimit(key: string) {
  rateLimitBuckets.delete(key);
}
