"use client";

import { useEffect, useRef, useState } from "react";
import { inputNumericClass } from "@/components/ui";
import { formatRepRange, parseRepRange } from "@/lib/measure";

/**
 * Jedno pole na zakres powtórzeń — `8` albo `8-12`. Zamiast pary „od/do”, którą trener
 * musiał wypełniać dwoma tabami. Commit dopiero na blur, żeby wpisywanie `8-12`
 * nie normalizowało się po każdym znaku.
 */
export function RangeInput({
  reps,
  repsMax,
  onChange,
  placeholder = "8",
  className = "",
  inputRef,
  "aria-label": ariaLabel = "Powtórzenia lub zakres",
  title,
}: {
  reps: number | null;
  repsMax: number | null;
  onChange: (next: { reps: number | null; repsMax: number | null }) => void;
  placeholder?: string;
  className?: string;
  inputRef?: React.Ref<HTMLInputElement>;
  "aria-label"?: string;
  title?: string;
}) {
  const [raw, setRaw] = useState(() => formatRepRange(reps, repsMax));
  const focused = useRef(false);

  useEffect(() => {
    if (!focused.current) setRaw(formatRepRange(reps, repsMax));
  }, [reps, repsMax]);

  const commit = (text: string) => {
    const parsed = parseRepRange(text);
    setRaw(formatRepRange(parsed.reps, parsed.repsMax));
    if (parsed.reps !== reps || parsed.repsMax !== repsMax) onChange(parsed);
  };

  return (
    <input
      ref={inputRef}
      className={`${inputNumericClass} ${className}`}
      type="text"
      inputMode="numeric"
      placeholder={placeholder}
      value={raw}
      onFocus={() => {
        focused.current = true;
      }}
      onChange={(e) => {
        const next = e.target.value;
        if (next !== "" && !/^\d{0,3}(\s*[-–]\s*\d{0,3})?$/.test(next)) return;
        setRaw(next);
      }}
      onBlur={() => {
        focused.current = false;
        commit(raw);
      }}
      onKeyDown={(e) => {
        if (e.key !== "Enter") return;
        commit(raw);
      }}
      aria-label={ariaLabel}
      title={title}
    />
  );
}
