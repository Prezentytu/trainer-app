import React, { useState } from "react";
export function Select({ label, options = [], size = "md", style, ...rest }) {
  const [foc, setFoc] = useState(false);
  const h = size === "sm" ? "var(--control-h-sm)" : "var(--control-h-md)";
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6, font: "var(--type-label)", color: "var(--text-muted)", letterSpacing: "var(--tracking-caps)", textTransform: "uppercase", ...style }}>
      {label}
      <span style={{ position: "relative", display: "flex" }}>
        <select onFocus={() => setFoc(true)} onBlur={() => setFoc(false)}
          style={{ appearance: "none", width: "100%", height: h, padding: "0 36px 0 12px", borderRadius: "var(--radius-md)", background: "var(--bg-raised)", border: `1px solid ${foc ? "var(--border-focus)" : "var(--border-strong)"}`, boxShadow: foc ? "var(--glow-accent)" : "none", color: "var(--text-primary)", font: "var(--type-body)", letterSpacing: 0, textTransform: "none", cursor: "pointer" }} {...rest}>
          {options.map((o) => { const v = typeof o === "string" ? { value: o, label: o } : o; return <option key={v.value} value={v.value}>{v.label}</option>; })}
        </select>
        <svg style={{ position: "absolute", right: 12, top: "50%", marginTop: -8, pointerEvents: "none", color: "var(--text-muted)" }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
      </span>
    </label>
  );
}
