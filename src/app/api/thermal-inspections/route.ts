import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { generateThermalRequestPdf } from "@/lib/thermal-pdf";
import { sendThermalRequestEmails } from "@/lib/mail";
import { calculateThermalDistance } from "@/lib/thermal-distance";

const moduleSchema = z.object({
  model: z.string().trim().min(1),
  capacityWp: z.coerce.number().positive(),
  quantity: z.coerce.number().int().positive()
});
const schema = z.object({
  inspectionType: z.enum(["STANDARD", "COMPREHENSIVE"]),
  modules: z.array(moduleSchema).min(1),
  acCapacityKw: z.coerce.number().nonnegative(),
  projectLocation: z.string().trim().optional(),
  locationMode: z.enum(["google", "manual"]).optional(),
  divisionId: z.string().trim().optional(),
  divisionName: z.string().trim().optional(),
  districtId: z.string().trim().optional(),
  districtName: z.string().trim().optional(),
  upazilaId: z.string().trim().optional(),
  upazilaName: z.string().trim().optional(),
  postOffice: z.string().trim().optional(),
  postalCode: z.string().trim().optional(),
  projectLocationName: z.string().trim().optional(),
  projectFormattedAddress: z.string().trim().optional(),
  googlePlaceId: z.string().trim().optional(),
  manualAddressFallback: z.coerce.boolean().default(false),
  manualDistrictArea: z.string().trim().optional(),
  latitude: z.union([z.string(), z.number()]).optional(),
  longitude: z.union([z.string(), z.number()]).optional(),
  institutionName: z.string().trim().min(2),
  address: z.string().trim().optional(),
  addressLine: z.string().trim().optional(),
  email: z.string().trim().email(),
  contactNumber: z.string().trim().min(7),
  additionalNotes: z.string().trim().max(4000).optional(),
  website: z.string().max(0, "Spam submission rejected."),
  mathAnswer: z.coerce.number().int(),
  startedAt: z.coerce.number().int().positive()
});

export async function POST(request: Request) {
  try {
    const body = schema.parse(await request.json());
    const elapsed = Date.now() - body.startedAt;
    if (elapsed < 3000) return NextResponse.json({ error: "Please take a moment to review the request before submitting." }, { status: 400 });
    if (body.mathAnswer !== 11) return NextResponse.json({ error: "The math answer is incorrect." }, { status: 400 });
    const pvCapacityKwp = body.modules.reduce((sum, module) => sum + module.capacityWp * module.quantity, 0) / 1000;
    if (pvCapacityKwp < 50) return NextResponse.json({ error: "Minimum Thermal inspection request size is 50 kWp." }, { status: 400 });
    const latitude = numeric(body.latitude);
    const longitude = numeric(body.longitude);
    if ((latitude !== null && (latitude < -90 || latitude > 90)) || (longitude !== null && (longitude < -180 || longitude > 180))) {
      return NextResponse.json({ error: "Submitted coordinates are invalid." }, { status: 400 });
    }

    const addressLine = (body.addressLine || body.address || "").trim();
    if (addressLine.length < 4) {
      return NextResponse.json({ error: "Please enter your detailed address." }, { status: 400 });
    }

    let locationLabel = "";
    if (body.manualAddressFallback) {
      locationLabel = body.manualDistrictArea || "";
      if (!locationLabel) {
        return NextResponse.json({ error: "Please enter your detailed address." }, { status: 400 });
      }
    } else {
      if (!body.divisionId || !body.divisionName || !body.districtId || !body.districtName || !body.upazilaId || !body.upazilaName) {
        return NextResponse.json({ error: "Please select division, district and upazila/thana." }, { status: 400 });
      }
      locationLabel = [body.upazilaName, body.districtName, body.divisionName].filter(Boolean).join(", ");
    }

    const distance = latitude !== null && longitude !== null
      ? await calculateThermalDistance(latitude, longitude)
      : { distanceFromBaseKm: null, distanceCalculationStatus: "missing_project_coordinates" as const };
    const requestNumber = `ATH-${new Date().getFullYear()}-${Date.now().toString(36).toUpperCase()}`;
    let inspection = await prisma.thermalInspectionRequest.create({
      data: {
        requestNumber, inspectionType: body.inspectionType, moduleDetails: body.modules, pvCapacityKwp,
        acCapacityKw: body.acCapacityKw,
        projectLocation: body.projectFormattedAddress || body.projectLocation || locationLabel,
        projectLocationName: body.projectLocationName || locationLabel || null,
        projectFormattedAddress: body.projectFormattedAddress || [addressLine, locationLabel].filter(Boolean).join(", ") || null,
        googlePlaceId: body.googlePlaceId || null,
        manualAddressFallback: body.manualAddressFallback ? locationLabel : null,
        latitude, longitude,
        distanceFromBaseKm: distance.distanceFromBaseKm,
        distanceCalculationStatus: distance.distanceCalculationStatus,
        institutionName: body.institutionName, address: addressLine, email: body.email,
        contactNumber: body.contactNumber, additionalNotes: body.additionalNotes || null
      }
    });
    const pdf = await generateThermalRequestPdf(inspection);
    let emailResult = { clientSent: false, adminSent: false };
    try { emailResult = await sendThermalRequestEmails(inspection, pdf.bytes); }
    catch (error) { console.error("Thermal request email failed", error); }
    inspection = await prisma.thermalInspectionRequest.update({
      where: { id: inspection.id },
      data: {
        pdfFilePath: pdf.filePath,
        emailSentAt: emailResult.clientSent ? new Date() : null,
        adminEmailSentAt: emailResult.adminSent ? new Date() : null
      }
    });
    return NextResponse.json({ ok: true, requestNumber: inspection.requestNumber, emailSent: emailResult.clientSent });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.issues[0]?.message ?? "Please check the form." }, { status: 400 });
    console.error("Thermal request failed", error);
    return NextResponse.json({ error: "We could not submit the request. Please try again." }, { status: 500 });
  }
}

function numeric(value: string | number | undefined) {
  if (value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}
