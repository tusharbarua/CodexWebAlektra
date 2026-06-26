"use client";

import { useEffect, useRef, useState } from "react";

export function Counter({
  value,
  duration = 1600,
  maximumFractionDigits = 0
}: {
  value: number;
  duration?: number;
  maximumFractionDigits?: number;
}) {
  const nodeRef = useRef<HTMLSpanElement>(null);
  const hasRun = useRef(false);
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const node = nodeRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || hasRun.current) return;
        hasRun.current = true;
        observer.disconnect();
        const start = performance.now();
        const frame = (now: number) => {
          const progress = Math.min((now - start) / duration, 1);
          setDisplay(value * (1 - Math.pow(1 - progress, 3)));
          if (progress < 1) requestAnimationFrame(frame);
        };
        requestAnimationFrame(frame);
      },
      { threshold: 0.25 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [duration, value]);

  return (
    <span ref={nodeRef}>
      {new Intl.NumberFormat("en-BD", { maximumFractionDigits }).format(display)}
    </span>
  );
}
