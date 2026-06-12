import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const contactSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  company: z.string().optional(),
  interest: z.string().min(2),
  message: z.string().min(10)
});

export async function POST(request: Request) {
  try {
    const body = contactSchema.parse(await request.json());
    const submission = await prisma.contactSubmission.create({ data: body });
    return NextResponse.json({ ok: true, submissionId: submission.id });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Contact submission failed." },
      { status: 400 }
    );
  }
}
