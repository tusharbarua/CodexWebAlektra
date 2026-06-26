import { createReadStream, existsSync } from "node:fs";
import { stat } from "node:fs/promises";
import { Readable } from "node:stream";
import { NextResponse } from "next/server";

const fallbackLogoPath =
  "E:\\FALCON\\ALEKTRA RENEWABLE\\COMPANY DOCS\\ALEKTRA BROCHURE\\ALEKTRA HEADER FOOTER\\Thermal display.png";

export async function GET() {
  const filePath = process.env.THERMAL_LOGO_PATH || fallbackLogoPath;
  if (!existsSync(filePath)) return NextResponse.json({ error: "Thermal logo is missing." }, { status: 404 });
  const fileStat = await stat(filePath);
  return new Response(Readable.toWeb(createReadStream(filePath)) as ReadableStream, {
    headers: {
      "Content-Type": "image/png",
      "Content-Length": String(fileStat.size),
      "Cache-Control": "public, max-age=31536000, immutable"
    }
  });
}
