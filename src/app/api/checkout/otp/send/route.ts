import { createHash, randomInt } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const schema = z.object({ mobile: z.string().trim().min(7) });

export async function POST(request: Request) {
  try {
    const { mobile } = schema.parse(await request.json());
    const recent = await prisma.otpVerification.findFirst({
      where: { mobile, purpose: "checkout", createdAt: { gt: new Date(Date.now() - 60_000) } },
      orderBy: { createdAt: "desc" }
    });
    if (recent) return NextResponse.json({ error: "Please wait before requesting another OTP." }, { status: 429 });

    const code = String(randomInt(100000, 1000000));
    await prisma.otpVerification.create({
      data: {
        mobile,
        purpose: "checkout",
        codeHash: hashOtp(code),
        expiresAt: new Date(Date.now() + 5 * 60_000)
      }
    });

    const messaging = await prisma.messagingIntegration.findUnique({ where: { singletonKey: "default" } }).catch(() => null);
    if (!messaging?.isEnabled || !messaging.baseUrl || !messaging.apiKey) {
      console.log(`[Alektra checkout OTP] ${mobile}: ${code}`);
      return NextResponse.json({
        ok: true,
        message: "OTP generated. SMS is not configured in this environment.",
        ...(process.env.NODE_ENV !== "production" ? { developmentOtp: code } : {})
      });
    }

    return NextResponse.json({ ok: true, message: "OTP sent." });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Enter a valid mobile number." }, { status: 400 });
    return NextResponse.json({ error: "Could not send OTP." }, { status: 400 });
  }
}

function hashOtp(code: string) {
  return createHash("sha256").update(`${code}:${process.env.NEXTAUTH_SECRET ?? "alektra-dev-secret"}`).digest("hex");
}
