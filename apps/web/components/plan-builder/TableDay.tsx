"use client";

import { useState } from "react";
import { Exercise } from "@/lib/api";
import { buildGroupLabels, computeGroupsFromLinks } from "@/lib/supersets";
import { DayHeader } from "./DayHeader";
import { QuickComposer } from "./QuickComposer";
import { TABLE_ROW_GRID_COLS, TableExerciseRow } from "./TableExerciseRow";
import { BuilderDay, BuilderItem, BuilderSet } from "./types";

export function TableDay({
  day,
  dayIndex,
  exercises,
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
  day: BuilderDay;
  dayIndex: number;
  exercises: Exercise[];
  onPatchDay: (patch: Partial<BuilderDay>) => void;
  onRemoveDay: () => void;
  onDuplicateDay: (targetWeek?: number) => void;
  weeks: number[];
  onApplyWeekdays: () => void;
  onAddItem: (exerciseId: number, overrides?: Partial<BuilderItem>) => void;
  onPatchItem: (itemKey: string, patch: Partial<BuilderItem>) => void;
  onRemoveItem: (itemKey: string) => void;
  onMoveItem: (itemKey: string, dir: -1 | 1) => void;
  onToggleLink: (itemKey: string) => void;
  onAddSet: (itemKey: string) => void;
  onPatchSet: (itemKey: string, setKey: string, patch: Partial<BuilderSet>) => void;
  onRemoveSet: (itemKey: string, setKey: string) => void;
  onApplyPreset: (itemKey: string, presetId: string) => void;
  onClearSets: (itemKey: string) => void;
}) {
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());

  const toggleExpand = (key: string) =>
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const groups = computeGroupsFromLinks(day.items.map((i) => i.linkedToNext));
  const labels = buildGroupLabels(groups);

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="mb-3">
        <DayHeader
          day={day}
          dayIndex={dayIndex}
          exercises={exercises}
          density="row"
          weeks={weeks}
          onPatchDay={onPatchDay}
          onRemoveDay={onRemoveDay}
          onDuplicateDay={onDuplicateDay}
          onApplyWeekdays={onApplyWeekdays}
        />
      </div>

      {day.items.length > 0 ? (
        <div className="overflow-x-auto">
          <div className="min-w-[1040px]">
            <div
              className={`grid ${TABLE_ROW_GRID_COLS} gap-2 px-2 pb-2 text-xs font-medium uppercase tracking-wide text-muted`}
            >
              <span />
              <span>#</span>
              <span>Ćwiczenie</span>
              <span>Serie × Powt.</span>
              <span>Tempo</span>
              <span>Przerwa</span>
              <span title="RIR celu — powtórzenia w zapasie do upadku">RIR celu</span>
              <span>Ciężar</span>
              <span>Notatki</span>
              <span />
            </div>
            <div className="space-y-1">
              {day.items.map((item, idx) => (
                <TableExerciseRow
                  key={item.key}
                  item={item}
                  index={idx}
                  weekNumber={day.weekNumber}
                  exercise={exercises.find((e) => e.id === item.exerciseId)}
                  supersetLabel={labels[idx]}
                  isInSuperset={groups[idx] != null}
                  isLastInDay={idx === day.items.length - 1}
                  expanded={expandedKeys.has(item.key)}
                  onToggleExpand={() => toggleExpand(item.key)}
                  onMove={(dir) => onMoveItem(item.key, dir)}
                  onRemove={() => onRemoveItem(item.key)}
                  onToggleLink={() => onToggleLink(item.key)}
                  onPatch={(patch) => onPatchItem(item.key, patch)}
                  onAddSet={() => onAddSet(item.key)}
                  onPatchSet={(setKey, patch) => onPatchSet(item.key, setKey, patch)}
                  onRemoveSet={(setKey) => onRemoveSet(item.key, setKey)}
                  onApplyPreset={(presetId) => onApplyPreset(item.key, presetId)}
                  onClearSets={() => onClearSets(item.key)}
                />
              ))}
            </div>
          </div>
        </div>
      ) : null}

      <div className={day.items.length > 0 ? "mt-3" : undefined}>
        <QuickComposer exercises={exercises} day={day} onAdd={onAddItem} onToggleLink={onToggleLink} />
      </div>
    </div>
  );
}
