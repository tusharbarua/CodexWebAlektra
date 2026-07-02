"use client";

import { useState } from "react";
import type { PublicHeroMedia } from "@/lib/hero-media";

export function HeroMediaBackground({
  media,
  className = "hero-media-bg",
  videoClassName,
  imageClassName,
  fallbackVideoSrc,
  fallbackPosterImage
}: {
  media: PublicHeroMedia | null;
  className?: string;
  videoClassName?: string;
  imageClassName?: string;
  fallbackVideoSrc?: string;
  fallbackPosterImage?: string;
}) {
  const [failed, setFailed] = useState(false);
  const [fallbackFailed, setFallbackFailed] = useState(false);
  if ((!media || failed) && fallbackVideoSrc && !fallbackFailed) {
    return (
      <video
        className={videoClassName ?? className}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        poster={fallbackPosterImage}
        onError={() => setFallbackFailed(true)}
      >
        <source src={fallbackVideoSrc} type={fallbackVideoSrc.endsWith(".webm") ? "video/webm" : "video/mp4"} />
      </video>
    );
  }
  if (!media || failed) return null;
  if (media.mediaType === "video") {
    return (
      <video
        className={videoClassName ?? className}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        poster={media.posterImagePath ?? undefined}
        onError={() => setFailed(true)}
      >
        <source src={media.filePath} type={media.filePath.endsWith(".webm") ? "video/webm" : "video/mp4"} />
      </video>
    );
  }
  if (media.mediaType === "image") {
    // eslint-disable-next-line @next/next/no-img-element
    return <img className={imageClassName ?? className} src={media.filePath} alt={media.altText} onError={() => setFailed(true)} />;
  }
  return null;
}
