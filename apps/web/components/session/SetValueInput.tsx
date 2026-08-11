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
  /** Następna seria — placeholder nieco jaśniejszy. */
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
 * Pole wartości w stylu Styrka: pigułka surface-active, duża mono typografia.
 * Hierarchia z kontrastu i rozmiaru — nie z ramek/glowów.
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
  /** Ostatnia wartość wypchnięta z tego inputu — odróżnia wpisywanie od +2,5 z doku. */
  const lastCommitted = useRef<number | null>(value);

  useEffect(() => {
    if (!focused.current) {
      setRaw(formatDisplay(value));
      lastCommitted.current = value;
      return;
    }
    // Dock / Talerze zmieniły props, a my jeszcze trzymamy stary draft w `raw`
    if (value !== lastCommitted.current) {
      setRaw(formatDisplay(value));
      lastCommitted.current = value;
    }
  }, [value]);

  const empty = raw === "";

  return (
    <input
      className={[
        "min-h-11 min-w-0 w-full rounded-lg border border-transparent bg-surface-active",
        // 16px = próg, poniżej którego iOS zoomuje pole przy focusie
        "px-1.5 py-2 text-center font-mono text-base font-semibold tabular-nums outline-none",
        "transition-[background-color,border-color,color] duration-[var(--dur-fast)]",
        "placeholder:font-medium",
        emphasizeEmpty && empty
          ? "placeholder:text-foreground-secondary"
          : "placeholder:text-muted-faint",
        "focus:border-border-strong focus:bg-surface-hover",
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
          const parsed = parseNum(next);
          lastCommitted.current = parsed;
          onCommit(parsed);
        }
      }}
      onBlur={() => {
        focused.current = false;
        const parsed = parseNum(raw);
        lastCommitted.current = parsed;
        setRaw(formatDisplay(parsed));
        onCommit(parsed);
      }}
    />
  );
});
