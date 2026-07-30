import React from "react";
const T = { neutral: "var(--bone-300)", positive: "var(--teal-300)", danger: "var(--clay-400)", pr: "var(--pr)", gold: "var(--pr)" };
export function Toast({ tone = "neutral", icon, action, onAction, children, style }) {
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "12px 16px", background: "var(--ink-800)", border: "1px solid var(--border-strong)", borderRadius: "var(--radius-md)", boxShadow: "var(--shadow-raised)", font: "var(--type-body)", color: "var(--text-primary)", ...style }}>
      {icon && <span style={{ color: T[tone], display: "flex" }}>{icon}</span>}
      <span>{children}</span>
      {action && <button onClick={onAction} style={{ all: "unset", cursor: "pointer", font: "var(--type-body-strong)", fontSize: "var(--text-sm)", color: "var(--teal-300)", marginLeft: 6 }}>{action}</button>}
    </div>
  );
}
