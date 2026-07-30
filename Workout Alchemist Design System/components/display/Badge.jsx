import React from "react";
const T = {
  pr: ["var(--pr-dim)", "var(--gold-300)"],
  gold: ["var(--pr-dim)", "var(--gold-300)"],
  accent: ["var(--accent-dim)", "var(--teal-300)"],
  positive: ["var(--positive-dim)", "var(--teal-300)"],
  danger: ["var(--danger-dim)", "var(--clay-400)"],
  neutral: ["var(--ink-700)", "var(--bone-300)"],
};
export function Badge({ tone = "neutral", icon, children, style }) {
  const [bg, fg] = T[tone] || T.neutral;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, height: 22, padding: "0 9px", borderRadius: "var(--radius-pill)", background: bg, color: fg, font: "var(--type-label)", letterSpacing: "0.04em", textTransform: "uppercase", ...style }}>
      {icon}{children}
    </span>
  );
}
