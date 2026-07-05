"use client";

import { inputClass } from "@/components/ui";

export function NumInput({
  value,
  onChange,
  min,
  step,
  placeholder,
}: {
  value: number | null;
  onChange: (v: number | null) => void;
  min?: number;
  step?: number;
  placeholder?: string;
}) {
  return (
    <input
      className={inputClass}
      type="number"
      min={min}
      step={step}
      placeholder={placeholder}
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
    />
  );
}
