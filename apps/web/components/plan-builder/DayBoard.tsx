"use client";

import { Exercise } from "@/lib/api";
import { DayColumn } from "./DayColumn";
import { BuilderDay, BuilderItem } from "./types";
import type { DropTarget } from "./useBuilderDnd";

export function DayBoard({
  days,
  exercises,
  dropTarget,
  selectionDayKey,
  selectedKeys,
  activeItemKey,
  panelId,
  onSelectionChange,
  onSelectItem,
  onOpenDrawer,
  onAddDay,
  onPatchDay,
  onRemoveDay,
  onDuplicateDay,
  weeks,
  onApplyWeekdays,
  onAddItem,
  onRemoveItem,
  onMoveItem,
  onDuplicateItem,
  onToggleWarmup,
  onToggleLink,
  onLinkSelected,
  onUnlinkGroup,
}: {
  days: BuilderDay[];
  exercises: Exercise[];
  dropTarget: DropTarget;
  selectionDayKey: string | null;
  selectedKeys: string[];
  activeItemKey: string | null;
  panelId: string;
  onSelectionChange: (dayKey: string | null, keys: string[]) => void;
  onSelectItem: (dayKey: string, itemKey: string) => void;
  onOpenDrawer: (dayKey: string) => void;
  onAddDay: () => void;
  onPatchDay: (dayKey: string, patch: Partial<BuilderDay>) => void;
  onRemoveDay: (dayKey: string) => void;
  onDuplicateDay: (dayKey: string, targetWeek?: number) => void;
  weeks: number[];
  onApplyWeekdays: (sourceWeek: number) => void;
  onAddItem: (dayKey: string, exerciseId: number, overrides?: Partial<BuilderItem>) => void;
  onRemoveItem: (dayKey: string, itemKey: string) => void;
  onMoveItem: (dayKey: string, itemKey: string, dir: -1 | 1) => void;
  onDuplicateItem: (dayKey: string, itemKey: string) => void;
  onToggleWarmup: (dayKey: string, itemKey: string) => void;
  onToggleLink: (dayKey: string, itemKey: string) => void;
  onLinkSelected: (dayKey: string, itemKeys: string[]) => void;
  onUnlinkGroup: (dayKey: string, itemKey: string) => void;
}) {
  const weekEmpty = days.length > 0 && days.every((d) => d.items.length === 0);

  return (
    // Trello model: board = wysokość viewportu; poziomo kolumny; pionowo wewnątrz dnia.
    <div className="flex h-full min-h-0 w-full flex-col">
      {weekEmpty ? (
        <p className="mb-3 shrink-0 text-sm text-muted">
          Wpisz „przysiad 3x8” w polu pod dniem albo otwórz bibliotekę.
        </p>
      ) : null}
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto overscroll-y-contain md:flex-row md:items-stretch md:gap-3 md:overflow-x-auto md:overflow-y-hidden md:overscroll-x-contain md:snap-x md:snap-mandatory md:pb-1">
        {days.map((day, idx) => (
          <DayColumn
            key={day.key}
            day={day}
            dayIndex={idx + 1}
            exercises={exercises}
            dropTarget={dropTarget}
            selectedKeys={selectionDayKey === day.key ? selectedKeys : []}
            activeItemKey={activeItemKey}
            panelId={panelId}
            onSelectedKeysChange={(keys) => onSelectionChange(keys.length ? day.key : null, keys)}
            onSelectItem={(itemKey) => onSelectItem(day.key, itemKey)}
            onOpenDrawer={() => onOpenDrawer(day.key)}
            onPatchDay={(patch) => onPatchDay(day.key, patch)}
            onRemoveDay={() => onRemoveDay(day.key)}
            onDuplicateDay={(w) => onDuplicateDay(day.key, w)}
            weeks={weeks}
            onApplyWeekdays={() => onApplyWeekdays(day.weekNumber)}
            onAddItem={(exerciseId, overrides) => onAddItem(day.key, exerciseId, overrides)}
            onRemoveItem={(itemKey) => onRemoveItem(day.key, itemKey)}
            onMoveItem={(itemKey, dir) => onMoveItem(day.key, itemKey, dir)}
            onDuplicateItem={(itemKey) => onDuplicateItem(day.key, itemKey)}
            onToggleWarmup={(itemKey) => onToggleWarmup(day.key, itemKey)}
            onToggleLink={(itemKey) => onToggleLink(day.key, itemKey)}
            onLinkSelected={(keys) => onLinkSelected(day.key, keys)}
            onUnlinkGroup={(itemKey) => onUnlinkGroup(day.key, itemKey)}
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
