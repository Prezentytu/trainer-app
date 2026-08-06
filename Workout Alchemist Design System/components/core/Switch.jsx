import React from "react";

/** Binary setting. Track inverts when on. */
export function Switch({ label, checked, onChange }) {
  return (
    <label className="s-switch">
      <button
        type="button"
        role="switch"
        aria-checked={!!checked}
        aria-label={label}
        onClick={() => onChange && onChange(!checked)}
        className={["s-switch__track", checked ? "is-on" : ""].filter(Boolean).join(" ")}
      >
        <span className="s-switch__knob" />
      </button>
      {label ? <span className="t-body">{label}</span> : null}
    </label>
  );
}
