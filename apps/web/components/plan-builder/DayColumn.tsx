"use client";

import { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Exercise } from "@/lib/api";
import { buildGroupLabels, computeGroupsFromLinks } from "@/lib/supersets";
import { Button, EmptyState, inputClass } from "@/components/ui";
import { dayContainerId } from "./dnd";
import { ExercisePicker } from "./ExercisePicker";
import { ExerciseRow } from "./ExerciseRow";
import { BuilderDay, BuilderItem, BuilderSet } from "./types";

export function DayColumn({
  day,
  exercises,
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
  day: BuilderDay;
  exercises: Exercise[];
  onPatchDay: (patch: Partial<BuilderDay>) => void;
  onRemoveDay: () => void;
  onAddItem: (exerciseId: number) => void;
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
  const { setNodeRef } = useDroppable({ id: dayContainerId(day.key) });
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
    <div className="flex w-80 shrink-0 flex-col rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="flex-1 space-y-2">
          <input
            className={`${inputClass} w-full font-semibold`}
            value={day.label}
            onChange={(e) => onPatchDay({ label: e.target.value })}
            placeholder="np. Poniedziałek / Trening A"
          />
          <input
            className={`${inputClass} w-full text-xs`}
            value={day.notes ?? ""}
            onChange={(e) => onPatchDay({ notes: e.target.value || null })}
            placeholder="Notatka / rozgrzewka dnia"
          />
        </div>
        <Button variant="danger" onClick={onRemoveDay}>
          Usuń
        </Button>
      </div>

      <div ref={setNodeRef} className="flex-1 space-y-2">
        {day.items.length === 0 ? (
          <EmptyState>Dzień jest pusty.</EmptyState>
        ) : (
          <SortableContext items={day.items.map((i) => i.key)} strategy={verticalListSortingStrategy}>
            {day.items.map((item, idx) => (
              <ExerciseRow
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
          </SortableContext>
        )}
      </div>

      <div className="mt-3">
        <ExercisePicker exercises={exercises} onAdd={onAddItem} />
      </div>
    </div>
  );
}
