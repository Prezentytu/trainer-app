"use client";

import { isDefaultDayLabel, WEEKDAY_CHIPS, WEEKDAY_NAMES } from "@/lib/schedule";
import { editorChipOff, editorChipOn } from "./editorChips";
import { BuilderDay } from "./types";

export function DayScheduleChips({
  day,
  onPatch,
  onApplyToOtherWeeks,
  showApply,
}: {
  day: BuilderDay;
  onPatch: (patch: Partial<BuilderDay>) => void;
  onApplyToOtherWeeks?: () => void;
  showApply?: boolean;
}) {
  const pick = (iso: number) => {
    if (day.dayOfWeek === iso) {
      onPatch({ dayOfWeek: null });
      return;
    }
    const patch: Partial<BuilderDay> = { dayOfWeek: iso };
    if (isDefaultDayLabel(day.label, day.order)) {
      patch.label = WEEKDAY_NAMES[iso];
    }
    onPatch(patch);
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="t-label mr-0.5 text-muted">Dzień tygodnia</span>
      {WEEKDAY_CHIPS.map((c) => (
        <button
          key={c.iso}
          type="button"
          className={day.dayOfWeek === c.iso ? editorChipOn : editorChipOff}
          onClick={() => pick(c.iso)}
        >
          {c.label}
        </button>
      ))}
      {showApply && onApplyToOtherWeeks ? (
        <button
          type="button"
          className={`${editorChipOff} ml-1`}
          onClick={onApplyToOtherWeeks}
        >
          Zastosuj te dni do pozostałych tygodni
        </button>
      ) : null}
    </div>
  );
}