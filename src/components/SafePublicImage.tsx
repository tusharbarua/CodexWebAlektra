"use client";

/* eslint-disable @next/next/no-img-element */

import type React from "react";
import { useState } from "react";

export function SafePublicImage({
  src,
  fallbackSrc,
  alt,
  className,
  fallbackClassName = "resources-image-placeholder",
  fallbackStyle,
  children
}: {
  src?: string | null;
  fallbackSrc?: string | null;
  alt: string;
  className: string;
  fallbackClassName?: string;
  fallbackStyle?: React.CSSProperties;
  children?: React.ReactNode;
}) {
  const [failedPrimary, setFailedPrimary] = useState(false);
  const [failedFallback, setFailedFallback] = useState(false);
  const imageSrc = failedPrimary && fallbackSrc && fallbackSrc !== src && !failedFallback ? fallbackSrc : src;
  const showPlaceholder = !imageSrc || (failedPrimary && (!fallbackSrc || fallbackSrc === src || failedFallback));

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
          if (imageSrc === fallbackSrc) setFailedFallback(true);
          else setFailedPrimary(true);
        }}
      />
    </div>
  );
}
