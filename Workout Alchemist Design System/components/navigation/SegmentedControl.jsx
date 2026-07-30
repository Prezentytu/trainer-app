import React from "react";
export function SegmentedControl({ items = [], value, onChange, full, style }) {
  return (
    <div style={{ display: full ? "flex" : "inline-flex", background: "var(--bg-raised)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)", padding: 3, gap: 2, ...style }}>
      {items.map((it) => { const t = typeof it === "string" ? { value: it, label: it } : it; const on = t.value === value;
        return (
          <button key={t.value} onClick={() => onChange && onChange(t.value)}
            style={{ all: "unset", cursor: "pointer", flex: full ? 1 : "none", textAlign: "center", padding: "7px 14px", borderRadius: "calc(var(--radius-md) - 3px)", font: "var(--type-body-strong)", fontSize: "var(--text-sm)", color: on ? "var(--text-primary)" : "var(--text-muted)", background: on ? "var(--surface-active)" : "transparent", boxShadow: on ? "inset 0 1px 0 rgba(243,241,236,0.05)" : "none", transition: "background var(--dur-fast) var(--ease-out)" }}>
            {t.label}
          </button>
        ); })}
    </div>
  );
}
