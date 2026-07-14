import { readFile } from "node:fs/promises";
import path from "node:path";
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage, type RGB } from "pdf-lib";
import type { MappingServiceRequest, SparkleServiceRequest } from "@prisma/client";

type PdfTheme = {
  brandName: string;
  title: string;
  logoPath: string;
  header: RGB;
  accent: RGB;
  soft: RGB;
  text: RGB;
  muted: RGB;
  disclaimer: string;
};

type PdfField = { label: string; value?: string | null };
type PdfSection = { title: string; fields: PdfField[] };
type ModuleDetail = { model?: string; capacityWp?: number; quantity?: number };

const themes: Record<"sparkle" | "mapping", PdfTheme> = {
  sparkle: {
    brandName: "Alektra Sparkle",
    title: "Solar Panel Cleaning Service Request",
    logoPath: "/brand/alektra-sparkle-logo.png",
    header: rgb(0.04, 0.2, 0.34),
    accent: rgb(0.17, 0.5, 0.72),
    soft: rgb(0.9, 0.98, 1),
    text: rgb(0.05, 0.14, 0.2),
    muted: rgb(0.33, 0.43, 0.49),
    disclaimer: "This document confirms that a solar panel cleaning service request has been submitted. Our team will review the information and contact you for scheduling and service confirmation."
  },
  mapping: {
    brandName: "Alektra Mapping",
    title: "Drone Mapping Service Request",
    logoPath: "/brand/alektra-mapping-logo.png",
    header: rgb(0.12, 0.1, 0.34),
    accent: rgb(0.81, 0.12, 0.22),
    soft: rgb(0.96, 0.95, 0.99),
    text: rgb(0.08, 0.07, 0.18),
    muted: rgb(0.35, 0.33, 0.45),
    disclaimer: "This document confirms that a mapping service request has been submitted. Our team will review the information and contact you for scope confirmation and scheduling."
  }
};

export async function generateSparkleRequestPdf(request: SparkleServiceRequest) {
  const modules = asArray<ModuleDetail>(request.moduleDetails);
  const moduleLines = modules.map((module, index) => {
    const capacityWp = Number(module.capacityWp ?? 0);
    const quantity = Number(module.quantity ?? 0);
    const capacityKwp = capacityWp && quantity ? ` | ${(capacityWp * quantity / 1000).toFixed(2)} kWp` : "";
    return `${index + 1}. ${module.model || "PV module"} | ${capacityWp || "-"} Wp | ${quantity || "-"} modules${capacityKwp}`;
  });

  return generateServiceRequestPdf({
    theme: themes.sparkle,
    requestNumber: request.requestNumber,
    createdAt: request.createdAt,
    sections: [
      {
        title: "Client and contact",
        fields: [
          { label: "Institution", value: request.institutionName },
          { label: "Email", value: request.email },
          { label: "Mobile", value: request.contactNumber },
          { label: "Status", value: formatStatus(request.status) }
        ]
      },
      {
        title: "Service details",
        fields: [
          { label: "Service type", value: formatStatus(request.serviceType) },
          { label: "PV capacity", value: `${request.pvCapacityKwp} kWp` },
          { label: "AC capacity", value: `${request.acCapacityKw} kW` },
          { label: "Module details", value: moduleLines.join("\n") || "Not provided" }
        ]
      },
      {
        title: "Project location",
        fields: [
          { label: "Address", value: request.addressLine },
          { label: "Division", value: request.divisionName },
          { label: "District", value: request.districtName },
          { label: "Upazila/Thana", value: request.upazilaName },
          { label: "Post office", value: request.postOffice },
          { label: "Postal code", value: request.postalCode },
          { label: "Manual address", value: request.manualAddressFallback ? "Yes" : "No" }
        ]
      },
      {
        title: "Additional notes",
        fields: [{ label: "Notes", value: request.additionalNotes || "Not provided" }]
      }
    ]
  });
}

export async function generateMappingRequestPdf(request: MappingServiceRequest) {
  const deliverables = asArray<string>(request.requiredDeliverables);

  return generateServiceRequestPdf({
    theme: themes.mapping,
    requestNumber: request.requestNumber,
    createdAt: request.createdAt,
    sections: [
      {
        title: "Client and contact",
        fields: [
          { label: "Institution", value: request.institutionName },
          { label: "Contact person", value: request.contactPerson },
          { label: "Email", value: request.email },
          { label: "Mobile", value: request.contactNumber },
          { label: "Status", value: formatStatus(request.status) }
        ]
      },
      {
        title: "Mapping scope",
        fields: [
          { label: "Service type", value: request.serviceType },
          { label: "Project/site type", value: request.projectSiteType },
          { label: "Project area/site size", value: request.projectSize },
          { label: "Requested mapping method", value: request.preferredMethod },
          { label: "Required deliverables", value: deliverables.length ? deliverables.join(", ") : "Not provided" }
        ]
      },
      {
        title: "Project location",
        fields: [
          { label: "Address", value: request.addressLine },
          { label: "Division", value: request.divisionName },
          { label: "District", value: request.districtName },
          { label: "Upazila/Thana", value: request.upazilaName },
          { label: "Post office", value: request.postOffice },
          { label: "Postal code", value: request.postalCode },
          { label: "Manual address", value: request.manualAddressFallback ? "Yes" : "No" }
        ]
      },
      {
        title: "Additional notes",
        fields: [{ label: "Notes", value: request.additionalNotes || "Not provided" }]
      }
    ]
  });
}

