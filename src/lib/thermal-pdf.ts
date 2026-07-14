import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import type { ThermalInspectionRequest } from "@prisma/client";
import { generateThermalServiceRequestPdf } from "@/lib/service-request-pdf";

export async function generateThermalRequestPdf(request: ThermalInspectionRequest) {
  const pdf = await generateThermalServiceRequestPdf(request);
  const preferred = path.join(process.cwd(), "storage", "thermal");
  const directory = await writableDirectory(preferred);
  const filePath = path.join(directory, `${request.requestNumber}.pdf`);
  await writeFile(filePath, pdf.bytes);
  return { bytes: pdf.bytes, filePath };
}

async function writableDirectory(preferred: string) {
  try {
    await mkdir(preferred, { recursive: true });
    return preferred;
  } catch {
    const fallback = path.join(os.tmpdir(), "alektra-thermal");
    await mkdir(fallback, { recursive: true });
    return fallback;
  }
}
