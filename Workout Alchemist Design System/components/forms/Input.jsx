import React, { useState } from "react";
export function Input({ label, hint, error, prefix, suffix, mono, size = "md", style, ...rest }) {
  const [foc, setFoc] = useState(false);
  const h = size === "sm" ? "var(--control-h-sm)" : "var(--control-h-md)";
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6, font: "var(--type-label)", color: "var(--text-muted)", letterSpacing: "var(--tracking-caps)", textTransform: "uppercase", ...style }}>
      {label}
      <span style={{ display: "flex", alignItems: "center", gap: 8, height: h, padding: "0 12px", borderRadius: "var(--radius-md)", background: "var(--bg-raised)", border: `1px solid ${error ? "var(--danger)" : foc ? "var(--border-focus)" : "var(--border-strong)"}`, boxShadow: foc ? "var(--glow-accent)" : "none", transition: "box-shadow var(--dur-fast) var(--ease-out)" }}>
        {prefix && <span style={{ color: "var(--text-faint)", font: "var(--type-caption)", textTransform: "none", letterSpacing: 0 }}>{prefix}</span>}
        <input onFocus={() => setFoc(true)} onBlur={() => setFoc(false)}
          style={{ flex: 1, minWidth: 0, background: "none", border: "none", outline: "none", color: "var(--text-primary)", font: mono ? "var(--type-mono-sm)" : "var(--type-body)", letterSpacing: 0, textTransform: "none" }} {...rest} />
        {suffix && <span style={{ color: "var(--text-faint)", font: "var(--type-caption)", textTransform: "none", letterSpacing: 0 }}>{suffix}</span>}
      </span>
      {(error || hint) && <span style={{ font: "var(--type-caption)", color: error ? "var(--danger)" : "var(--text-faint)", textTransform: "none", letterSpacing: 0 }}>{error || hint}</span>}
    </label>
  );
}
