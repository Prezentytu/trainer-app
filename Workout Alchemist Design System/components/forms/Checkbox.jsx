import React from "react";
export function Checkbox({ label, checked, onChange, disabled, style }) {
  return (
    <label style={{ display: "inline-flex", alignItems: "center", gap: 10, cursor: disabled ? "default" : "pointer", opacity: disabled ? 0.4 : 1, font: "var(--type-body)", color: "var(--text-primary)", ...style }}>
      <span style={{ position: "relative", width: 20, height: 20, flex: "none" }}>
        <input type="checkbox" checked={checked} disabled={disabled} onChange={(e) => onChange && onChange(e.target.checked)} style={{ position: "absolute", inset: 0, opacity: 0, cursor: "inherit", margin: 0 }} />
        <span style={{ position: "absolute", inset: 0, borderRadius: "var(--radius-sm)", background: checked ? "var(--accent)" : "var(--bg-raised)", border: checked ? "1px solid var(--accent)" : "1px solid var(--border-strong)", display: "flex", alignItems: "center", justifyContent: "center", transition: "background var(--dur-fast) var(--ease-out)" }}>
          {checked && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-on-accent)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>}
        </span>
      </span>
      {label}
    </label>
  );
}
