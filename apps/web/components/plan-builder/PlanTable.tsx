"use client";

import { Exercise } from "@/lib/api";
import { TableDay } from "./TableDay";
import { BuilderDay, BuilderItem, BuilderSet } from "./types";

// W przeciwieństwie do DayBoard (kanban obok siebie) dni w Arkuszu są ułożone pionowo, jeden pod
// drugim, pełnej szerokości — tak trenerzy układają plany w arkuszach kalkulacyjnych (Dzień A1,
// Dzień B1, Dzień C1... jedna kolumna, kolejne sekcje w dół), a każda tabela dnia i tak potrzebuje
// pełnej szerokości na kolumny parametrów.
export function PlanTable({
  days,
  exercises,
  onAddDay,
  onPatchDay,
  onRemoveDay,
  onDuplicateDay,
  weeks,
  onApplyWeekdays,
  onAddItem,
  onPatchItem,
  onRemoveItem,
  onMoveItem,
  onToggleLink,
  onAddSet,
  onPatchSet,
  onRemoveSet,
  onApplyPreset,
  onClearSets,
}: {
  days: BuilderDay[];
  exercises: Exercise[];
  onAddDay: () => void;
  onPatchDay: (dayKey: string, patch: Partial<BuilderDay>) => void;
  onRemoveDay: (dayKey: string) => void;
  onDuplicateDay: (dayKey: string, targetWeek?: number) => void;
  weeks: number[];
  onApplyWeekdays: (sourceWeek: number) => void;
  onAddItem: (dayKey: string, exerciseId: number, overrides?: Partial<BuilderItem>) => void;
  onPatchItem: (dayKey: string, itemKey: string, patch: Partial<BuilderItem>) => void;
  onRemoveItem: (dayKey: string, itemKey: string) => void;
  onMoveItem: (dayKey: string, itemKey: string, dir: -1 | 1) => void;
  onToggleLink: (dayKey: string, itemKey: string) => void;
  onAddSet: (dayKey: string, itemKey: string) => void;
  onPatchSet: (dayKey: string, itemKey: string, setKey: string, patch: Partial<BuilderSet>) => void;
  onRemoveSet: (dayKey: string, itemKey: string, setKey: string) => void;
  onApplyPreset: (dayKey: string, itemKey: string, presetId: string) => void;
  onClearSets: (dayKey: string, itemKey: string) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      {days.map((day) => (
        <TableDay
          key={day.key}
          day={day}
          exercises={exercises}
          onPatchDay={(patch) => onPatchDay(day.key, patch)}
          onRemoveDay={() => onRemoveDay(day.key)}
          onDuplicateDay={(w) => onDuplicateDay(day.key, w)}
          weeks={weeks}
          onApplyWeekdays={() => onApplyWeekdays(day.weekNumber)}
          onAddItem={(exerciseId, overrides) => onAddItem(day.key, exerciseId, overrides)}
          onPatchItem={(itemKey, patch) => onPatchItem(day.key, itemKey, patch)}
          onRemoveItem={(itemKey) => onRemoveItem(day.key, itemKey)}
          onMoveItem={(itemKey, dir) => onMoveItem(day.key, itemKey, dir)}
          onToggleLink={(itemKey) => onToggleLink(day.key, itemKey)}
          onAddSet={(itemKey) => onAddSet(day.key, itemKey)}
          onPatchSet={(itemKey, setKey, patch) => onPatchSet(day.key, itemKey, setKey, patch)}
          onRemoveSet={(itemKey, setKey) => onRemoveSet(day.key, itemKey, setKey)}
          onApplyPreset={(itemKey, presetId) => onApplyPreset(day.key, itemKey, presetId)}
          onClearSets={(itemKey) => onClearSets(day.key, itemKey)}
        />
      ))}
      <button
        type="button"
        onClick={onAddDay}
        className="flex min-h-16 w-full items-center justify-center rounded-xl border border-dashed border-border-strong text-sm font-medium text-muted-strong transition-colors hover:border-accent-border hover:bg-surface-hover hover:text-foreground-secondary"
      >
        + Dzień
      </button>
    </div>
  );
}
