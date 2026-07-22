import React from "react";

export default function AtsGauge({ value = 0, size = 200, stroke = 12, testid = "ats-gauge" }) {
  const v = Math.max(0, Math.min(100, value));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (v / 100) * c;
  const color = v >= 75 ? "#4ade80" : v >= 50 ? "#facc15" : "#f87171";
  return (
    <div className="relative inline-flex items-center justify-center" data-testid={testid}>
      <svg width={size} height={size} className="progress-ring -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={stroke}
          stroke="rgba(255,255,255,0.06)"
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={stroke}
          stroke={color}
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ color }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="font-display text-5xl font-extrabold" style={{ color }}>{v}</div>
        <div className="text-xs uppercase tracking-[0.2em] text-gray-500 mt-1">ATS Score</div>
      </div>
    </div>
  );
}
