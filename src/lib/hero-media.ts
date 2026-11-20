import { stat } from "node:fs/promises";
import { PageKey, Prisma, PublishStatus } from "@prisma/client";
import { epcHeroFallbackVideo, type EpcHeroPreview } from "@/lib/epc-hero-video";
import { heroUploadPrefix } from "@/lib/hero-upload-config";
import { getPublishedPage, sectionByKey, settings } from "@/lib/page-cms";
import { prisma } from "@/lib/prisma";
import { resolvePublicUploadPath, uploadRules } from "@/lib/uploads";

export type PublicHeroMedia = {
  id: string;
  pageKey: PageKey;
  mediaType: string;
  filePath: string;
  posterImagePath?: string | null;
  altText: string;
  title?: string | null;
};

export async function getSelectedHeroRecord(pageKey: PageKey, db: Prisma.TransactionClient = prisma) {
  const media = await db.heroMedia.findFirst({
    where: { pageKey, isPublished: true, status: PublishStatus.PUBLISHED },
    orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }, { updatedAt: "desc" }]
  });
  return media && (media.filePath || media.url) && ["image", "video"].includes(media.mediaType) ? media : null;
}

export async function getPrimaryHeroMedia(pageKey: PageKey): Promise<PublicHeroMedia | null> {
  const media = await getSelectedHeroRecord(pageKey);
  if (!media) return null;
  return {
    id: media.id,
    pageKey: media.pageKey,
    mediaType: media.mediaType,
    filePath: media.filePath || media.url,
    posterImagePath: media.posterImagePath,
    altText: media.altText || media.alt || media.title,
    title: media.title
  };
}

export function getEpcHeroMaxBytes() {
  const limit = uploadRules.heroVideo.maxBytes;
  return Number.isSafeInteger(limit) && limit > 0 ? limit : 80 * 1024 ** 2;
}

export async function getHeroFallbackPoster(pageKey: PageKey) {
  const page = await getPublishedPage(pageKey);
  const hero = sectionByKey(page, "hero");
  const posterImage = pageKey === PageKey.thermal
    ? "https://images.unsplash.com/photo-1508614589041-895b88991e3e?auto=format&fit=crop&w=1800&q=80"
    : "";
  return settings(hero?.settingsJson, { posterImage }).posterImage || null;
}

export function getEpcHeroPreview() {
  return getHeroPreview(PageKey.epc);
}

export async function getHeroPreview(pageKey: PageKey): Promise<EpcHeroPreview> {
  const media = await getSelectedHeroRecord(pageKey);
  const fallbackVideo = pageKey === PageKey.epc ? epcHeroFallbackVideo : "/uploads/hero/" + pageKey + "/" + pageKey + "-hero-video.mp4";
  const source = media ? media.filePath || media.url : fallbackVideo;
  const localPath = resolvePublicUploadPath(source);
  const info = localPath ? await stat(localPath).catch(() => null) : null;
  const isManagerUpload = source.startsWith("/uploads/hero/" + pageKey + "/" + heroUploadPrefix(pageKey) + "-");
  return {
    source,
    poster: media ? media.posterImagePath : await getHeroFallbackPoster(pageKey),
    fileName: isManagerUpload ? media?.title ?? null : source.split(/[?#]/)[0].split("/").pop() || null,
    size: media?.fileSize ?? info?.size ?? null,
    updatedAt: media?.updatedAt.toISOString() ?? info?.mtime.toISOString() ?? null,
    kind: !media ? "fallback" : media.mediaType === "image" ? "image" : "published"
  };
}
