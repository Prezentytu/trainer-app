"use client";

import { useEffect, useRef, useState } from "react";
import { inputNumericClass } from "@/components/ui";

function formatDisplay(n: number | null): string {
  if (n == null) return "";
  return String(n).replace(".", ",");
}

function parseNum(v: string): number | null {
  if (v.trim() === "") return null;
  const n = Number(v.replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

export function NumInput({
  value,
  onChange,
  min,
  max,
  step,
  placeholder,
  className = "",
  inputRef,
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
  inputRef?: React.Ref<HTMLInputElement>;
  "aria-label"?: string;
  title?: string;
}) {
  const [raw, setRaw] = useState(() => formatDisplay(value));
  const focused = useRef(false);

  useEffect(() => {
    if (!focused.current) setRaw(formatDisplay(value));
  }, [value]);

  const commit = (parsed: number | null) => {
    if (parsed == null) {
      onChange(null);
      return;
    }
    let next = parsed;
    if (min != null && next < min) next = min;
    if (max != null && next > max) next = max;
    onChange(next);
  };

  return (
    <input
      ref={inputRef}
      className={`${inputNumericClass} ${className}`}
      type="text"
      inputMode="decimal"
      placeholder={placeholder}
      value={raw}
      onFocus={() => {
        focused.current = true;
      }}
      onChange={(e) => {
        const next = e.target.value;
        if (next !== "" && !/^\d*([.,]\d*)?$/.test(next)) return;
        setRaw(next);
        if (next === "" || !/[.,]$/.test(next)) {
          commit(parseNum(next));
        }
      }}
      onBlur={() => {
        focused.current = false;
        const parsed = parseNum(raw);
        setRaw(formatDisplay(parsed));
        commit(parsed);
      }}
      aria-label={ariaLabel}
      title={title}
      data-step={step}
    />
  );
}
