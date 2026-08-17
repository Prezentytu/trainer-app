"use client";

import { Exercise } from "@/lib/api";
import { WEEKDAY_CHIPS } from "@/lib/schedule";
import { DayMenu } from "./DayMenu";
import { dayStatsLine } from "./summaryText";
import { BuilderDay } from "./types";

const NAME_CLASS: Record<"column" | "page" | "row", string> = {
  column:
    "min-w-0 break-words text-left text-sm font-semibold text-foreground hover:text-foreground-secondary",
  page: "min-w-0 break-words text-left font-display text-2xl font-bold tracking-tight text-foreground hover:text-foreground-secondary",
  row: "min-w-0 break-words text-left text-sm font-semibold text-foreground hover:text-foreground-secondary",
};

export function DayHeader({
  day,
  dayIndex,
  exercises,
  density,
  weeks,
  onPatchDay,
  onRemoveDay,
  onDuplicateDay,
  onApplyWeekdays,
}: {
  day: BuilderDay;
  dayIndex: number;
  exercises: Exercise[];
  density: "column" | "page" | "row";
  weeks: number[];
  onPatchDay: (patch: Partial<BuilderDay>) => void;
  onRemoveDay: () => void;
  onDuplicateDay: (targetWeek?: number) => void;
  onApplyWeekdays: () => void;
}) {
  const weekday = WEEKDAY_CHIPS.find((c) => c.iso === day.dayOfWeek);
  const stats = day.items.length > 0 ? dayStatsLine(day, exercises) : null;
  const notes = day.notes?.trim() || null;
  const name = (
    <DayMenu
      day={day}
      weeks={weeks}
      onPatch={onPatchDay}
      onApplyToOtherWeeks={weeks.length > 1 ? onApplyWeekdays : undefined}
      onDuplicate={onDuplicateDay}
      onRemove={onRemoveDay}
      nameClassName={NAME_CLASS[density]}
    />
  );
  const chip = weekday ? (
    <span className="inline-flex h-6 shrink-0 items-center rounded-md border border-border px-1.5 font-mono text-[12px] font-medium text-muted">
      {weekday.label}
    </span>
  ) : null;

  if (density === "page") {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-baseline gap-2.5">
          <span className="font-mono text-sm font-medium tabular-nums text-muted-faint">
            D{dayIndex}
          </span>
          {name}
          {chip}
        </div>
        {stats ? (
          <p className="font-mono text-xs tabular-nums text-muted">{stats}</p>
        ) : null}
        {notes ? <p className="text-xs text-muted">{notes}</p> : null}
      </div>
    );
  }

  return (
    <div className="min-w-0">
      <div className="flex min-w-0 items-baseline gap-2">
        <span className="shrink-0 font-mono text-xs font-semibold tabular-nums tracking-wide text-muted">
          D{dayIndex}
        </span>
        {name}
        {chip}
      </div>
      {stats ? (
        <p className="mt-1 font-mono text-xs tabular-nums text-muted">{stats}</p>
      ) : null}
      {notes ? (
        <p className="mt-1 break-words text-xs text-muted">{notes}</p>
      ) : null}
    </div>
  );
}
