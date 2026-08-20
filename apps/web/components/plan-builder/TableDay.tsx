"use client";

import { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Exercise } from "@/lib/api";
import { buildGroupLabels, computeGroupsFromLinks } from "@/lib/supersets";
import { dayContainerId } from "./dnd";
import { DayHeader } from "./DayHeader";
import { QuickComposer } from "./QuickComposer";
import { listEntrySummary } from "./listGroups";
import { TABLE_ROW_GRID_COLS, TableExerciseRow } from "./TableExerciseRow";
import { BuilderDay, BuilderItem, BuilderSet } from "./types";

export function TableDay({
  day,
  dayIndex,
  exercises,
  onPatchDay,
  onRemoveDay,
  onDuplicateDay,
  onMoveDayToWeek,
  weeks,
  onApplyWeekdays,
  onAddItem,
  onPatchItem,
  onRemoveItem,
  onMoveItem,
  onToggleLink,
  onAddSet,
  onInsertSet,
  onPatchSet,
  onRemoveSet,
  onApplyPreset,
  onApplyRestToAll,
  onClearSets,
}: {
  day: BuilderDay;
  dayIndex: number;
  exercises: Exercise[];
  onPatchDay: (patch: Partial<BuilderDay>) => void;
  onRemoveDay: () => void;
  onDuplicateDay: (targetWeek?: number) => void;
  onMoveDayToWeek?: (targetWeek: number) => void;
  weeks: number[];
  onApplyWeekdays: () => void;
  onAddItem: (exerciseId: number, overrides?: Partial<BuilderItem>) => void;
  onPatchItem: (itemKey: string, patch: Partial<BuilderItem>) => void;
  onRemoveItem: (itemKey: string) => void;
  onMoveItem: (itemKey: string, dir: -1 | 1) => void;
  onToggleLink: (itemKey: string) => void;
  onAddSet: (itemKey: string) => void;
  onInsertSet?: (itemKey: string, index: number, side: "before" | "after") => string | void;
  onPatchSet: (itemKey: string, setKey: string, patch: Partial<BuilderSet>) => void;
  onRemoveSet: (itemKey: string, setKey: string) => void;
  onApplyPreset: (itemKey: string, presetId: string) => void;
  onApplyRestToAll?: (itemKey: string, seconds: number | null) => void;
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
  // Cały dzień jest strefą upuszczenia — ćwiczenie można przeciągnąć do pustego dnia niżej.
  const { setNodeRef, isOver } = useDroppable({ id: dayContainerId(day.key) });

  return (
    <div
      ref={setNodeRef}
      className={`rounded-xl border bg-surface p-4 ${isOver ? "border-border-strong" : "border-border"}`}
    >
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
          onMoveDayToWeek={onMoveDayToWeek}
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
            <SortableContext
              items={day.items.map((i) => i.key)}
              strategy={verticalListSortingStrategy}
            >
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
                  isFirstInSuperset={
                    groups[idx] != null && (idx === 0 || groups[idx - 1] !== groups[idx])
                  }
                  partners={
                    groups[idx] == null
                      ? []
                      : day.items
                          .map((other, otherIdx) => ({ other, otherIdx }))
                          .filter(
                            ({ other, otherIdx }) =>
                              other.key !== item.key && groups[otherIdx] === groups[idx],
                          )
                          .map(({ other, otherIdx }) => ({
                            label: labels[otherIdx] ?? String(otherIdx + 1),
                            name: other.exerciseName,
                            summary: listEntrySummary(
                              other,
                              exercises.find((e) => e.id === other.exerciseId),
                              true,
                            ),
                            setCount: other.prescribedSets.length || other.sets || 0,
                          }))
                  }
                  isLastInDay={idx === day.items.length - 1}
                  expanded={expandedKeys.has(item.key)}
                  onToggleExpand={() => toggleExpand(item.key)}
                  onMove={(dir) => onMoveItem(item.key, dir)}
                  onRemove={() => onRemoveItem(item.key)}
                  onToggleLink={() => onToggleLink(item.key)}
                  onPatch={(patch) => onPatchItem(item.key, patch)}
                  onAddSet={() => onAddSet(item.key)}
                  onInsertSet={
                    onInsertSet ? (index, side) => onInsertSet(item.key, index, side) : undefined
                  }
                  onApplyRestToAll={
                    onApplyRestToAll ? (seconds) => onApplyRestToAll(item.key, seconds) : undefined
                  }
                  onPatchSet={(setKey, patch) => onPatchSet(item.key, setKey, patch)}
                  onRemoveSet={(setKey) => onRemoveSet(item.key, setKey)}
                  onApplyPreset={(presetId) => onApplyPreset(item.key, presetId)}
                  onClearSets={() => onClearSets(item.key)}
                />
              ))}
            </div>
            </SortableContext>
          </div>
        </div>
      ) : null}

      <div className={day.items.length > 0 ? "mt-3" : undefined}>
        <QuickComposer exercises={exercises} day={day} onAdd={onAddItem} onToggleLink={onToggleLink} />
      </div>
    </div>
  );
}
