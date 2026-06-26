"use server";

import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth, isAdminRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateThermalRequestPdf } from "@/lib/thermal-pdf";
import { sendThermalPaymentRequestEmail, sendThermalRequestEmails } from "@/lib/mail";

async function guard() {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) throw new Error("Unauthorized");
}

export async function updateThermalRequest(formData: FormData) {
  await guard();
  const data = z.object({
    id: z.string().min(1),
    status: z.enum(["NEW", "REVIEWED", "QUOTED", "AWAITING_PAYMENT", "PAID", "SCHEDULED", "COMPLETED", "CANCELLED"]),
    internalNotes: z.string().max(5000).optional(),
    calculatedFeeBdt: z.coerce.number().nonnegative().optional()
  }).parse({
    id: formData.get("id"),
    status: formData.get("status"),
    internalNotes: String(formData.get("internalNotes") ?? ""),
    calculatedFeeBdt: String(formData.get("calculatedFeeBdt") ?? "") || undefined
  });
  const askForPayment = formData.get("askForPayment") === "on";
  const existing = await prisma.thermalInspectionRequest.findUnique({ where: { id: data.id } });
  if (!existing) throw new Error("Request not found");
  let fee = data.calculatedFeeBdt ?? null;
  if (askForPayment && !fee) {
    const rule = await prisma.thermalPricingRule.findFirst({ where: { isActive: true } });
    if (rule) {
      const subtotal = Number(rule.baseInspectionFeeBdt) + Number(rule.ratePerKwpBdt) * Number(existing.pvCapacityKwp);
      const multiplier = existing.inspectionType === "COMPREHENSIVE" ? Number(rule.comprehensiveMultiplier) : Number(rule.standardMultiplier);
      fee = Math.max(subtotal * multiplier, Number(rule.minimumInspectionFeeBdt));
    }
  }
  let updated = await prisma.thermalInspectionRequest.update({
    where: { id: data.id },
    data: {
      status: askForPayment && data.status === "QUOTED" ? "AWAITING_PAYMENT" : data.status,
      internalNotes: data.internalNotes || null,
      calculatedFeeBdt: fee,
      askForPayment
    }
  });
  const quotationChanged = askForPayment && fee && (!existing.askForPayment || Number(existing.calculatedFeeBdt ?? 0) !== fee);
  if (quotationChanged) {
    const pdf = await generateThermalRequestPdf(updated);
    updated = await prisma.thermalInspectionRequest.update({ where: { id: data.id }, data: { pdfFilePath: pdf.filePath } });
    try {
      const sent = await sendThermalPaymentRequestEmail(updated, pdf.bytes);
      await prisma.thermalInspectionRequest.update({
        where: { id: data.id },
        data: {
          emailSentAt: sent.clientSent ? new Date() : updated.emailSentAt,
          adminEmailSentAt: sent.adminSent ? new Date() : updated.adminEmailSentAt
        }
      });
    } catch (error) {
      console.error("Thermal payment email could not be sent", error);
    }
  }
  revalidatePath("/admin/thermal-inspections");
  revalidatePath("/thermal/inspection-request/success");
}

export async function saveThermalPricing(formData: FormData) {
  await guard();
  const data = z.object({
    baseInspectionFeeBdt: z.coerce.number().nonnegative(),
    ratePerKwpBdt: z.coerce.number().nonnegative(),
    distanceChargePerKmBdt: z.coerce.number().nonnegative(),
    minimumInspectionFeeBdt: z.coerce.number().nonnegative(),
    standardMultiplier: z.coerce.number().positive(),
    comprehensiveMultiplier: z.coerce.number().positive()
  }).parse(Object.fromEntries(formData));
  await prisma.thermalPricingRule.upsert({
    where: { name: "Default" },
    update: data,
    create: { name: "Default", ...data }
  });
  revalidatePath("/admin/thermal-inspections");
}

export async function resendThermalRequest(formData: FormData) {
  await guard();
  const id = z.string().parse(formData.get("id"));
  let request = await prisma.thermalInspectionRequest.findUnique({ where: { id } });
  if (!request) throw new Error("Request not found");
  let bytes: Uint8Array;
  if (request.pdfFilePath && existsSync(request.pdfFilePath)) bytes = await readFile(request.pdfFilePath);
  else {
    const pdf = await generateThermalRequestPdf(request);
    bytes = pdf.bytes;
    request = await prisma.thermalInspectionRequest.update({ where: { id }, data: { pdfFilePath: pdf.filePath } });
  }
  const result = await sendThermalRequestEmails(request, bytes);
  await prisma.thermalInspectionRequest.update({
    where: { id },
    data: { emailSentAt: result.clientSent ? new Date() : request.emailSentAt, adminEmailSentAt: result.adminSent ? new Date() : request.adminEmailSentAt }
  });
  revalidatePath(`/admin/thermal-inspections?view=${id}`);
}
