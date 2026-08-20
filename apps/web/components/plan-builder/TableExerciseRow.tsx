"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Exercise, rirFromRpe } from "@/lib/api";
import { ExerciseName } from "@/components/ExerciseName";
import { ExerciseThumb } from "@/components/ExerciseThumb";
import { Badge, IconButton, inputClass } from "@/components/ui";
import { isDumbbellPair } from "@/lib/weight";
import { demoMedia } from "@/lib/youtube";
import { NumInput } from "./NumInput";
import { RangeInput } from "./RangeInput";
import { SchemeModeSection } from "./SchemeModeSection";
import { SetSchemeEditor } from "./SetSchemeEditor";
import { BuilderItem, BuilderSet, newKey } from "./types";
import type { EditorPartner } from "./ListEntryEditor";

// Wspólna siatka kolumn dla wiersza i nagłówka tabeli (TableDay) — trzymana w jednym miejscu,
// żeby kolumny obu nie mogły się rozjechać.
export const TABLE_ROW_GRID_COLS =
  "grid-cols-[1.75rem_1.75rem_minmax(11rem,1.4fr)_9.5rem_4.5rem_5rem_3.5rem_5rem_minmax(8rem,1fr)_8.5rem]";

const cellInput = `${inputClass} px-2 py-1.5 text-center text-sm`;

