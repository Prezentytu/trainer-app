import React from "react";

/**
 * The brand is type only: the product name in Jost 500, uppercase, 0.24em
 * tracked. No mark exists — never draw one.
 */
export function Wordmark({ children = "RepMaxer", size = 13, className = "" }) {
  return (
    <span className={["s-wordmark", className].filter(Boolean).join(" ")} style={{ fontSize: size }}>
      {children}
    </span>
  );
}
