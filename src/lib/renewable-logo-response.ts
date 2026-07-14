import { createReadStream, existsSync, readFileSync } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";

const fallbackLogoPath = path.join(process.cwd(), "public", "brand", "alektra-renewable-logo.png");

function contentTypeFor(filePath: string) {
  const extension = path.extname(filePath).toLowerCase();
  if (extension === ".svg") return "image/svg+xml";
  if (extension === ".png") return "image/png";
  if (extension === ".webp") return "image/webp";
  if (extension === ".jpg" || extension === ".jpeg") return "image/jpeg";
  return "application/octet-stream";
}

function isRenderableLogo(filePath: string) {
  if (!existsSync(filePath)) return false;
  const header = readFileSync(filePath, { encoding: null }).subarray(0, 128);
  const textHeader = header.toString("utf8").trimStart().toLowerCase();
  return (
    header.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) ||
    header.subarray(0, 4).toString("ascii") === "RIFF" ||
    header.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff])) ||
    textHeader.startsWith("<svg")
  );
}

export async function renewableLogoResponse() {
  const requestedPath = process.env.ALEKTRA_RENEWABLE_LOGO_PATH;
  const filePath = requestedPath && isRenderableLogo(requestedPath) ? requestedPath : fallbackLogoPath;
  const fileStat = await stat(filePath);

  return new Response(Readable.toWeb(createReadStream(filePath)) as ReadableStream, {
    headers: {
      "Content-Type": contentTypeFor(filePath),
      "Content-Length": String(fileStat.size),
      "Cache-Control": "public, max-age=31536000, immutable"
    }
  });
}
