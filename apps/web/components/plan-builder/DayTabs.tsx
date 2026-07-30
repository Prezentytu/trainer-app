"use client";

import { BuilderDay } from "./types";

export function DayTabs({
  days,
  activeDayKey,
  onSelect,
  onAddDay,
  metaLabel,
}: {
  days: BuilderDay[];
  activeDayKey: string | null;
  onSelect: (dayKey: string) => void;
  onAddDay: () => void;
  metaLabel?: string;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2 border-b border-border pb-3">
      <span className="mr-1 text-xs font-semibold uppercase tracking-[0.08em] text-muted-faint">Dzień</span>
      {days.map((day, idx) => {
        const active = day.key === activeDayKey;
        return (
          <button
            key={day.key}
            type="button"
            onClick={() => onSelect(day.key)}
            className={`min-w-9 rounded-full px-3 py-2 font-mono text-sm tabular-nums transition-colors ${
              active
                ? "bg-accent font-semibold text-accent-foreground"
                : "border border-border bg-surface text-muted hover:bg-surface-hover hover:text-foreground-secondary"
            }`}
          >
            D{idx + 1}
          </button>
        );
      })}
      <button
        type="button"
        onClick={onAddDay}
        className="rounded-full border border-dashed border-border-strong px-3.5 py-2 text-sm font-medium text-muted-faint transition-colors hover:text-foreground-secondary"
      >
        + Dzień
      </button>
      {metaLabel ? (
        <span className="ml-auto font-mono text-xs tabular-nums text-muted whitespace-nowrap">{metaLabel}</span>
      ) : null}
    </div>
  );
}
