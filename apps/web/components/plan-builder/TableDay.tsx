"use client";

import { useEffect, useRef, useState } from "react";
import { Exercise } from "@/lib/api";
import { buildGroupLabels, computeGroupsFromLinks } from "@/lib/supersets";
import { Badge, EmptyState, IconButton, inputClass } from "@/components/ui";
import { QuickComposer } from "./QuickComposer";
import { TABLE_ROW_GRID_COLS, TableExerciseRow } from "./TableExerciseRow";
import { BuilderDay, BuilderItem, BuilderSet } from "./types";

export function TableDay({
  day,
  exercises,
  onPatchDay,
  onRemoveDay,
  onDuplicateDay,
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
  onDuplicateDay: () => void;
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
  const [notesOpen, setNotesOpen] = useState(false);
  const notesRef = useRef<HTMLInputElement>(null);
  const showNotesEditor = notesOpen || Boolean(day.notes?.trim());

  useEffect(() => {
    if (notesOpen) notesRef.current?.focus();
  }, [notesOpen]);

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
    <div className="rounded-xl border border-border bg-surface p-4 shadow-card">
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1 space-y-2 sm:max-w-sm">
          <input
            className={`${inputClass} w-full font-semibold`}
            value={day.label}
            onChange={(e) => onPatchDay({ label: e.target.value })}
            placeholder="np. Poniedziałek / Trening A"
          />
          {showNotesEditor ? (
            <input
              ref={notesRef}
              className="w-full rounded-[10px] border border-dashed border-border bg-transparent px-3 py-1.5 text-xs text-foreground-secondary outline-none placeholder:text-muted-faint focus:border-border-strong focus:text-foreground"
              value={day.notes ?? ""}
              onChange={(e) => onPatchDay({ notes: e.target.value || null })}
              onBlur={() => {
                if (!day.notes?.trim()) setNotesOpen(false);
              }}
              placeholder="Notatka / rozgrzewka dnia"
              aria-label="Notatka dnia"
            />
          ) : (
            <button
              type="button"
              onClick={() => setNotesOpen(true)}
              className="text-xs text-muted-faint transition-colors hover:text-muted"
            >
              + Notatka / rozgrzewka dnia
            </button>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Badge>{day.items.length} ćw.</Badge>
          <IconButton title={`Powiel układ „${day.label}"`} onClick={onDuplicateDay}>
            ⧉
          </IconButton>
          <IconButton title="Usuń dzień" variant="danger" onClick={onRemoveDay}>
            🗑
          </IconButton>
        </div>
      </div>

      {day.items.length === 0 ? (
        <EmptyState title="Pusty dzień">
          Dodaj ćwiczenie poniżej — tu pojawi się arkusz serii i powtórzeń.
        </EmptyState>
      ) : (
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
      )}

      <div className="mt-3">
        <QuickComposer exercises={exercises} day={day} onAdd={onAddItem} onToggleLink={onToggleLink} />
      </div>
    </div>
  );
}
