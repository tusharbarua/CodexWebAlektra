import { randomUUID } from "crypto";
import { mkdir, unlink, writeFile } from "fs/promises";
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
  const uploadDir = path.join(process.cwd(), "public", "uploads", options.kind, safeSubdir);
  await mkdir(uploadDir, { recursive: true });
  await writeFile(path.join(uploadDir, fileName), Buffer.from(await file.arrayBuffer()));
  return {
    url: `/uploads/${options.kind}/${safeSubdir ? `${safeSubdir}/` : ""}${fileName}`,
    mimeType: file.type,
    size: file.size,
    originalName: file.name
  };
}

export async function deletePublicUpload(url?: string | null) {
  if (!url?.startsWith("/uploads/")) return;
  const parts = url.split("/").filter(Boolean);
  if (parts.length < 3 || parts.length > 4) return;
  const [, kind, maybeSubdir, maybeFileName] = parts;
  const fileName = maybeFileName ?? maybeSubdir;
  const subdir = maybeFileName ? maybeSubdir : "";
  try {
    await unlink(path.join(process.cwd(), "public", "uploads", kind, subdir ? path.basename(subdir) : "", path.basename(fileName)));
  } catch {
    // Missing files should not block admin edits.
  }
}

export const uploadRules = {
  productImage: { allowedTypes: allowedImageTypes, maxBytes: 2 * 1024 * 1024 },
  adminImage: { allowedTypes: allowedImageTypes, maxBytes: 3 * 1024 * 1024 },
  heroVideo: { allowedTypes: allowedVideoTypes, maxBytes: Number(process.env.HERO_VIDEO_MAX_BYTES ?? 120 * 1024 * 1024) },
  datasheet: { allowedTypes: allowedDocumentTypes, maxBytes: 10 * 1024 * 1024 }
};
