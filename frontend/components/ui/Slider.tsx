"use client";

import { useEffect, useState } from "react";
import { useAccentSky } from "@/lib/useAccent";

export function Slider({
  value,
  min = 0,
  max = 100,
  step = 1,
  onCommit,
  label,
  suffix,
  accent,
}: {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onCommit: (v: number) => void;
  label?: string;
  suffix?: string;
  accent?: string;
}) {
  const sky = useAccentSky();
  const color = accent ?? sky;
  const [val, setVal] = useState(value);
  useEffect(() => setVal(value), [value]);

  const pct = max > min ? ((val - min) / (max - min)) * 100 : 0;
  const commit = () => onCommit(val);

  return (
    <div>
      {(label || suffix !== undefined) && (
        <div className="mb-1.5 flex justify-between text-xs text-muted">
          <span>{label}</span>
          <span className="font-medium text-fg">
            {Math.round(val)}
            {suffix}
          </span>
        </div>
      )}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={val}
        onChange={(e) => setVal(Number(e.target.value))}
        onMouseUp={commit}
        onTouchEnd={commit}
        onKeyUp={commit}
        style={{
          background: `linear-gradient(to right, ${color} ${pct}%, rgba(255,255,255,0.1) ${pct}%)`,
        }}
        className="w-full cursor-pointer"
      />
    </div>
  );
}
