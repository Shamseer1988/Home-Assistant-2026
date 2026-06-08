"use client";

// A 270° arc gauge — the temperature dial from the reference design.
export function RadialGauge({
  value,
  min,
  max,
  unit,
  sub,
  accent = "#fb923c",
}: {
  value: number;
  min: number;
  max: number;
  unit?: string;
  sub?: string;
  accent?: string;
}) {
  const size = 200;
  const stroke = 16;
  const r = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const C = 2 * Math.PI * r;
  const arc = 0.75; // 270° of the circle
  const range = max > min ? max - min : 1;
  const frac = Math.min(1, Math.max(0, (value - min) / range));

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="max-w-[200px]">
      <g transform={`rotate(135 ${cx} ${cy})`}>
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={stroke}
          strokeDasharray={`${C * arc} ${C}`}
          strokeLinecap="round"
        />
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={accent}
          strokeWidth={stroke}
          strokeDasharray={`${C * arc * frac} ${C}`}
          strokeLinecap="round"
        />
      </g>
      <text
        x="50%"
        y="47%"
        textAnchor="middle"
        dominantBaseline="middle"
        className="fill-white"
        style={{ fontSize: "2.5rem", fontWeight: 700 }}
      >
        {Math.round(value * 10) / 10}
        {unit}
      </text>
      {sub && (
        <text
          x="50%"
          y="66%"
          textAnchor="middle"
          className="fill-slate-400"
          style={{ fontSize: "0.8rem" }}
        >
          {sub}
        </text>
      )}
    </svg>
  );
}
