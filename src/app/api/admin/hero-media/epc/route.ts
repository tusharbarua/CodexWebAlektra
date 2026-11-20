import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import { createWriteStream } from "node:fs";
import { link, mkdir, open, stat, unlink } from "node:fs/promises";
import path from "node:path";
import { Readable, Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import { promisify } from "node:util";
import { PageKey, Prisma, PublishStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { auth, isAdminRole } from "@/lib/auth";
import { epcHeroVideoTypes, epcVideoExtension, formatHeroVideoSize, type EpcHeroVideoExtension } from "@/lib/epc-hero-video";
import { getEpcHeroFallbackPoster, getEpcHeroMaxBytes, getSelectedHeroRecord } from "@/lib/hero-media";
import { prisma } from "@/lib/prisma";
import { getUploadRoot } from "@/lib/uploads";

export const runtime = "nodejs";

const run = promisify(execFile);

class UploadError extends Error {
  constructor(message: string, readonly status: number) { super(message); }
}

function json(body: object, status = 200) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (!origin || !host || !URL.canParse(origin)) return false;
  const parsed = new URL(origin);
  return parsed.host === host && ["http:", "https:"].includes(parsed.protocol);
}

async function verifyVideo(file: string, extension: EpcHeroVideoExtension, signal: AbortSignal) {
  const handle = await open(file, "r+");
  const signature = Buffer.alloc(4096);
  try {
    await handle.read(signature, 0, signature.length, 0);
    await handle.sync();
  } finally {
    await handle.close();
  }
  const validSignature = extension === "mp4"
    ? signature.toString("ascii", 4, 8) === "ftyp"
    : signature.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3])) && signature.includes(Buffer.from([0x42, 0x82, 0x84, 0x77, 0x65, 0x62, 0x6d]));
  if (!validSignature) throw new UploadError("This file does not contain a valid MP4 or WebM video. Export the original video again.", 422);

  const input = ["-protocol_whitelist", "file", "-f", extension === "mp4" ? "mov" : "matroska"];
  const options = { signal, timeout: 20000, maxBuffer: 128 * 1024, windowsHide: true };
  try {
    const { stdout } = await run("ffprobe", ["-v", "error", ...input, "-select_streams", "V:0", "-show_entries",
      "stream=codec_name,pix_fmt,width,height", "-of", "json", file], options);
    const track = JSON.parse(stdout).streams?.[0];
    const validCodec = extension === "mp4" ? track?.codec_name === "h264" : ["vp8", "vp9"].includes(track?.codec_name);
    if (!validCodec || !["yuv420p", "yuvj420p"].includes(track?.pix_fmt) || !track.width || !track.height) {
      throw new UploadError("Export as an 8-bit H.264 MP4 or an 8-bit VP8/VP9 WebM with 4:2:0 color. This encoding is not supported for the homepage.", 422);
    }
    await run("ffmpeg", ["-nostdin", "-v", "error", "-xerror", "-abort_on", "empty_output", "-threads", "2", ...input,
      "-i", file, "-map", "0:V:0", "-frames:v", "5", "-f", "null", "-"], options);
  } catch (error) {
    if (error instanceof UploadError) throw error;
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      throw new UploadError("The server could not start its video validator. Contact the site administrator.", 503);
    }
    throw new UploadError("The server could not decode the video. Export it again as H.264 MP4 and retry.", 422);
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) return json({ error: "Sign in again before uploading a video." }, 401);
  if (!isAdminRole(session.user.role) || !sameOrigin(request)) return json({ error: "This request cannot update the homepage video." }, 403);

  const maxBytes = getEpcHeroMaxBytes();
  const limitMessage = `Choose a video no larger than ${formatHeroVideoSize(maxBytes)}.`;
  let originalName: string;
  try {
    originalName = decodeURIComponent(request.headers.get("x-video-filename") ?? "");
  } catch {
    return json({ error: "Choose a file with a valid name." }, 400);
  }
  const extension = epcVideoExtension(originalName);
  const mime = request.headers.get("content-type")?.toLowerCase();
  if (!extension || originalName.length > 255 || /[/\\\u0000-\u001f]/.test(originalName) || mime !== epcHeroVideoTypes[extension]) {
    return json({ error: "Choose a valid .mp4 or .webm video." }, 415);
  }
  const declaredSize = request.headers.get("content-length");
  if (declaredSize && Number(declaredSize) > maxBytes) return json({ error: limitMessage }, 413);
  if (!request.body) return json({ error: "Choose a video before uploading." }, 400);

  const directory = path.join(getUploadRoot(), "hero", "epc");
  const id = randomUUID();
  const staging = path.join(directory, `.upload-${id}`);
  const fileName = `homepage-hero-${id}.${extension}`;
  const target = path.join(directory, fileName);
  const source = `/uploads/hero/epc/${fileName}`;
  let bytes = 0;
  let linked = false;
  let phase = "storage";
  try {
    await mkdir(directory, { recursive: true });
    await pipeline(Readable.from(request.body as unknown as AsyncIterable<Uint8Array>), new Transform({
      transform(chunk: Buffer, _encoding, done) {
        bytes += chunk.length;
        if (bytes > maxBytes) done(new UploadError(limitMessage, 413));
        else done(null, chunk);
      }
    }), createWriteStream(staging, { flags: "wx" }), { signal: request.signal });
    if (!bytes || (declaredSize && bytes !== Number(declaredSize))) throw new UploadError("The upload did not finish. Select the video and try again.", 400);
    await verifyVideo(staging, extension, request.signal);
    await link(staging, target);
    linked = true;
    if ((await stat(target)).size !== bytes) throw new UploadError("The server could not verify the saved video. Please try again.", 507);

    request.signal.throwIfAborted();
    phase = "publication";
    const fallbackPoster = await getEpcHeroFallbackPoster();
    const published = await prisma.$transaction(async (db) => {
      const previous = await getSelectedHeroRecord(PageKey.epc, db);
      const poster = previous ? previous.posterImagePath : fallbackPoster;
      await db.heroMedia.updateMany({ where: { pageKey: PageKey.epc, isPrimary: true }, data: { isPrimary: false } });
      const updated = await db.heroMedia.create({ data: {
        pageKey: PageKey.epc, mediaType: "video", title: originalName,
        url: source, filePath: source, posterImagePath: poster, alt: "Alektra EPC homepage hero video",
        mimeType: epcHeroVideoTypes[extension], fileSize: bytes, sortOrder: previous?.sortOrder ?? 0,
        isPrimary: true, isPublished: true, status: PublishStatus.PUBLISHED
      } });
      const active = await getSelectedHeroRecord(PageKey.epc, db);
      if (active?.id !== updated.id || active?.filePath !== source) throw new Error("The upload was not selected as the EPC homepage video");
      return updated;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

    phase = "revalidation";
    revalidatePath("/");
    revalidatePath("/admin/hero-media");
    return json({ preview: {
      source, poster: published.posterImagePath, fileName: originalName, size: bytes,
      updatedAt: published.updatedAt.toISOString(), kind: "published"
    } });
  } catch (error) {
    if (linked && (phase === "storage" || (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034"))) {
      await unlink(target).catch(() => {});
    }
    if (error instanceof UploadError) return json({ error: error.message }, error.status);
    if (request.signal.aborted) return json({ error: "The upload was interrupted. Please try again." }, 400);
    console.error("EPC hero video failed", { phase, code: (error as NodeJS.ErrnoException).code });
    if (phase === "storage") return json({ error: "The server could not save the video. Check the upload storage and try again." }, 507);
    if (phase === "revalidation") return json({ error: "The video was saved, but the page refresh failed. Reload this page to check the live video." }, 500);
    return json({ error: "The video could not be confirmed as published. Reload to check the current video before retrying." }, 409);
  } finally {
    await unlink(staging).catch(() => {});
  }
}
