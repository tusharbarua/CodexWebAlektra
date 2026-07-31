"use client";

/* eslint-disable @next/next/no-img-element */

import type React from "react";
import { useState } from "react";

export function SafePublicImage({
  src,
  fallbackSrc,
  fallbackSrcs,
  alt,
  className,
  fallbackClassName = "resources-image-placeholder",
  fallbackStyle,
  children
}: {
  src?: string | null;
  fallbackSrc?: string | null;
  fallbackSrcs?: Array<string | null | undefined>;
  alt: string;
  className: string;
  fallbackClassName?: string;
  fallbackStyle?: React.CSSProperties;
  children?: React.ReactNode;
}) {
  const candidates = [src, fallbackSrc, ...(fallbackSrcs ?? [])].filter((item, index, array): item is string => {
    return Boolean(item) && array.indexOf(item) === index;
  });
  const [failedIndexes, setFailedIndexes] = useState<number[]>([]);
  const activeIndex = candidates.findIndex((_, index) => !failedIndexes.includes(index));
  const imageSrc = activeIndex >= 0 ? candidates[activeIndex] : null;
  const showPlaceholder = !imageSrc;

  if (showPlaceholder) {
    return (
      <div className={`${className} ${fallbackClassName}`} style={fallbackStyle} role="img" aria-label={alt}>
        {children}
      </div>
    );
  }

  return (
    <div className={`${className} safe-public-image`}>
      <img
        src={imageSrc}
        alt={alt}
        loading="lazy"
        decoding="async"
        onError={() => {
          setFailedIndexes((indexes) => indexes.includes(activeIndex) ? indexes : [...indexes, activeIndex]);
        }}
      />
    </div>
  );
}
