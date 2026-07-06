"use client";

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";

const droplets = [
  [7, 18, 8, 0], [14, 46, 7, 1.1], [21, 27, 10, 2.1], [29, 63, 8, 0.4],
  [36, 16, 7, 3.1], [43, 48, 11, 1.7], [51, 24, 8, 2.6], [58, 68, 9, 0.9],
  [64, 36, 7, 4.1], [71, 18, 12, 2.3], [78, 54, 8, 3.5], [86, 31, 9, 1.2],
  [93, 72, 7, 4.8], [11, 75, 10, 2.9], [25, 82, 8, 5.2], [39, 77, 7, 3.8],
  [54, 83, 9, 5.7], [68, 79, 8, 4.4], [82, 84, 10, 6.1], [17, 12, 6, 6.6],
  [33, 38, 7, 7.2], [47, 58, 8, 7.9], [62, 12, 6, 8.4], [74, 43, 7, 8.9],
  [88, 14, 8, 9.5], [5, 57, 7, 6.9], [27, 52, 6, 9.9], [49, 9, 7, 10.3],
  [69, 61, 6, 10.8], [91, 49, 7, 11.2], [57, 41, 6, 11.6], [37, 7, 7, 12.1]
];

type DropletStyle = CSSProperties & {
  "--x": string;
  "--y": string;
  "--size": string;
  "--delay": string;
};

export function SparkleDropletOverlay() {
  const [cycle, setCycle] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(() => setCycle((value) => (value + 1) % 1000), 10500);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="sparkle-droplets" aria-hidden="true" key={cycle}>
      {droplets.map(([x, y, size, delay], index) => (
        <span
          key={`${index}-${cycle}`}
          style={{
            "--x": `${x}%`,
            "--y": `${y}%`,
            "--size": `${size}px`,
            "--delay": `${delay}s`
          } as DropletStyle}
        />
      ))}
    </div>
  );
}
