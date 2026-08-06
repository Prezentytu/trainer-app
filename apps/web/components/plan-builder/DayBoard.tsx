"use client";

import { Exercise } from "@/lib/api";
import { DayColumn } from "./DayColumn";
import { BuilderDay, BuilderItem, BuilderSet } from "./types";
import type { DropTarget } from "./useBuilderDnd";

export function DayBoard({
  days,
  exercises,
  dropTarget,
  selectionDayKey,
  selectedKeys,
  onSelectionChange,
  onOpenDrawer,
  onAddDay,
  onPatchDay,
  onRemoveDay,
  onDuplicateDay,
  onAddItem,
  onPatchItem,
  onRemoveItem,
  onMoveItem,
  onToggleLink,
  onLinkSelected,
  onUnlinkGroup,
  onAddSet,
  onPatchSet,
  onRemoveSet,
  onApplyPreset,
  onClearSets,
}: {
  days: BuilderDay[];
  exercises: Exercise[];
  dropTarget: DropTarget;
  selectionDayKey: string | null;
  selectedKeys: string[];
  onSelectionChange: (dayKey: string | null, keys: string[]) => void;
  onOpenDrawer: (dayKey: string) => void;
  onAddDay: () => void;
  onPatchDay: (dayKey: string, patch: Partial<BuilderDay>) => void;
  onRemoveDay: (dayKey: string) => void;
  onDuplicateDay: (dayKey: string) => void;
  onAddItem: (dayKey: string, exerciseId: number, overrides?: Partial<BuilderItem>) => void;
  onPatchItem: (dayKey: string, itemKey: string, patch: Partial<BuilderItem>) => void;
  onRemoveItem: (dayKey: string, itemKey: string) => void;
  onMoveItem: (dayKey: string, itemKey: string, dir: -1 | 1) => void;
  onToggleLink: (dayKey: string, itemKey: string) => void;
  onLinkSelected: (dayKey: string, itemKeys: string[]) => void;
  onUnlinkGroup: (dayKey: string, itemKey: string) => void;
  onAddSet: (dayKey: string, itemKey: string) => void;
  onPatchSet: (dayKey: string, itemKey: string, setKey: string, patch: Partial<BuilderSet>) => void;
  onRemoveSet: (dayKey: string, itemKey: string, setKey: string) => void;
  onApplyPreset: (dayKey: string, itemKey: string, presetId: string) => void;
  onClearSets: (dayKey: string, itemKey: string) => void;
}) {
  return (
    // Trello model: board = wysokość viewportu; poziomo kolumny; pionowo wewnątrz dnia.
    <div className="flex h-full min-h-0 w-full flex-col">
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto overscroll-y-contain md:flex-row md:items-stretch md:gap-3 md:overflow-x-auto md:overflow-y-hidden md:overscroll-x-contain md:snap-x md:snap-mandatory md:pb-1">
        {days.map((day, idx) => (
          <DayColumn
            key={day.key}
            day={day}
            dayIndex={idx + 1}
            exercises={exercises}
            dropTarget={dropTarget}
            selectedKeys={selectionDayKey === day.key ? selectedKeys : []}
            onSelectedKeysChange={(keys) => onSelectionChange(keys.length ? day.key : null, keys)}
            onOpenDrawer={() => onOpenDrawer(day.key)}
            onPatchDay={(patch) => onPatchDay(day.key, patch)}
            onRemoveDay={() => onRemoveDay(day.key)}
            onDuplicateDay={() => onDuplicateDay(day.key)}
            onAddItem={(exerciseId, overrides) => onAddItem(day.key, exerciseId, overrides)}
            onPatchItem={(itemKey, patch) => onPatchItem(day.key, itemKey, patch)}
            onRemoveItem={(itemKey) => onRemoveItem(day.key, itemKey)}
            onMoveItem={(itemKey, dir) => onMoveItem(day.key, itemKey, dir)}
            onToggleLink={(itemKey) => onToggleLink(day.key, itemKey)}
            onLinkSelected={(keys) => onLinkSelected(day.key, keys)}
            onUnlinkGroup={(itemKey) => onUnlinkGroup(day.key, itemKey)}
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
          className="flex min-h-28 w-full shrink-0 items-center justify-center rounded-[var(--r-card)] border border-dashed border-border-strong text-sm font-medium text-muted-faint transition-colors hover:border-border hover:bg-surface-hover hover:text-foreground-secondary md:min-h-0 md:w-[120px] md:snap-start"
        >
          + Dzień
        </button>
      </div>
    </div>
  );
}
