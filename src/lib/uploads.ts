import { randomUUID } from "crypto";
import { constants } from "fs";
import { access, link, mkdir, open, unlink } from "fs/promises";
import path from "path";

type UploadKind = "products" | "projects" | "resources" | "hero" | "pages" | "datasheets";

const allowedImageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const allowedVideoTypes = new Set(["video/mp4", "video/webm"]);
const allowedDocumentTypes = new Set(["application/pdf"]);

const extensionByMime: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "video/mp4": "mp4",
  "video/webm": "webm",
  "application/pdf": "pdf"
};

export type SavedUpload = {
  url: string;
  mimeType: string;
  size: number;
  originalName: string;
};

export function getFiles(formData: FormData, fieldName: string) {
  return formData.getAll(fieldName).filter((entry): entry is File => {
    return typeof entry === "object" && "arrayBuffer" in entry && entry.size > 0;
  });
}

export function getUploadRoot() {
  const configured = process.env.UPLOAD_DIR?.trim();
  if (!configured) return path.join(process.cwd(), "public", "uploads");
  return path.isAbsolute(configured) ? configured : path.join(process.cwd(), configured);
}

export function resolvePublicUploadPath(urlPath: string) {
  if (!urlPath.startsWith("/uploads/")) return null;
  const parts = urlPath.split("/").filter(Boolean);
  if (parts.length < 3 || parts.length > 4) return null;
  const [, kind, maybeSubdir, maybeFileName] = parts;
  const fileName = maybeFileName ?? maybeSubdir;
  if (fileName.startsWith(".upload-")) return null;
  const subdir = maybeFileName ? maybeSubdir : "";
  const resolved = path.resolve(getUploadRoot(), kind, subdir ? path.basename(subdir) : "", path.basename(fileName));
  const root = path.resolve(getUploadRoot());
  if (resolved !== root && !resolved.startsWith(`${root}${path.sep}`)) return null;
  return resolved;
}

export async function saveUpload(
  file: File,
  options: {
    kind: UploadKind;
    allowedTypes: Set<string>;
    maxBytes: number;
    fallbackName: string;
    subdir?: string;
  }
): Promise<SavedUpload> {
  if (!options.allowedTypes.has(file.type)) {
    const allowed = Array.from(options.allowedTypes);
    if (allowed.every((type) => type.startsWith("image/"))) throw new Error("Please upload a valid image file.");
    throw new Error("This file type is not allowed.");
  }
  if (file.size > options.maxBytes) {
    throw new Error(`File must be ${Math.round(options.maxBytes / 1024 / 1024)} MB or smaller.`);
  }
  const extension = extensionByMime[file.type];
  if (!extension) throw new Error("This file type is not supported.");

  const baseName = path
    .parse(file.name || options.fallbackName)
    .name.toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "") || options.fallbackName;
  const fileName = `${baseName}-${randomUUID()}.${extension}`;
  const safeSubdir = options.subdir ? options.subdir.toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "") : "";
  const uploadDir = path.join(getUploadRoot(), options.kind, safeSubdir);
  const bytes = Buffer.from(await file.arrayBuffer());
  if (!bytes.length || bytes.length !== file.size) throw new Error("The upload could not be read in full.");
  if (allowedImageTypes.has(file.type) && !hasImageSignature(bytes, file.type)) {
    throw new Error("The uploaded image does not match its file format.");
  }

  const destination = path.join(uploadDir, fileName);
  const staging = path.join(uploadDir, `.upload-${randomUUID()}`);
  await mkdir(uploadDir, { recursive: true });
  const handle = await open(staging, "wx");
  try {
    try {
      await handle.writeFile(bytes);
      await handle.sync();
    } finally {
      await handle.close();
    }
    await access(staging, constants.R_OK);
    // Publish only complete files and fail if the destination already exists.
    await link(staging, destination);
  } finally {
    await unlink(staging).catch(() => {});
  }
  return {
    url: `/uploads/${options.kind}/${safeSubdir ? `${safeSubdir}/` : ""}${fileName}`,
    mimeType: file.type,
    size: file.size,
    originalName: file.name
  };
}

function hasImageSignature(bytes: Buffer, mimeType: string) {
  if (mimeType === "image/jpeg") return bytes.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]));
  if (mimeType === "image/png") return bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  return bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP";
}

export async function deletePublicUpload(url?: string | null) {
  if (!url) return;
  const filePath = resolvePublicUploadPath(url);
  if (!filePath) return;
  try {
    await unlink(filePath);
  } catch {
    // Missing files should not block admin edits.
  }
}

export const uploadRules = {
  productImage: { allowedTypes: allowedImageTypes, maxBytes: 2 * 1024 * 1024 },
  adminImage: { allowedTypes: allowedImageTypes, maxBytes: 3 * 1024 * 1024 },
  heroVideo: { allowedTypes: allowedVideoTypes, maxBytes: Number(process.env.HERO_VIDEO_MAX_BYTES ?? 80 * 1024 * 1024) },
  datasheet: { allowedTypes: allowedDocumentTypes, maxBytes: 10 * 1024 * 1024 }
};
