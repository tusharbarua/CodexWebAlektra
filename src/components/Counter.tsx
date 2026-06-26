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
    let frameId = 0;
    let observer: IntersectionObserver | null = null;
    const startAnimation = () => {
      if (hasRun.current) return;
      hasRun.current = true;
      observer?.disconnect();
      window.removeEventListener("scroll", checkVisibility);
      window.removeEventListener("resize", checkVisibility);
      const start = performance.now();
      const frame = (now: number) => {
        const progress = Math.min((now - start) / duration, 1);
        setDisplay(value * (1 - Math.pow(1 - progress, 3)));
        if (progress < 1) frameId = requestAnimationFrame(frame);
      };
      frameId = requestAnimationFrame(frame);
    };
    const checkVisibility = () => {
      const rect = node.getBoundingClientRect();
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
      if (rect.top < viewportHeight * 0.82 && rect.bottom > 0) startAnimation();
    };
    observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) startAnimation();
      },
      { threshold: 0.25 }
    );
    observer.observe(node);
    window.addEventListener("scroll", checkVisibility, { passive: true });
    window.addEventListener("resize", checkVisibility);
    requestAnimationFrame(checkVisibility);
    return () => {
      observer?.disconnect();
      window.removeEventListener("scroll", checkVisibility);
      window.removeEventListener("resize", checkVisibility);
      cancelAnimationFrame(frameId);
    };
  }, [duration, value]);

  return (
    <span ref={nodeRef}>
      {new Intl.NumberFormat("en-BD", { maximumFractionDigits }).format(display)}
    </span>
  );
}
