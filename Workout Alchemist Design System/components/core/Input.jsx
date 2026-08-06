import React from "react";

/** Borderless field on a grey well. `num` for mono, centred, tabular figures. */
export function Input({ value, onChange, placeholder, num, suffix, ariaLabel, inputMode, disabled, className = "" }) {
  const input = (
    <input
      value={value ?? ""}
      onChange={onChange ? (e) => onChange(e.target.value) : undefined}
      placeholder={placeholder}
      aria-label={ariaLabel}
      disabled={disabled}
      inputMode={inputMode ?? (num ? "decimal" : undefined)}
      className={["s-input", num ? "s-input--num" : "", className].filter(Boolean).join(" ")}
    />
  );
  if (!suffix) return input;
  return (
    <span className="s-field__row">
      {input}
      <span className="s-setrow__suffix">{suffix}</span>
    </span>
  );
}
