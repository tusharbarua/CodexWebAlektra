import { stat } from "fs/promises";
import { createReadStream } from "fs";
import { Readable } from "stream";
import { notFound } from "next/navigation";
import { resolvePublicUploadPath } from "@/lib/uploads";

export const dynamic = "force-dynamic";

const contentTypes: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  mp4: "video/mp4",
  webm: "video/webm",
  pdf: "application/pdf",
  svg: "image/svg+xml"
};

export async function GET(request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const safePath = path.map((part) => part.trim()).filter(Boolean).join("/");
  const filePath = resolvePublicUploadPath(`/uploads/${safePath}`);
  if (!filePath) notFound();

  try {
    const fileStat = await stat(filePath);
    if (!fileStat.isFile()) notFound();
    const extension = filePath.split(".").pop()?.toLowerCase() ?? "";
    if (/^hero\/(?:epc\/homepage-hero|(?:thermal|sparkle|mapping)\/page-hero)-[0-9a-f-]{36}\.(mp4|webm)$/.test(safePath)) {
      return serveHeroVideo(request, filePath, fileStat.size, contentTypes[extension]);
    }
    const stream = Readable.toWeb(createReadStream(filePath)) as ReadableStream;
    return new Response(stream, {
      headers: {
        "Content-Type": contentTypes[extension] ?? "application/octet-stream",
        "Content-Length": String(fileStat.size),
        "Cache-Control": "public, max-age=31536000, immutable"
      }
    });
  } catch {
    notFound();
  }
}

function serveHeroVideo(request: Request, file: string, size: number, type: string) {
  const headers = new Headers({
    "Accept-Ranges": "bytes", "Content-Type": type, "Cache-Control": "public, max-age=31536000, immutable"
  });
  const range = request.headers.get("range");
  const match = range?.match(/^bytes=(\d*)-(\d*)$/i);
  let start = 0;
  let end = size - 1;
  if (match) {
    if (match[1]) {
      start = Number(match[1]);
      if (match[2]) end = Math.min(Number(match[2]), end);
    } else if (match[2]) {
      start = Math.max(0, size - Number(match[2]));
    }
  }
  if ((range && (!match || (!match[1] && !match[2]))) || start > end) {
    headers.set("Content-Range", `bytes */${size}`);
    return new Response(null, { status: 416, headers });
  }
  if (range) headers.set("Content-Range", `bytes ${start}-${end}/${size}`);
  headers.set("Content-Length", String(end - start + 1));
  const stream = request.method === "HEAD" ? null : Readable.toWeb(createReadStream(file, { start, end })) as ReadableStream;
  return new Response(stream, { status: range ? 206 : 200, headers });
}
