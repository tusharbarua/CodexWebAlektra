import type { PageKey } from "@prisma/client";
import { epcHeroVideoTypes, epcVideoExtension } from "@/lib/epc-hero-video";

export type DivisionHeroPageKey = Exclude<PageKey, "epc">;

export const divisionHeroLabels = {
  thermal: "Thermal",
  sparkle: "Sparkle",
  mapping: "Mapping"
} satisfies Record<DivisionHeroPageKey, string>;

export function isDivisionHeroPageKey(value: string | undefined): value is DivisionHeroPageKey {
  return value !== undefined && Object.hasOwn(divisionHeroLabels, value);
}

const heroImageTypes = { jpg: "image/jpeg", png: "image/png", webp: "image/webp" } as const;

export function getHeroUploadFormat(name: string, allowImages: boolean) {
  const video = epcVideoExtension(name);
  if (video) return { kind: "video", extension: video, mime: epcHeroVideoTypes[video] } as const;
  if (!allowImages || !name.includes(".")) return null;
  const suffix = name.split(".").pop()?.toLowerCase();
  const extension = suffix === "jpeg" ? "jpg" : suffix;
  if (extension !== "jpg" && extension !== "png" && extension !== "webp") return null;
  return { kind: "image", extension, mime: heroImageTypes[extension] } as const;
}

export function heroUploadPrefix(pageKey: PageKey) {
  return pageKey === "epc" ? "homepage-hero" : "page-hero";
}
