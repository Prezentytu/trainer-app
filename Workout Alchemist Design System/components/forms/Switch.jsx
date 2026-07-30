import React from "react";
export function Switch({ label, checked, onChange, disabled, style }) {
  return (
    <label style={{ display: "inline-flex", alignItems: "center", gap: 10, cursor: disabled ? "default" : "pointer", opacity: disabled ? 0.4 : 1, font: "var(--type-body)", color: "var(--text-primary)", ...style }}>
      <span style={{ position: "relative", width: 40, height: 24, flex: "none" }}>
        <input type="checkbox" role="switch" checked={checked} disabled={disabled} onChange={(e) => onChange && onChange(e.target.checked)} style={{ position: "absolute", inset: 0, opacity: 0, cursor: "inherit", margin: 0 }} />
        <span style={{ position: "absolute", inset: 0, borderRadius: "var(--radius-pill)", background: checked ? "var(--accent)" : "var(--ink-700)", border: "1px solid " + (checked ? "var(--accent)" : "var(--border-strong)"), transition: "background var(--dur-med) var(--ease-out)" }}></span>
        <span style={{ position: "absolute", top: 3, left: checked ? 19 : 3, width: 18, height: 18, borderRadius: "50%", background: checked ? "var(--ink-950)" : "var(--bone-300)", transition: "left var(--dur-med) var(--ease-out)" }}></span>
      </span>
      {label}
    </label>
  );
}
