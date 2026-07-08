"use client";

import { inputClass } from "@/components/ui";

export function NumInput({
  value,
  onChange,
  min,
  step,
  placeholder,
  className = "",
  "aria-label": ariaLabel,
  title,
}: {
  value: number | null;
  onChange: (v: number | null) => void;
  min?: number;
  step?: number;
  placeholder?: string;
  className?: string;
  "aria-label"?: string;
  title?: string;
}) {
  return (
    <input
      className={`${inputClass} ${className}`}
      type="number"
      min={min}
      step={step}
      placeholder={placeholder}
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
      aria-label={ariaLabel}
      title={title}
    />
  );
}
