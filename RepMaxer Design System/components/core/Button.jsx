import React from "react";

/**
 * The only prominent affordance in the system: a white fill on black (inverted
 * in light theme). Outline and plain carry everything else.
 */
export function Button({ children, onClick, variant = "solid", size = "md", caps, full, disabled, type = "button", className = "" }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={[
        "s-btn",
        `s-btn--${variant}`,
        size !== "md" ? `s-btn--${size}` : "",
        caps ? "s-btn--caps" : "",
        full ? "s-btn--full" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </button>
  );
}