async function generateServiceRequestPdf(input: {
  theme: PdfTheme;
  requestNumber: string;
  createdAt: Date;
  sections: PdfSection[];
}) {
  const pdf = await PDFDocument.create();
  let page = pdf.addPage([595, 842]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const logo = await embedLogo(pdf, input.theme.logoPath);
  let y = 792;

  const newPage = () => {
    page = pdf.addPage([595, 842]);
    y = 792;
  };

  const ensureSpace = (height = 70) => {
    if (y < height) newPage();
  };

  const drawWrapped = (text: string, x: number, width: number, size: number, weight: PDFFont, color: RGB, lineGap = 4) => {
    const lines = wrap(text, size, width);
    for (const line of lines) {
      ensureSpace(64);
      page.drawText(line, { x, y, size, font: weight, color });
      y -= size + lineGap;
    }
  };

  drawHeader(page, input.theme, logo, font, bold, input.requestNumber, input.createdAt);
  y = 688;

  for (const section of input.sections) {
    ensureSpace(112);
    y -= 8;
    page.drawText(section.title, { x: 42, y, size: 14, font: bold, color: input.theme.accent });
    y -= 18;
    for (const field of section.fields) {
      if (!field.value) continue;
      ensureSpace(76);
      page.drawText(`${field.label}:`, { x: 52, y, size: 9.5, font: bold, color: input.theme.muted });
      drawWrapped(String(field.value), 154, 388, 10, font, input.theme.text);
      y -= 2;
    }
  }

  ensureSpace(150);
  y -= 8;
  page.drawRectangle({ x: 42, y: y - 58, width: 511, height: 76, color: input.theme.soft, borderColor: input.theme.accent, borderWidth: 0.7 });
  page.drawText("Next step", { x: 58, y: y - 2, size: 12, font: bold, color: input.theme.accent });
  y -= 20;
  drawWrapped(input.theme.disclaimer, 58, 478, 9.5, font, input.theme.text);
  y -= 42;

  drawFooter(page, input.theme, font, bold);
  const bytes = await pdf.save();
  return { bytes };
}

function drawHeader(page: PDFPage, theme: PdfTheme, logo: Awaited<ReturnType<typeof embedLogo>>, font: PDFFont, bold: PDFFont, requestNumber: string, createdAt: Date) {
  page.drawRectangle({ x: 0, y: 718, width: 595, height: 124, color: theme.header });
  page.drawRectangle({ x: 0, y: 718, width: 12, height: 124, color: theme.accent });
  page.drawRectangle({ x: 410, y: 718, width: 185, height: 124, color: theme.soft, opacity: 0.14 });

  if (logo) {
    const maxWidth = 170;
    const maxHeight = 58;
    const ratio = Math.min(maxWidth / logo.image.width, maxHeight / logo.image.height);
    page.drawImage(logo.image, { x: 42, y: 766, width: logo.image.width * ratio, height: logo.image.height * ratio });
  } else {
    page.drawText(theme.brandName.toUpperCase(), { x: 42, y: 792, size: 20, font: bold, color: rgb(1, 1, 1) });
  }

  page.drawText(theme.title, { x: 42, y: 742, size: 16, font: bold, color: rgb(1, 1, 1) });
  page.drawText(`Request ID: ${requestNumber}`, { x: 365, y: 792, size: 10.5, font: bold, color: rgb(1, 1, 1) });
  page.drawText(`Submitted: ${formatDate(createdAt)}`, { x: 365, y: 772, size: 9.5, font, color: rgb(0.92, 0.96, 0.98) });
}

function drawFooter(page: PDFPage, theme: PdfTheme, font: PDFFont, bold: PDFFont) {
  page.drawLine({ start: { x: 42, y: 54 }, end: { x: 553, y: 54 }, thickness: 0.7, color: theme.accent });
  page.drawText(theme.brandName, { x: 42, y: 36, size: 9.5, font: bold, color: theme.text });
  page.drawText("contact@alektraepc.com | +880 1735 954 844 | +880 1877 572 234 | Chattogram | Dhaka | Bangladesh | alektraepc.com", {
    x: 42,
    y: 22,
    size: 7.8,
    font,
    color: theme.muted
  });
}

async function embedLogo(pdf: PDFDocument, logoPath: string) {
  try {
    const file = await readFile(path.join(process.cwd(), "public", logoPath.replace(/^\//, "")));
    if (logoPath.toLowerCase().endsWith(".png")) return { image: await pdf.embedPng(file) };
    if (logoPath.toLowerCase().match(/\.(jpg|jpeg)$/)) return { image: await pdf.embedJpg(file) };
  } catch {
    return null;
  }
  return null;
}

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? value as T[] : [];
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Dhaka"
  }).format(date);
}

function formatStatus(value: string) {
  return value.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function wrap(text: string, size: number, width: number) {
  const max = Math.max(18, Math.floor(width / (size * 0.52)));
  const lines: string[] = [];
  for (const paragraph of text.replace(/\r/g, "").split("\n")) {
    const words = paragraph.trim().replace(/\s+/g, " ").split(" ").filter(Boolean);
    let line = "";
    for (const word of words) {
      const next = `${line} ${word}`.trim();
      if (next.length > max && line) {
        lines.push(line);
        line = word;
      } else {
        line = next;
      }
    }
    if (line) lines.push(line);
  }
  return lines.length ? lines : [""];
}
