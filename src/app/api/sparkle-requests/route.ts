import { NextResponse } from "next/server";
import { SparkleServiceType } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const moduleSchema = z.object({
  model: z.string().trim().min(1, "PV module model is required."),
  capacityWp: z.coerce.number().positive("Module capacity must be greater than 0."),
  quantity: z.coerce.number().int().positive("Module quantity must be greater than 0.")
});

const schema = z.object({
  serviceType: z.nativeEnum(SparkleServiceType),
  modules: z.array(moduleSchema).min(1),
  acCapacityKw: z.coerce.number().nonnegative(),
  institutionName: z.string().trim().min(2, "Institution name is required."),
  email: z.string().trim().email("Enter a valid email address."),
  contactNumber: z.string().trim().min(7, "Contact number is required."),
  additionalNotes: z.string().trim().max(4000).optional(),
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

    const pvCapacityKwp = body.modules.reduce((sum, module) => sum + module.capacityWp * module.quantity, 0) / 1000;
    if (pvCapacityKwp < 200) {
      return NextResponse.json({ error: "Minimum Sparkle service request size is 200 kWp." }, { status: 400 });
    }

    if (body.manualAddressFallback) {
      if (!body.manualDistrictArea) {
        return NextResponse.json({ error: "Please enter your detailed address." }, { status: 400 });
      }
    } else if (!body.divisionId || !body.divisionName || !body.districtId || !body.districtName || !body.upazilaId || !body.upazilaName) {
      return NextResponse.json({ error: "Please select division, district and upazila/thana." }, { status: 400 });
    }

    const requestNumber = `ASP-${new Date().getFullYear()}-${Date.now().toString(36).toUpperCase()}`;
    const row = await prisma.sparkleServiceRequest.create({
      data: {
        requestNumber,
        serviceType: body.serviceType,
        moduleDetails: body.modules,
        pvCapacityKwp,
        acCapacityKw: body.acCapacityKw,
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
        email: body.email,
        contactNumber: body.contactNumber,
        additionalNotes: body.additionalNotes || null
      }
    });

    return NextResponse.json({ ok: true, requestNumber: row.requestNumber });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Please check the form." }, { status: 400 });
    }
    console.error("Sparkle request failed", error);
    return NextResponse.json({ error: "We could not submit the request. Please try again." }, { status: 500 });
  }
}
