import React from "react";
export function Tabs({ items = [], value, onChange, style }) {
  return (
    <div role="tablist" style={{ display: "flex", gap: 4, borderBottom: "1px solid var(--border-subtle)", ...style }}>
      {items.map((it) => { const t = typeof it === "string" ? { value: it, label: it } : it; const on = t.value === value;
        return (
          <button key={t.value} role="tab" aria-selected={on} onClick={() => onChange && onChange(t.value)}
            style={{ all: "unset", cursor: "pointer", padding: "10px 14px", font: "var(--type-body-strong)", fontSize: "var(--text-sm)", color: on ? "var(--text-primary)" : "var(--text-muted)", borderBottom: on ? "2px solid var(--accent)" : "2px solid transparent", marginBottom: -1, display: "inline-flex", alignItems: "center", gap: 6, transition: "color var(--dur-fast) var(--ease-out)" }}>
            {t.label}{t.count != null && <span style={{ font: "var(--type-mono-sm)", color: "var(--text-faint)" }}>{t.count}</span>}
          </button>
        ); })}
    </div>
  );
}
