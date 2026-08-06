import React from "react";

/** Filter chip. Active = solid inverted fill. Mono caps by default. */
export function Pill({ children, active, onClick, text }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active ?? false}
      className={["s-pill", text ? "s-pill--text" : "", active ? "is-active" : ""].filter(Boolean).join(" ")}
    >
      {children}
    </button>
  );
}

/** Horizontal scroller for a run of Pills. */
export function PillRow({ children }) {
  return <div className="s-pillrow">{children}</div>;
}
