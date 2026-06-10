"use client";

import { useAccentSky } from "@/lib/useAccent";
import type { HistoryPoint } from "@/lib/types";

export function Sparkline({
  points,
  accent,
  height = 48,
}: {
  points: HistoryPoint[];
  accent?: string;
  height?: number;
}) {
  const sky = useAccentSky();
  const color = accent ?? sky;
  if (points.length < 2) {
    return <p className="text-xs text-muted">Not enough history yet.</p>;
  }

  const width = 300;
  const values = points.map((p) => p.v);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const step = width / (points.length - 1);

  const line = points
    .map((p, i) => {
      const x = i * step;
      const y = height - ((p.v - min) / range) * height;
      return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
  const area = `${line} L ${width} ${height} L 0 ${height} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" preserveAspectRatio="none">
      <path d={area} fill={color} opacity={0.12} />
      <path d={line} fill="none" stroke={color} strokeWidth={2} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
