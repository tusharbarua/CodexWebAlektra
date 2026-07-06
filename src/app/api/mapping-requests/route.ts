import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  serviceType: z.string().trim().min(2, "Service type is required."),
  projectSiteType: z.string().trim().min(2, "Project/site type is required."),
  projectSize: z.string().trim().min(2, "Project area or approximate size is required."),
  preferredMethod: z.string().trim().min(2, "Preferred mapping method is required."),
  requiredDeliverables: z.array(z.string()).default([]),
  manualAddressFallback: z.coerce.boolean().default(false),
  divisionId: z.string().trim().optional(),
  divisionName: z.string().trim().optional(),
  districtId: z.string().trim().optional(),
  districtName: z.string().trim().optional(),
  upazilaId: z.string().trim().optional(),
  upazilaName: z.string().trim().optional(),
  postOffice: z.string().trim().optional(),
  postalCode: z.string().trim().optional(),
  manualDistrictArea: z.string().trim().optional(),
  addressLine: z.string().trim().min(4, "Detailed address is required."),
  institutionName: z.string().trim().min(2, "Institution name is required."),
  contactPerson: z.string().trim().min(2, "Contact person is required."),
  email: z.string().trim().email("Enter a valid email address.").optional().or(z.literal("")),
  contactNumber: z.string().trim().min(7, "Contact number is required."),
  additionalNotes: z.string().trim().max(4000).optional(),
  website: z.string().max(0, "Spam submission rejected."),
  mathAnswer: z.coerce.number().int(),
  startedAt: z.coerce.number().int().positive()
});

export async function POST(request: Request) {
  try {
    const body = schema.parse(await request.json());
    if (Date.now() - body.startedAt < 3000) {
      return NextResponse.json({ error: "Please take a moment to review the request before submitting." }, { status: 400 });
    }
    if (body.mathAnswer !== 12) {
      return NextResponse.json({ error: "The math answer is incorrect." }, { status: 400 });
    }

    if (body.manualAddressFallback) {
      if (!body.manualDistrictArea) {
        return NextResponse.json({ error: "Please enter your detailed address." }, { status: 400 });
      }
    } else if (!body.divisionId || !body.divisionName || !body.districtId || !body.districtName || !body.upazilaId || !body.upazilaName) {
      return NextResponse.json({ error: "Please select division, district and upazila/thana." }, { status: 400 });
    }

    const requestNumber = `AMP-${new Date().getFullYear()}-${Date.now().toString(36).toUpperCase()}`;
    const row = await prisma.mappingServiceRequest.create({
      data: {
        requestNumber,
        serviceType: body.serviceType,
        projectSiteType: body.projectSiteType,
        projectSize: body.projectSize,
        preferredMethod: body.preferredMethod,
        requiredDeliverables: body.requiredDeliverables,
        divisionId: body.manualAddressFallback ? null : body.divisionId || null,
        divisionName: body.manualAddressFallback ? null : body.divisionName || null,
        districtId: body.manualAddressFallback ? null : body.districtId || null,
        districtName: body.manualAddressFallback ? body.manualDistrictArea || null : body.districtName || null,
        upazilaId: body.manualAddressFallback ? null : body.upazilaId || null,
        upazilaName: body.manualAddressFallback ? null : body.upazilaName || null,
        postOffice: body.postOffice || null,
        postalCode: body.postalCode || null,
        addressLine: body.addressLine,
        manualAddressFallback: body.manualAddressFallback,
        institutionName: body.institutionName,
        contactPerson: body.contactPerson,
        email: body.email || null,
        contactNumber: body.contactNumber,
        additionalNotes: body.additionalNotes || null
      }
    });

    return NextResponse.json({ ok: true, requestNumber: row.requestNumber });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Please check the form." }, { status: 400 });
    }
    console.error("Mapping request failed", error);
    return NextResponse.json({ error: "We could not submit the request. Please try again." }, { status: 500 });
  }
}
