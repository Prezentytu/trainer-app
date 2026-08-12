"use client";

import { ReactNode } from "react";
import { Icon } from "@/components/Icon";
import { IconButton } from "@/components/ui";
import { CopyWeekOpts, CopyWeekPopover } from "./CopyWeekPopover";

export function WeekTabs({
  weeks,
  activeWeek,
  onSelect,
  onAddWeek,
  onCopyWeek,
  metaLabel,
  right,
}: {
  weeks: number[];
  activeWeek: number;
  onSelect: (week: number) => void;
  onAddWeek: () => void;
  onCopyWeek: (week: number, opts?: CopyWeekOpts) => void;
  metaLabel?: string;
  right?: ReactNode;
}) {
  const nextWeek = (weeks.length ? Math.max(...weeks) : 0) + 1;

  return (
    <div className="flex min-h-9 shrink-0 items-center gap-2 border-b border-border py-1.5">
      <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto overscroll-x-contain">
        <div className="flex shrink-0 items-center gap-1">
          {weeks.map((week) => (
            <button
              key={week}
              type="button"
              onClick={() => onSelect(week)}
              aria-label={`Tydzień ${week}`}
              aria-current={week === activeWeek ? "true" : undefined}
              className={`min-w-8 rounded-full px-2.5 py-1.5 font-mono text-sm tabular-nums transition-colors ${
                week === activeWeek
                  ? "border border-border-strong bg-surface-active font-semibold text-foreground"
                  : "border border-border bg-surface text-foreground-secondary hover:border-border-strong"
              }`}
            >
              {week}
            </button>
          ))}
        </div>
        <IconButton title="Dodaj tydzień" size="sm" variant="outline" onClick={onAddWeek}>
          <Icon name="plus" size={16} decorative />
        </IconButton>
        {weeks.length > 0 ? (
          <CopyWeekPopover
            activeWeek={activeWeek}
            nextWeek={nextWeek}
            onCopy={(opts) => onCopyWeek(activeWeek, opts)}
          />
        ) : null}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {right}
        {metaLabel ? (
          <span className="hidden font-mono text-xs tabular-nums text-muted-faint sm:inline">
            {metaLabel}
          </span>
        ) : null}
      </div>
    </div>
  );
}
