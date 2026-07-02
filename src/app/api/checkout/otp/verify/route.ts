import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { MOBILE_VALIDATION_MESSAGE, normalizeBangladeshMobile } from "@/lib/checkout-validation";
import { prisma } from "@/lib/prisma";

const schema = z.object({ mobile: z.string().trim().min(1), otp: z.string().trim().regex(/^\d{6}$/) });

export async function POST(request: Request) {
  try {
    const parsed = schema.parse(await request.json());
    const mobile = normalizeBangladeshMobile(parsed.mobile);
    if (!mobile) {
      return NextResponse.json({ error: MOBILE_VALIDATION_MESSAGE, fieldErrors: { customerPhone: MOBILE_VALIDATION_MESSAGE } }, { status: 400 });
    }
    const { otp } = parsed;
    const record = await prisma.otpVerification.findFirst({
      where: { mobile, purpose: "checkout", verifiedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" }
    });
    if (!record) return NextResponse.json({ error: "OTP expired. Please request a new code.", fieldErrors: { otp: "OTP expired. Please request a new code." } }, { status: 400 });
    if (record.attempts >= 5) return NextResponse.json({ error: "Too many attempts. Please request a new OTP.", fieldErrors: { otp: "Too many attempts. Please request a new OTP." } }, { status: 429 });
    if (record.codeHash !== hashOtp(otp)) {
      await prisma.otpVerification.update({ where: { id: record.id }, data: { attempts: { increment: 1 } } });
      return NextResponse.json({ error: "OTP is incorrect.", fieldErrors: { otp: "OTP is incorrect." } }, { status: 400 });
    }
    await prisma.otpVerification.update({ where: { id: record.id }, data: { verifiedAt: new Date() } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const mobileIssue = error.issues.some((issue) => issue.path[0] === "mobile");
      const message = mobileIssue ? MOBILE_VALIDATION_MESSAGE : "Enter the 6 digit OTP.";
      return NextResponse.json({ error: message, fieldErrors: mobileIssue ? { customerPhone: message } : { otp: message } }, { status: 400 });
    }
    return NextResponse.json({ error: "Could not verify OTP." }, { status: 400 });
  }
}

function hashOtp(code: string) {
  return createHash("sha256").update(`${code}:${process.env.NEXTAUTH_SECRET ?? "alektra-dev-secret"}`).digest("hex");
}
