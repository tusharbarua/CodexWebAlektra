import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { generateThermalRequestPdf } from "@/lib/thermal-pdf";
import { sendThermalRequestEmails } from "@/lib/mail";

const moduleSchema = z.object({
  model: z.string().trim().min(1),
  capacityWp: z.coerce.number().positive(),
  quantity: z.coerce.number().int().positive()
});
const schema = z.object({
  inspectionType: z.enum(["STANDARD", "COMPREHENSIVE"]),
  modules: z.array(moduleSchema).min(1),
  acCapacityKw: z.coerce.number().nonnegative(),
  projectLocation: z.string().trim().min(3),
  latitude: z.union([z.string(), z.number()]).optional(),
  longitude: z.union([z.string(), z.number()]).optional(),
  institutionName: z.string().trim().min(2),
  address: z.string().trim().min(4),
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
    if (pvCapacityKwp < 50) return NextResponse.json({ error: "Minimum thermal inspection site size is 50 kWp." }, { status: 400 });
    const requestNumber = `ATH-${new Date().getFullYear()}-${Date.now().toString(36).toUpperCase()}`;
    let inspection = await prisma.thermalInspectionRequest.create({
      data: {
        requestNumber, inspectionType: body.inspectionType, moduleDetails: body.modules, pvCapacityKwp,
        acCapacityKw: body.acCapacityKw, projectLocation: body.projectLocation,
        latitude: numeric(body.latitude), longitude: numeric(body.longitude),
        institutionName: body.institutionName, address: body.address, email: body.email,
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
