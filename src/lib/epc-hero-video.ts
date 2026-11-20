export const epcHeroFallbackVideo = "/uploads/hero/epc/epc-hero-video.mp4";
export const epcHeroUploadEndpoint = "/api/admin/hero-media/epc";
export const epcHeroVideoTypes = { mp4: "video/mp4", webm: "video/webm" } as const;

export type EpcHeroVideoExtension = keyof typeof epcHeroVideoTypes;

export type EpcHeroPreview = {
  source: string | null;
  poster: string | null;
  fileName: string | null;
  size: number | null;
  updatedAt: string | null;
  kind: "published" | "fallback" | "image";
};

export function epcVideoExtension(name: string): EpcHeroVideoExtension | null {
  const extension = name.split(".").pop()?.toLowerCase();
  return name.includes(".") && (extension === "mp4" || extension === "webm") ? extension : null;
}

export function formatHeroVideoSize(bytes: number) {
  return `${new Intl.NumberFormat("en", { maximumFractionDigits: 1 }).format(bytes / 1024 ** 2)} MiB`;
}
