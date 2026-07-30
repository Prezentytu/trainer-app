import React from "react";
export function Tag({ onRemove, children, style }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, height: 28, padding: "0 10px", borderRadius: "var(--radius-pill)", background: "var(--bg-raised)", border: "1px solid var(--border-strong)", color: "var(--text-secondary)", font: "var(--type-caption)", ...style }}>
      {children}
      {onRemove && <button onClick={onRemove} aria-label="Remove" style={{ all: "unset", cursor: "pointer", color: "var(--text-faint)", lineHeight: 1, padding: 2 }}>×</button>}
    </span>
  );
}
