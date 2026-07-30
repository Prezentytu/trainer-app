import React from "react";
export function StatBlock({ label, value, unit, delta, size = "md", style }) {
  const up = typeof delta === "string" && delta.trim().startsWith("+");
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, ...style }}>
      <div style={{ font: "var(--type-label)", color: "var(--text-muted)", letterSpacing: "var(--tracking-caps)", textTransform: "uppercase" }}>{label}</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
        <span style={{ font: size === "lg" ? "var(--type-stat-lg)" : "var(--type-stat)", color: "var(--text-primary)" }}>{value}</span>
        {unit && <span style={{ font: "var(--type-mono-sm)", color: "var(--text-muted)" }}>{unit}</span>}
      </div>
      {delta && <div style={{ font: "var(--type-mono-sm)", color: up ? "var(--positive)" : "var(--text-muted)" }}>{delta}</div>}
    </div>
  );
}
