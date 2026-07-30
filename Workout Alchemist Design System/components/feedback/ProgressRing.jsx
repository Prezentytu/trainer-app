import React from "react";
export function ProgressRing({ value = 0, size = 64, stroke = 5, color = "var(--accent)", label, sub, style }) {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r, v = Math.max(0, Math.min(1, value));
  return (
    <div style={{ position: "relative", width: size, height: size, ...style }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--ink-700)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - v)} style={{ transition: "stroke-dashoffset var(--dur-med) var(--ease-out)" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        {label && <span style={{ font: "var(--type-stat)", fontSize: size / 4.2, color: "var(--text-primary)" }}>{label}</span>}
        {sub && <span style={{ font: "var(--type-label)", fontSize: Math.max(9, size / 7.5), color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{sub}</span>}
      </div>
    </div>
  );
}
