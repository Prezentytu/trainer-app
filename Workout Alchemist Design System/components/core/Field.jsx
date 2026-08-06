import React from "react";

/** Mono caps label above a control. The only label treatment in the system. */
export function Field({ label, children }) {
  return (
    <label className="s-field">
      {label ? <span className="t-label">{label}</span> : null}
      {children}
    </label>
  );
}
