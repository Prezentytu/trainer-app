"use client";

import { PALETTES, usePalette } from "@/lib/theme";

const FOCUS = "focus-visible:outline-none focus-visible:shadow-[var(--focus-ring)]";
const PRESS = "active:scale-[0.97]";

export function PalettePicker({ labelledBy }: { labelledBy?: string }) {
  const { palette, setPalette } = usePalette();

  return (
    <div
      className="grid grid-cols-5 gap-1"
      role="radiogroup"
      aria-labelledby={labelledBy}
      aria-label={labelledBy ? undefined : "Kolorystyka"}
    >
      {PALETTES.map((p) => {
        const selected = palette === p.id;
        return (
          <button
            key={p.id}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={p.label}
            onClick={() => setPalette(p.id)}
            className={`flex min-h-11 min-w-0 flex-col items-center gap-1.5 rounded-lg px-0.5 py-1 text-center transition-[transform,color] duration-[var(--dur-fast)] ease-[var(--ease-out)] ${FOCUS} ${PRESS}`}
          >
            <span
              className={
                selected
                  ? "palette-swatch ring-2 ring-invert-bg ring-offset-2 ring-offset-background"
                  : "palette-swatch"
              }
              data-swatch={p.id}
              aria-hidden
            />
            <span
              className={`break-words text-[13px] leading-tight ${
                selected ? "font-medium text-foreground" : "text-muted"
              }`}
            >
              {p.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
