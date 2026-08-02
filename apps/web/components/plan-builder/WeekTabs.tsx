"use client";

import { CopyWeekOpts, CopyWeekPopover } from "./CopyWeekPopover";

export function WeekTabs({
  weeks,
  activeWeek,
  onSelect,
  onAddWeek,
  onCopyWeek,
  metaLabel,
}: {
  weeks: number[];
  activeWeek: number;
  onSelect: (week: number) => void;
  onAddWeek: () => void;
  onCopyWeek: (week: number, opts?: CopyWeekOpts) => void;
  metaLabel?: string;
}) {
  const nextWeek = (weeks.length ? Math.max(...weeks) : 0) + 1;

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2 border-b border-border pb-3">
      <span className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-faint">Tydzień</span>
      <div className="flex flex-wrap items-center gap-1.5">
        {weeks.map((week) => (
          <button
            key={week}
            type="button"
            onClick={() => onSelect(week)}
            className={`min-w-9 rounded-full px-3 py-2 font-mono text-sm tabular-nums transition-colors ${
              week === activeWeek
                ? "bg-accent font-semibold text-accent-foreground"
                : "border border-border bg-surface text-foreground-secondary hover:border-border-strong"
            }`}
          >
            {week}
          </button>
        ))}
      </div>
      <span className="mx-1 hidden h-5 w-px bg-border sm:block" />
      <button
        type="button"
        onClick={onAddWeek}
        className="rounded-full border border-border-strong px-3.5 py-1.5 text-sm font-medium text-foreground-secondary transition-colors hover:bg-surface-hover"
      >
        + Tydzień
      </button>
      {weeks.length > 0 && (
        <CopyWeekPopover
          activeWeek={activeWeek}
          nextWeek={nextWeek}
          onCopy={(opts) => onCopyWeek(activeWeek, opts)}
        />
      )}
      {metaLabel ? (
        <span className="ml-auto font-mono text-xs tabular-nums text-muted-faint">{metaLabel}</span>
      ) : null}
    </div>
  );
}
