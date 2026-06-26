import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import type { ThermalInspectionRequest } from "@prisma/client";

type ModuleDetail = { model: string; capacityWp: number; quantity: number };

export async function generateThermalRequestPdf(request: ThermalInspectionRequest) {
  const pdf = await PDFDocument.create();
  let page = pdf.addPage([595, 842]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const modules = request.moduleDetails as ModuleDetail[];
  let y = 792;
  const addText = (value: string, size = 10, weight = font, color = rgb(0.12, 0.1, 0.18)) => {
    if (y < 70) { page = pdf.addPage([595, 842]); y = 790; }
    const lines = wrap(value, size, 510);
    for (const line of lines) { page.drawText(line, { x: 42, y, size, font: weight, color }); y -= size + 5; }
  };
  page.drawRectangle({ x: 0, y: 730, width: 595, height: 112, color: rgb(0.055, 0.025, 0.1) });
  page.drawRectangle({ x: 0, y: 730, width: 12, height: 112, color: rgb(1, 0.43, 0.16) });
  page.drawText("ALEKTRA THERMAL", { x: 42, y: 792, size: 24, font: bold, color: rgb(1, 0.82, 0.3) });
  page.drawText("Aerial Thermal Inspection Request", { x: 42, y: 761, size: 14, font, color: rgb(1, 1, 1) });
  y = 700;
  addText(`Request ID: ${request.requestNumber}`, 11, bold);
  addText(`Date: ${request.createdAt.toLocaleDateString("en-GB")}`);
  addText(`Inspection type: ${request.inspectionType === "STANDARD" ? "Standard" : "Comprehensive"}`);
  y -= 8; addText("Client and project", 14, bold, rgb(0.44, 0.12, 0.7));
  addText(`Institution: ${request.institutionName}`);
  addText(`Email: ${request.email}   |   Contact: ${request.contactNumber}`);
  addText(`Address: ${request.address}`);
  addText(`Project location: ${request.projectLocation}`);
  if (request.latitude && request.longitude) addText(`Google Maps: https://maps.google.com/?q=${request.latitude},${request.longitude}`);
  y -= 8; addText("PV module details", 14, bold, rgb(0.44, 0.12, 0.7));
  modules.forEach((module, index) => addText(`${index + 1}. ${module.model} | ${module.capacityWp} Wp | ${module.quantity} modules | ${(module.capacityWp * module.quantity / 1000).toFixed(2)} kWp`));
  addText(`Calculated PV capacity: ${request.pvCapacityKwp} kWp`, 11, bold);
  addText(`AC capacity: ${request.acCapacityKw} kW`);
  if (request.additionalNotes) { y -= 8; addText("Additional notes", 14, bold, rgb(0.44, 0.12, 0.7)); addText(request.additionalNotes); }
  if (request.askForPayment && request.calculatedFeeBdt) {
    y -= 8;
    addText(request.paymentStatus === "PAID" ? "Payment receipt" : "Commercial quotation", 14, bold, rgb(0.44, 0.12, 0.7));
    addText(`Inspection fee: BDT ${Number(request.calculatedFeeBdt).toLocaleString("en-BD")}`, 11, bold);
    addText(`Payment status: ${request.paymentStatus.replaceAll("_", " ")}`);
    if (request.sslTransactionId) addText(`Transaction reference: ${request.sslTransactionId}`);
  }
  y -= 8; addText("Next steps", 14, bold, rgb(0.44, 0.12, 0.7));
  addText(request.paymentStatus === "PAID"
    ? "Payment has been recorded. Our team will contact you to confirm flight planning and scheduling."
    : "Our team will review the site information, confirm flight requirements and contact you with scheduling and commercial details.");
  addText("Minimum thermal inspection site size: 50 kWp.", 10, bold);
  addText("Alektra Renewable | www.alektraepc.com | info@alektraepc.com");
  const bytes = await pdf.save();
  const preferred = path.join(process.cwd(), "storage", "thermal");
  const directory = await writableDirectory(preferred);
  const filePath = path.join(directory, `${request.requestNumber}.pdf`);
  await writeFile(filePath, bytes);
  return { bytes, filePath };
}

async function writableDirectory(preferred: string) {
  try { await mkdir(preferred, { recursive: true }); return preferred; }
  catch { const fallback = path.join(os.tmpdir(), "alektra-thermal"); await mkdir(fallback, { recursive: true }); return fallback; }
}

function wrap(text: string, size: number, width: number) {
  const max = Math.max(25, Math.floor(width / (size * 0.53)));
  const words = text.replace(/\s+/g, " ").split(" ");
  const lines: string[] = []; let line = "";
  for (const word of words) {
    if (`${line} ${word}`.trim().length > max) { lines.push(line); line = word; }
    else line = `${line} ${word}`.trim();
  }
  if (line) lines.push(line);
  return lines;
}