function SetsRepsCell({
  item,
  exercise,
  onPatch,
}: {
  item: BuilderItem;
  exercise?: Exercise;
  onPatch: (patch: Partial<BuilderItem>) => void;
}) {
  const setsField = (
    <NumInput
      className="w-10 px-1 py-1.5 text-center"
      value={item.sets}
      min={1}
      onChange={(v) => onPatch({ sets: v })}
      placeholder={exercise ? String(exercise.defaultSets) : "—"}
    />
  );
  const times = (
    <span className="shrink-0 text-xs text-muted">×</span>
  );

  if (item.measureType === "time") {
    return (
      <div className="flex items-center gap-1">
        {setsField}
        {times}
        <NumInput
          className="w-12 px-1 py-1.5 text-center"
          value={item.repDurationSeconds}
          min={1}
          onChange={(v) => onPatch({ repDurationSeconds: v })}
          placeholder="s"
        />
      </div>
    );
  }
  if (item.measureType === "distance") {
    return (
      <div className="flex items-center gap-1">
        {setsField}
        {times}
        <NumInput
          className="w-14 px-1 py-1.5 text-center"
          value={item.distanceMeters}
          min={1}
          onChange={(v) => onPatch({ distanceMeters: v })}
          placeholder="m"
        />
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1">
      {setsField}
      {times}
      <RangeInput
        className="w-[4.5rem] px-1 py-1.5"
        reps={item.reps}
        repsMax={item.repsMax}
        onChange={(next) => onPatch(next)}
        placeholder={exercise ? String(exercise.defaultReps) : "8"}
      />
    </div>
  );
}

export function TableExerciseRow({
  item,
  index,
  weekNumber,
  exercise,
  supersetLabel,
  isInSuperset,
  isFirstInSuperset = false,
  partners = [],
  isLastInDay,
  expanded,
  onToggleExpand,
  onMove,
  onRemove,
  onToggleLink,
  onPatch,
  onAddSet,
  onInsertSet,
  onPatchSet,
  onRemoveSet,
  onApplyPreset,
  onApplyRestToAll,
  onClearSets,
}: {
  item: BuilderItem;
  index: number;
  weekNumber: number;
  exercise?: Exercise;
  supersetLabel: string | null;
  isInSuperset: boolean;
  isFirstInSuperset?: boolean;
  partners?: EditorPartner[];
  isLastInDay: boolean;
  expanded: boolean;
  onToggleExpand: () => void;
  onMove: (dir: -1 | 1) => void;
  onRemove: () => void;
  onToggleLink: () => void;
  onPatch: (patch: Partial<BuilderItem>) => void;
  onAddSet: () => void;
  onInsertSet?: (index: number, side: "before" | "after") => string | void;
  onPatchSet: (setKey: string, patch: Partial<BuilderSet>) => void;
  onRemoveSet: (setKey: string) => void;
  onApplyPreset: (presetId: string) => void;
  onApplyRestToAll?: (seconds: number | null) => void;
  onClearSets: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.key,
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`rounded-[10px] border bg-surface ${
        isInSuperset ? "border-accent/50 border-l-[3px] bg-accent-dim/40" : "border-border"
      } ${isDragging ? "opacity-50" : ""}`}
    >
      <div className={`grid ${TABLE_ROW_GRID_COLS} items-center gap-2 px-2 py-2`}>
        <IconButton title={expanded ? "Zwiń szczegóły" : "Rozwiń szczegóły"} size="xs" onClick={onToggleExpand}>
          {expanded ? "▾" : "▸"}
        </IconButton>

        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label="Przeciągnij, aby zmienić kolejność albo przenieść do innego dnia"
          title="Przeciągnij, aby zmienić kolejność"
          className="inline-flex h-6 w-6 cursor-grab touch-none items-center justify-center rounded-md bg-surface-hover font-mono text-xs font-semibold tabular-nums text-muted transition-colors hover:text-foreground-secondary active:cursor-grabbing"
        >
          {supersetLabel ?? index + 1}
        </button>

        <div className="flex min-w-0 items-center gap-2">
          <div className="h-9 w-9 shrink-0">
            <ExerciseThumb
              variant="square"
              youtubeId={demoMedia(exercise).youtubeId}
              category={exercise?.category}
              alt={item.exerciseName}
            />
          </div>
          <div className="flex min-w-0 flex-wrap items-center gap-1.5">
            <span className="min-w-0 text-sm font-medium">
              <ExerciseName name={item.exerciseName} />
            </span>
            {item.isWarmup ? <Badge tone="neutral">rozgrzewka</Badge> : null}
            {supersetLabel && <Badge tone="accent">{supersetLabel}</Badge>}
          </div>
        </div>

        <SetsRepsCell item={item} exercise={exercise} onPatch={onPatch} />

        <input
          className={cellInput}
          value={item.tempo ?? ""}
          onChange={(e) => onPatch({ tempo: e.target.value || null })}
          placeholder="—"
          aria-label="Tempo"
        />

        {isInSuperset && !isFirstInSuperset ? (
          <span className="t-label text-muted">wspólna</span>
        ) : (
          <NumInput
            className="px-2 py-1.5 text-center"
            value={item.restBetweenSetsSeconds}
            min={0}
            onChange={(v) => onPatch({ restBetweenSetsSeconds: v })}
            placeholder={exercise ? String(exercise.defaultRestBetweenSetsSeconds) : "dom."}
            aria-label={isInSuperset ? "Przerwa po superserii" : "Przerwa"}
          />
        )}

        <NumInput
          className="px-2 py-1.5 text-center"
          value={item.targetRir}
          min={0}
          step={0.5}
          onChange={(v) => onPatch({ targetRir: v })}
          placeholder="—"
          aria-label="RIR celu"
        />

        <NumInput
          className="px-2 py-1.5 text-center"
          value={item.loadKg}
          min={0}
          step={0.5}
          onChange={(v) => onPatch({ loadKg: v })}
          placeholder="dom."
          title={isDumbbellPair(exercise ?? {}) ? "Ciężar jednej hantli (klient zobaczy 2×)" : "Ciężar (kg)"}
          aria-label={isDumbbellPair(exercise ?? {}) ? "Ciężar na hantlę" : "Ciężar"}
        />

        <input
          className={`${inputClass} px-2 py-1.5 text-sm`}
          value={item.notes ?? ""}
          onChange={(e) => onPatch({ notes: e.target.value || null })}
          placeholder="Notatka dla klienta"
          aria-label="Notatka dla klienta"
        />

        <div className="flex flex-wrap items-center justify-end gap-1">
          <IconButton title="Przenieś wyżej" onClick={() => onMove(-1)} size="xs">
            ↑
          </IconButton>
          <IconButton title="Przenieś niżej" onClick={() => onMove(1)} size="xs">
            ↓
          </IconButton>
          {!isLastInDay && (
            <IconButton
              title={item.linkedToNext ? "Rozłącz superserię" : "Połącz w superserię"}
              onClick={onToggleLink}
              size="xs"
            >
              ⛓
            </IconButton>
          )}
          <IconButton title="Usuń pozycję" variant="danger" onClick={onRemove} size="xs">
            ✕
          </IconButton>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-border px-3 py-2.5">
          {partners.length > 0 ? (
            <div className="mb-2 space-y-1">
              {partners.map((p) => (
                <div key={p.label} className="flex flex-wrap items-center gap-2 text-sm text-muted">
                  <span>
                    {p.label} {p.name} — {p.summary}
                  </span>
                  {p.setCount > 0 && p.setCount !== (item.prescribedSets.length || item.sets || 0) ? (
                    <button
                      type="button"
                      onClick={() => {
                        let next = [...item.prescribedSets];
                        if (next.length === 0) {
                          next = Array.from({ length: p.setCount }, (_, i) => ({
                            key: newKey(),
                            order: i + 1,
                            reps: item.reps,
                            repsMax: item.repsMax,
                            durationSeconds: item.repDurationSeconds,
                            distanceMeters: item.distanceMeters,
                            loadKg: item.loadKg,
                            loadPercent: item.loadPercent,
                            percentOf: item.loadPercent != null ? "1rm" : null,
                            targetRpe: item.targetRpe,
                            targetRir: item.targetRir,
                            tempo: item.tempo,
                            role: "work",
                            note: null,
                            restSeconds: null,
                          }));
                        } else if (next.length < p.setCount) {
                          const last = next[next.length - 1];
                          while (next.length < p.setCount) {
                            next.push({ ...last, key: newKey(), order: next.length + 1, note: null });
                          }
                        } else {
                          next = next.slice(0, p.setCount).map((s, i) => ({ ...s, order: i + 1 }));
                        }
                        onPatch({ prescribedSets: next, sets: next.length });
                      }}
                      className="font-medium text-foreground-secondary hover:text-foreground"
                    >
                      wyrównaj serie
                    </button>
                  ) : null}
                </div>
              ))}
            </div>
          ) : null}
          <SchemeModeSection item={item} onPatch={onPatch} />
          <details className="mt-2">
            <summary className="t-label cursor-pointer text-muted-faint">Zaawansowane</summary>
            <div className="mt-2 flex items-center gap-2">
              <label className="flex items-center gap-1.5 text-xs text-muted">
                RPE
                <NumInput
                  className="w-16 px-2 py-1 text-center"
                  value={item.targetRpe}
                  min={1}
                  step={0.5}
                  onChange={(v) => onPatch({ targetRpe: v })}
                  placeholder="—"
                />
              </label>
              {item.targetRpe != null && item.targetRir == null ? (
                <span className="text-xs text-muted">≈ RIR {rirFromRpe(item.targetRpe)}</span>
              ) : null}
            </div>
          </details>
          <p className="mb-2 mt-2.5 t-label text-muted">Rozkład serii</p>
          <SetSchemeEditor
            sets={item.prescribedSets}
            weekNumber={weekNumber}
            measureType={item.measureType}
            itemLoadKg={item.loadKg}
            defaultRestSeconds={
              item.restBetweenSetsSeconds ?? exercise?.defaultRestBetweenSetsSeconds ?? null
            }
            onAdd={onAddSet}
            onInsert={onInsertSet}
            onPatch={onPatchSet}
            onRemove={onRemoveSet}
            onApplyPreset={onApplyPreset}
            onApplyRestToAll={onApplyRestToAll}
            onClear={onClearSets}
            onReplaceSets={(next) => onPatch({ prescribedSets: next, sets: next.length })}
          />
        </div>
      )}
    </div>
  );
}
