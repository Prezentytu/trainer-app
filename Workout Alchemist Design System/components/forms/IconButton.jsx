import React, { useState } from "react";
export function IconButton({ label, size = "md", variant = "ghost", active, disabled, children, style, ...rest }) {
  const [hov, setHov] = useState(false);
  const d = size === "sm" ? 32 : size === "lg" ? 48 : 40;
  const bg = active ? "var(--accent-dim)" : hov && !disabled ? "var(--surface-hover)" : variant === "outline" ? "var(--surface-card)" : "transparent";
  return (
    <button aria-label={label} title={label} disabled={disabled} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ width: d, height: d, borderRadius: "var(--radius-md)", border: variant === "outline" ? "1px solid var(--border-strong)" : "none", background: bg, color: active ? "var(--accent)" : "var(--text-secondary)", display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: disabled ? "default" : "pointer", opacity: disabled ? 0.4 : 1, transition: "background var(--dur-fast) var(--ease-out)", ...style }} {...rest}>
      {children}
    </button>
  );
}
