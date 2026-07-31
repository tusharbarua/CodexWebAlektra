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

export async function GET(_request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const safePath = path.map((part) => part.trim()).filter(Boolean).join("/");
  const filePath = resolvePublicUploadPath(`/uploads/${safePath}`);
  if (!filePath) notFound();

  try {
    const fileStat = await stat(filePath);
    if (!fileStat.isFile()) notFound();
    const extension = filePath.split(".").pop()?.toLowerCase() ?? "";
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
