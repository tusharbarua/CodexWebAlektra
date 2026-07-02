import { PageKey, PublishStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type PublicHeroMedia = {
  id: string;
  pageKey: PageKey;
  mediaType: string;
  filePath: string;
  posterImagePath?: string | null;
  altText: string;
  title?: string | null;
};

export async function getPrimaryHeroMedia(pageKey: PageKey): Promise<PublicHeroMedia | null> {
  const media = await prisma.heroMedia.findFirst({
    where: {
      pageKey,
      isPublished: true,
      status: PublishStatus.PUBLISHED
    },
    orderBy: [
      { isPrimary: "desc" },
      { sortOrder: "asc" },
      { updatedAt: "desc" }
    ]
  });
  if (!media) return null;
  const filePath = media.filePath || media.url;
  if (!filePath || !["image", "video"].includes(media.mediaType)) return null;
  return {
    id: media.id,
    pageKey: media.pageKey,
    mediaType: media.mediaType,
    filePath,
    posterImagePath: media.posterImagePath,
    altText: media.altText || media.alt || media.title,
    title: media.title
  };
}
