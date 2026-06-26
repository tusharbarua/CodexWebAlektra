import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const contactSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name."),
  email: z.string().trim().email("Please enter a valid email address."),
  phone: z.string().trim().max(30).optional(),
  company: z.string().trim().max(120).optional(),
  interest: z.string().trim().min(2),
  message: z.string().trim().min(10, "Please add a little more detail to your message."),
  website: z.string().max(0, "Spam submission rejected."),
  mathAnswer: z.coerce.number().int(),
  startedAt: z.coerce.number().int().positive()
});

export async function POST(request: Request) {
  try {
    const body = contactSchema.parse(await request.json());
    const elapsed = Date.now() - body.startedAt;
    if (elapsed < 3000) {
      return NextResponse.json({ error: "Please take a moment to review your enquiry before sending." }, { status: 400 });
    }
    if (elapsed > 2 * 60 * 60 * 1000) {
      return NextResponse.json({ error: "This form has expired. Please refresh the page and try again." }, { status: 400 });
    }
    if (body.mathAnswer !== 11) {
      return NextResponse.json({ error: "The math answer is incorrect. Please try again." }, { status: 400 });
    }
    const submission = await prisma.contactSubmission.create({
      data: {
        name: body.name,
        email: body.email,
        phone: body.phone || null,
        company: body.company || null,
        interest: body.interest,
        message: body.message
      }
    });
    return NextResponse.json({ ok: true, submissionId: submission.id });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Please check the form." }, { status: 400 });
    }
    return NextResponse.json({ error: "We could not send your enquiry. Please try again." }, { status: 500 });
  }
}
