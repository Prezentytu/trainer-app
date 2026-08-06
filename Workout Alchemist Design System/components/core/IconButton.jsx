import React from "react";

/** Circular tap target for a single glyph. Ghost by default. */
export function IconButton({ children, onClick, title, filled, size = "md", className = "" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      className={["s-iconbtn", filled ? "s-iconbtn--filled" : "", size === "sm" ? "s-iconbtn--sm" : "", className]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </button>
  );
}
