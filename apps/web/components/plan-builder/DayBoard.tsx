"use client";

import { Exercise } from "@/lib/api";
import { Button } from "@/components/ui";
import { DayColumn } from "./DayColumn";
import { BuilderDay, BuilderItem, BuilderSet } from "./types";

export function DayBoard({
  days,
  exercises,
  onAddDay,
  onPatchDay,
  onRemoveDay,
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
  onAddItem: (dayKey: string, exerciseId: number) => void;
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
    <div className="flex flex-col gap-4 md:flex-row md:overflow-x-auto md:pb-2">
      {days.map((day) => (
        <DayColumn
          key={day.key}
          day={day}
          exercises={exercises}
          onPatchDay={(patch) => onPatchDay(day.key, patch)}
          onRemoveDay={() => onRemoveDay(day.key)}
          onAddItem={(exerciseId) => onAddItem(day.key, exerciseId)}
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
      <div className="flex w-full items-center justify-center md:w-56 md:shrink-0">
        <Button variant="ghost" onClick={onAddDay}>
          + Dzień
        </Button>
      </div>
    </div>
  );
}
