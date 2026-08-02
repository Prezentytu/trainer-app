"use client";

import { inputNumericClass } from "@/components/ui";

export function NumInput({
  value,
  onChange,
  min,
  max,
  step,
  placeholder,
  className = "",
  "aria-label": ariaLabel,
  title,
}: {
  value: number | null;
  onChange: (v: number | null) => void;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  className?: string;
  "aria-label"?: string;
  title?: string;
}) {
  return (
    <input
      className={`${inputNumericClass} ${className}`}
      type="number"
      inputMode="decimal"
      min={min}
      max={max}
      step={step}
      placeholder={placeholder}
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
      aria-label={ariaLabel}
      title={title}
    />
  );
}
