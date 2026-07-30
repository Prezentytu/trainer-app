import React from "react";
import { Button } from "../forms/Button.jsx";
export function Dialog({ open = true, title, description, confirmLabel = "Confirm", cancelLabel = "Cancel", danger, onConfirm, onCancel, children, style }) {
  if (!open) return null;
  return (
    <div onClick={onCancel} style={{ position: "fixed", inset: 0, background: "var(--overlay-scrim)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
      <div role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}
        style={{ width: 400, maxWidth: "calc(100vw - 40px)", background: "var(--bg-raised)", border: "1px solid var(--border-strong)", borderRadius: "var(--radius-xl)", boxShadow: "var(--shadow-modal)", padding: "var(--space-6)", ...style }}>
        <div style={{ font: "var(--type-h3)", color: "var(--text-primary)" }}>{title}</div>
        {description && <div style={{ font: "var(--type-body)", color: "var(--text-secondary)", marginTop: 8 }}>{description}</div>}
        {children}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 24 }}>
          <Button variant="ghost" onClick={onCancel}>{cancelLabel}</Button>
          <Button variant={danger ? "danger" : "primary"} onClick={onConfirm}>{confirmLabel}</Button>
        </div>
      </div>
    </div>
  );
}
