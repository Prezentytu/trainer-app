"use client";

import { memo, useEffect, useRef, useState } from "react";
import { inputNumericClass } from "@/components/ui";

type Kind = "weight" | "reps";

type Props = {
  kind: Kind;
  value: number | null;
  placeholder?: string;
  ariaLabel: string;
  onCommit: (value: number | null) => void;
  onFocusField?: () => void;
  className?: string;
};

function formatDisplay(n: number | null): string {
  if (n == null) return "";
  return String(n).replace(".", ",");
}

function parseNum(v: string): number | null {
  if (v.trim() === "") return null;
  const n = Number(v.replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

function isValidDraft(kind: Kind, raw: string): boolean {
  if (raw === "") return true;
  if (kind === "weight") return /^\d*([.,]\d{0,2})?$/.test(raw);
  return /^\d{0,3}$/.test(raw);
}

export const SetValueInput = memo(function SetValueInput({
  kind,
  value,
  placeholder,
  ariaLabel,
  onCommit,
  onFocusField,
  className = "",
}: Props) {
  const [raw, setRaw] = useState(() => formatDisplay(value));
  const focused = useRef(false);

  useEffect(() => {
    if (!focused.current) setRaw(formatDisplay(value));
  }, [value]);

  return (
    <input
      className={`${inputNumericClass} h-11 min-w-0 flex-1 px-1.5 text-center ${className}`}
      value={raw}
      inputMode={kind === "weight" ? "decimal" : "numeric"}
      aria-label={ariaLabel}
      placeholder={placeholder}
      onFocus={() => {
        focused.current = true;
        onFocusField?.();
      }}
      onChange={(e) => {
        const next = e.target.value;
        if (!isValidDraft(kind, next)) return;
        setRaw(next);
        // Nie commituj niepełnych draftów typu "10," / "10." — dopiero blur / gotowe.
        if (next === "" || !/[.,]$/.test(next)) {
          onCommit(parseNum(next));
        }
      }}
      onBlur={() => {
        focused.current = false;
        const parsed = parseNum(raw);
        setRaw(formatDisplay(parsed));
        onCommit(parsed);
      }}
    />
  );
});
