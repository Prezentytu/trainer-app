import React from "react";
export function Radio({ label, checked, onChange, name, value, disabled, style }) {
  return (
    <label style={{ display: "inline-flex", alignItems: "center", gap: 10, cursor: disabled ? "default" : "pointer", opacity: disabled ? 0.4 : 1, font: "var(--type-body)", color: "var(--text-primary)", ...style }}>
      <span style={{ position: "relative", width: 20, height: 20, flex: "none" }}>
        <input type="radio" name={name} value={value} checked={checked} disabled={disabled} onChange={() => onChange && onChange(value)} style={{ position: "absolute", inset: 0, opacity: 0, cursor: "inherit", margin: 0 }} />
        <span style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "var(--bg-raised)", border: checked ? "6px solid var(--accent)" : "1px solid var(--border-strong)", boxSizing: "border-box", transition: "border var(--dur-fast) var(--ease-out)" }}></span>
      </span>
      {label}
    </label>
  );
}
