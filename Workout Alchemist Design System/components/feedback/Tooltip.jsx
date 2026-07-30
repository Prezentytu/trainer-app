import React, { useState } from "react";
export function Tooltip({ label, side = "top", children }) {
  const [on, setOn] = useState(false);
  const pos = side === "bottom" ? { top: "calc(100% + 8px)" } : { bottom: "calc(100% + 8px)" };
  return (
    <span style={{ position: "relative", display: "inline-flex" }} onMouseEnter={() => setOn(true)} onMouseLeave={() => setOn(false)} onFocus={() => setOn(true)} onBlur={() => setOn(false)}>
      {children}
      {on && <span role="tooltip" style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", ...pos, whiteSpace: "nowrap", background: "var(--ink-700)", border: "1px solid var(--border-strong)", color: "var(--text-primary)", font: "var(--type-caption)", padding: "5px 9px", borderRadius: "var(--radius-sm)", boxShadow: "var(--shadow-raised)", zIndex: 50, pointerEvents: "none" }}>{label}</span>}
    </span>
  );
}
