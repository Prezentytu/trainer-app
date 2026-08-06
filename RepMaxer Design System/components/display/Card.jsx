import React from "react";

/** Grey block, 14px radius, no border, no shadow. `flat` swaps fill for a hairline. */
export function Card({ children, flat, onClick, pad = 16, className = "", style }) {
  const cls = ["s-card", flat ? "s-card--flat" : "", onClick ? "s-card--tap" : "", className].filter(Boolean).join(" ");
  const s = { padding: pad, ...style };
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={cls} style={s}>
        {children}
      </button>
    );
  }
  return (
    <div className={cls} style={s}>
      {children}
    </div>
  );
}
