"use client";

import { useEffect, useState } from "react";

export function Slider({
  value,
  min = 0,
  max = 100,
  step = 1,
  onCommit,
  label,
  suffix,
  accent = "#59a0ff",
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
  const [val, setVal] = useState(value);
  useEffect(() => setVal(value), [value]);

  const pct = max > min ? ((val - min) / (max - min)) * 100 : 0;
  const commit = () => onCommit(val);

  return (
    <div>
      {(label || suffix !== undefined) && (
        <div className="mb-1.5 flex justify-between text-xs text-slate-400">
          <span>{label}</span>
          <span className="font-medium text-white">
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
          background: `linear-gradient(to right, ${accent} ${pct}%, rgba(255,255,255,0.1) ${pct}%)`,
        }}
        className="w-full cursor-pointer"
      />
    </div>
  );
}
