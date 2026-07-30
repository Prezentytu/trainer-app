import React, { useState } from "react";
export function Card({ title, eyebrow, meta, interactive, selected, children, style, ...rest }) {
  const [hov, setHov] = useState(false);
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ background: hov && interactive ? "var(--surface-hover)" : "var(--surface-card)", border: `1px solid ${selected ? "var(--accent)" : interactive && hov ? "var(--border-strong)" : "var(--border-subtle)"}`, borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-card)", padding: "var(--space-5)", cursor: interactive ? "pointer" : "default", transition: "background var(--dur-fast) var(--ease-out), border var(--dur-fast) var(--ease-out)", ...style }} {...rest}>
      {eyebrow && <div style={{ font: "var(--type-label)", color: "var(--text-muted)", letterSpacing: "var(--tracking-caps)", textTransform: "uppercase", marginBottom: 6 }}>{eyebrow}</div>}
      {title && <div style={{ font: "var(--type-h3)", color: "var(--text-primary)" }}>{title}</div>}
      {meta && <div style={{ font: "var(--type-caption)", color: "var(--text-muted)", marginTop: 4 }}>{meta}</div>}
      {children}
    </div>
  );
}
