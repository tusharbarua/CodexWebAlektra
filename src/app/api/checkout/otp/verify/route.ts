import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const schema = z.object({ mobile: z.string().trim().min(7), otp: z.string().trim().regex(/^\d{6}$/) });

export async function POST(request: Request) {
  try {
    const { mobile, otp } = schema.parse(await request.json());
    const record = await prisma.otpVerification.findFirst({
      where: { mobile, purpose: "checkout", verifiedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" }
    });
    if (!record) return NextResponse.json({ error: "OTP expired. Please request a new code." }, { status: 400 });
    if (record.attempts >= 5) return NextResponse.json({ error: "Too many attempts. Please request a new OTP." }, { status: 429 });
    if (record.codeHash !== hashOtp(otp)) {
      await prisma.otpVerification.update({ where: { id: record.id }, data: { attempts: { increment: 1 } } });
      return NextResponse.json({ error: "OTP is incorrect." }, { status: 400 });
    }
    await prisma.otpVerification.update({ where: { id: record.id }, data: { verifiedAt: new Date() } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Enter the 6 digit OTP." }, { status: 400 });
    return NextResponse.json({ error: "Could not verify OTP." }, { status: 400 });
  }
}

function hashOtp(code: string) {
  return createHash("sha256").update(`${code}:${process.env.NEXTAUTH_SECRET ?? "alektra-dev-secret"}`).digest("hex");
}
