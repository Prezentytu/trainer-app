import React, { useState } from "react";
const SIZES = { sm: ["--control-h-sm", "0 14px", "var(--text-sm)"], md: ["--control-h-md", "0 20px", "var(--text-base)"], lg: ["--control-h-lg", "0 26px", "var(--text-md)"] };
const V = {
  primary: { bg: "var(--accent)", hov: "var(--accent-hover)", act: "var(--accent-press)", fg: "var(--text-on-accent)", bd: "none" },
  secondary: { bg: "var(--surface-card)", hov: "var(--surface-hover)", act: "var(--surface-active)", fg: "var(--text-primary)", bd: "1px solid var(--border-strong)" },
  ghost: { bg: "transparent", hov: "var(--surface-hover)", act: "var(--surface-active)", fg: "var(--text-secondary)", bd: "none" },
  danger: { bg: "var(--clay-400)", hov: "var(--clay-400)", act: "var(--clay-500)", fg: "var(--ink-950)", bd: "none" },
};
export function Button({ variant = "primary", size = "md", icon, disabled, full, children, style, ...rest }) {
  const [hov, setHov] = useState(false); const [act, setAct] = useState(false);
  const v = V[variant] || V.primary; const [h, pad, fs] = SIZES[size] || SIZES.md;
  return (
    <button disabled={disabled} onMouseEnter={() => setHov(true)} onMouseLeave={() => { setHov(false); setAct(false); }} onMouseDown={() => setAct(true)} onMouseUp={() => setAct(false)}
      style={{ height: `var(${h})`, padding: pad, borderRadius: "var(--radius-md)", border: v.bd, cursor: disabled ? "default" : "pointer", background: disabled ? v.bg : act ? v.act : hov ? v.hov : v.bg, color: v.fg, font: `600 ${fs}/1 var(--font-body)`, display: full ? "flex" : "inline-flex", width: full ? "100%" : undefined, alignItems: "center", justifyContent: "center", gap: 8, opacity: disabled ? 0.4 : 1, transform: act ? "scale(0.98)" : "none", transition: "background var(--dur-fast) var(--ease-out), transform var(--dur-fast) var(--ease-out)" , ...style }} {...rest}>
      {icon}{children}
    </button>
  );
}
