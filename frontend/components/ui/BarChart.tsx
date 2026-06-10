"use client";

import { useAccentSky } from "@/lib/useAccent";

export function BarChart({
  data,
  accent,
  unit = "",
  height = 160,
}: {
  data: { label: string; value: number }[];
  accent?: string;
  unit?: string;
  height?: number;
}) {
  const sky = useAccentSky();
  const color = accent ?? sky;
  if (data.length === 0) return null;
  const max = Math.max(...data.map((d) => d.value), 0.001);

  return (
    <div className="flex items-end gap-3" style={{ height: height + 28 }}>
      {data.map((d, i) => (
        <div key={i} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
          <span className="text-[10px] font-semibold text-fg">
            {d.value % 1 === 0 ? d.value : d.value.toFixed(1)}
          </span>
          <div
            className="w-full rounded-t-lg"
            style={{
              height: Math.max(4, (d.value / max) * height),
              background: `linear-gradient(to top, ${color}, ${color}99)`,
            }}
            title={`${d.value}${unit}`}
          />
          <span className="w-full truncate text-center text-[10px] text-muted">
            {d.label}
          </span>
        </div>
      ))}
    </div>
  );
}
