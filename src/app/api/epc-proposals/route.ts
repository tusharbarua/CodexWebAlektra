import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const bdMobilePattern = /^(?:\+?8801|01)[3-9]\d{8}$/;

const schema = z.object({
  institutionName: z.string().trim().min(2, "Company/institution name is required."),
  contactPerson: z.string().trim().min(2, "Contact person name is required."),
  contactNumber: z.string().trim().transform((value) => value.replace(/[\s-]/g, "")).refine((value) => bdMobilePattern.test(value), "Please enter a valid Bangladeshi mobile number."),
  email: z.string().trim().email("Please enter a valid email address, or leave it blank.").optional().or(z.literal("")),
  address: z.string().trim().min(4, "Project location/address is required."),
  facilityType: z.string().trim().min(2, "Facility type is required."),
  projectType: z.string().trim().min(2, "Project type is required."),
  roofArea: z.string().trim().max(250).optional(),
  monthlyBill: z.string().trim().max(250).optional(),
  preferredCapacity: z.string().trim().max(250).optional(),
  transformerInfo: z.string().trim().max(500).optional(),
  additionalNotes: z.string().trim().max(4000).optional(),
  website: z.string().max(0, "Spam submission rejected."),
  mathA: z.coerce.number().int().min(1).max(20),
  mathB: z.coerce.number().int().min(1).max(20),
  mathAnswer: z.coerce.number().int(),
  startedAt: z.coerce.number().int().positive()
});

function fieldErrors(error: z.ZodError) {
  return error.issues.reduce<Record<string, string>>((acc, issue) => {
    const key = String(issue.path[0] ?? "form");
    if (!acc[key]) acc[key] = issue.message;
    return acc;
  }, {});
}

export async function POST(request: Request) {
  try {
    const body = schema.parse(await request.json());
    if (Date.now() - body.startedAt < 2500) {
      return NextResponse.json({ error: "Please take a moment to review the request before submitting." }, { status: 400 });
    }
    if (body.mathAnswer !== body.mathA + body.mathB) {
      return NextResponse.json(
        { error: "Please solve the math challenge correctly before submitting.", fieldErrors: { mathAnswer: "Please solve the math challenge correctly before submitting." } },
        { status: 400 }
      );
    }

    const count = await prisma.epcProposalRequest.count({
      where: {
        createdAt: {
          gte: new Date(new Date().getFullYear(), 0, 1),
          lt: new Date(new Date().getFullYear() + 1, 0, 1)
        }
      }
    });
    const requestNumber = `AR-EPC-${new Date().getFullYear()}-${String(count + 1).padStart(5, "0")}`;
    const row = await prisma.epcProposalRequest.create({
      data: {
        requestNumber,
        institutionName: body.institutionName,
        contactPerson: body.contactPerson,
        contactNumber: body.contactNumber,
        email: body.email || null,
        address: body.address,
        facilityType: body.facilityType,
        projectType: body.projectType,
        roofArea: body.roofArea || null,
        monthlyBill: body.monthlyBill || null,
        preferredCapacity: body.preferredCapacity || null,
        transformerInfo: body.transformerInfo || null,
        additionalNotes: body.additionalNotes || null
      }
    });

    return NextResponse.json({ ok: true, requestNumber: row.requestNumber });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Please fix the highlighted fields before submitting.", fieldErrors: fieldErrors(error) }, { status: 400 });
    }
    console.error("EPC proposal request failed", error);
    return NextResponse.json({ error: "We could not submit the proposal request. Please try again." }, { status: 500 });
  }
}
