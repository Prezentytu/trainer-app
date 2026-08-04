"use client";

import { memo, useEffect, useRef, useState } from "react";

type Kind = "weight" | "reps";

type Props = {
  kind: Kind;
  value: number | null;
  placeholder?: string;
  ariaLabel: string;
  onCommit: (value: number | null) => void;
  onFocusField?: () => void;
  className?: string;
  /** Następna seria — placeholder w accent (jak Gravitus „lb × reps”). */
  emphasizeEmpty?: boolean;
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

/**
 * Płaskie pole jak arkusz — bez tła/ramki.
 * Hierarchia z typografii; fokus = subtelne podkreślenie accent.
 */
export const SetValueInput = memo(function SetValueInput({
  kind,
  value,
  placeholder,
  ariaLabel,
  onCommit,
  onFocusField,
  className = "",
  emphasizeEmpty = false,
}: Props) {
  const [raw, setRaw] = useState(() => formatDisplay(value));
  const focused = useRef(false);

  useEffect(() => {
    if (!focused.current) setRaw(formatDisplay(value));
  }, [value]);

  const empty = raw === "";

  return (
    <input
      className={[
        "min-h-11 min-w-0 border-0 border-b border-transparent bg-transparent",
        "px-0.5 py-2 text-center font-mono text-base tabular-nums outline-none sm:text-sm",
        "transition-[border-color,color] duration-[var(--dur-fast)]",
        "placeholder:font-normal",
        emphasizeEmpty && empty
          ? "placeholder:text-accent-text"
          : "placeholder:text-muted-faint",
        "focus:border-accent-strong",
        className,
      ].join(" ")}
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
