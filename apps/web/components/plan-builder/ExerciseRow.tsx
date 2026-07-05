"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Exercise, EXERCISE_TYPE_LABELS } from "@/lib/api";
import { Badge, Button, Field, IconButton, formatRest, inputClass } from "@/components/ui";
import { NumInput } from "./NumInput";
import { SetSchemeEditor } from "./SetSchemeEditor";
import { BuilderItem, BuilderSet } from "./types";

function summaryText(item: BuilderItem, exercise?: Exercise): string {
  const sets = item.sets ?? exercise?.defaultSets ?? null;
  let core: string;
  if (item.exerciseType === "time") {
    const base = item.repDurationSeconds ?? exercise?.defaultRepDurationSeconds ?? null;
    core = base ? `${base}${item.repDurationSecondsMax ? `–${item.repDurationSecondsMax}` : ""}s` : "—";
  } else if (item.exerciseType === "distance") {
    const dist = item.distanceMeters ?? exercise?.defaultDistanceMeters ?? null;
    core = dist ? `${dist} m` : "—";
  } else {
    const reps = item.reps ?? exercise?.defaultReps ?? null;
    core = reps ? `${reps}${item.repsMax ? `–${item.repsMax}` : ""} powt.` : "—";
  }
  const rest = item.restBetweenSetsSeconds ?? exercise?.defaultRestBetweenSetsSeconds ?? null;
  const parts = [sets ? `${sets} × ${core}` : core];
  if (rest != null) parts.push(formatRest(rest));
  if (item.loadKg != null) parts.push(`${item.loadKg} kg`);
  if (item.tempo) parts.push(`tempo ${item.tempo}`);
  return parts.join(" · ");
}

export function ExerciseRow({
  item,
  index,
  weekNumber,
  exercise,
  supersetLabel,
  isInSuperset,
  isLastInDay,
  expanded,
  onToggleExpand,
  onMove,
  onRemove,
  onToggleLink,
  onPatch,
  onAddSet,
  onPatchSet,
  onRemoveSet,
  onApplyPreset,
  onClearSets,
}: {
  item: BuilderItem;
  index: number;
  weekNumber: number;
  exercise?: Exercise;
  supersetLabel: string | null;
  isInSuperset: boolean;
  isLastInDay: boolean;
  expanded: boolean;
  onToggleExpand: () => void;
  onMove: (dir: -1 | 1) => void;
  onRemove: () => void;
  onToggleLink: () => void;
  onPatch: (patch: Partial<BuilderItem>) => void;
  onAddSet: () => void;
  onPatchSet: (setKey: string, patch: Partial<BuilderSet>) => void;
  onRemoveSet: (setKey: string) => void;
  onApplyPreset: (presetId: string) => void;
  onClearSets: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.key });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`rounded-lg border bg-zinc-900/60 ${
        isInSuperset ? "border-yellow-400/40 border-l-[3px]" : "border-zinc-800"
      } ${isDragging ? "opacity-50" : ""}`}
    >
      <div className="flex items-center gap-2 p-3">
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label="Przeciągnij, aby zmienić kolejność"
          className="shrink-0 cursor-grab touch-none px-0.5 text-zinc-600 hover:text-zinc-300 active:cursor-grabbing"
        >
          ⋮⋮
        </button>

        <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-yellow-400/15 text-xs font-bold text-yellow-300">
          {index + 1}
        </span>

        <button type="button" onClick={onToggleExpand} className="flex min-w-0 flex-1 items-center gap-2 text-left">
          <span className="shrink-0 text-xs text-zinc-500">{expanded ? "▾" : "▸"}</span>
          <span className="truncate font-medium">{item.exerciseName}</span>
          {supersetLabel && <Badge tone="yellow">{supersetLabel}</Badge>}
          {item.notes && <span className="shrink-0 text-yellow-400" title={`Notatka: ${item.notes}`}>●</span>}
          <span className="truncate text-xs text-zinc-500">{summaryText(item, exercise)}</span>
        </button>

        <div className="flex shrink-0 items-center gap-1">
          <IconButton title="Przenieś wyżej" onClick={() => onMove(-1)} size="xs">
            ↑
          </IconButton>
          <IconButton title="Przenieś niżej" onClick={() => onMove(1)} size="xs">
            ↓
          </IconButton>
          {!isLastInDay && (
            <Button variant="ghost" onClick={onToggleLink}>
              {item.linkedToNext ? "Rozłącz" : "Połącz w superserię"}
            </Button>
          )}
          <IconButton title="Usuń pozycję" variant="danger" onClick={onRemove}>
            ✕
          </IconButton>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-zinc-800 p-3">
          <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-zinc-500">Podstawowe</p>
          <div className="mb-3 grid gap-3 sm:grid-cols-4">
            <Field label={`Serie${exercise ? ` (dom. ${exercise.defaultSets})` : ""}`}>
              <NumInput value={item.sets} min={1} onChange={(v) => onPatch({ sets: v })} placeholder="dom." />
            </Field>
            {item.exerciseType === "time" ? (
              <>
                <Field label="Czas powt. (s)">
                  <NumInput value={item.repDurationSeconds} min={1} onChange={(v) => onPatch({ repDurationSeconds: v })} placeholder="dom." />
                </Field>
                <Field label="Czas maks. (s)">
                  <NumInput value={item.repDurationSecondsMax} min={1} onChange={(v) => onPatch({ repDurationSecondsMax: v })} placeholder="—" />
                </Field>
              </>
            ) : item.exerciseType === "distance" ? (
              <Field label="Dystans (m)">
                <NumInput value={item.distanceMeters} min={1} onChange={(v) => onPatch({ distanceMeters: v })} placeholder="dom." />
              </Field>
            ) : (
              <>
                <Field label="Powt.">
                  <NumInput value={item.reps} min={1} onChange={(v) => onPatch({ reps: v })} placeholder="dom." />
                </Field>
                <Field label="Powt. maks.">
                  <NumInput value={item.repsMax} min={1} onChange={(v) => onPatch({ repsMax: v })} placeholder="—" />
                </Field>
              </>
            )}
            <Field label="Ciężar (kg)">
              <NumInput value={item.loadKg} min={0} step={0.5} onChange={(v) => onPatch({ loadKg: v })} placeholder="dom." />
            </Field>
          </div>

          <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-zinc-500">Zaawansowane</p>
          <div className="mb-3 grid gap-3 sm:grid-cols-4">
            <Field label="Tempo">
              <input
                className={inputClass}
                value={item.tempo ?? ""}
                onChange={(e) => onPatch({ tempo: e.target.value || null })}
                placeholder="3110"
              />
            </Field>
            <Field label="RPE">
              <NumInput value={item.targetRpe} min={1} step={0.5} onChange={(v) => onPatch({ targetRpe: v })} placeholder="—" />
            </Field>
            <Field label="Przerwa między seriami (s)">
              <NumInput value={item.restBetweenSetsSeconds} min={0} onChange={(v) => onPatch({ restBetweenSetsSeconds: v })} placeholder="dom." />
            </Field>
            <Field label="Przerwa po ćwiczeniu (s)">
              <NumInput value={item.restAfterExerciseSeconds} min={0} onChange={(v) => onPatch({ restAfterExerciseSeconds: v })} placeholder="90" />
            </Field>
            <Field label="Schemat serii (opis)">
              <input
                className={inputClass}
                value={item.setScheme ?? ""}
                onChange={(e) => onPatch({ setScheme: e.target.value || null })}
                placeholder="Rampa 6-4-2-5-3-1"
              />
            </Field>
            <div className="sm:col-span-3">
              <Field label="Notatka dla klienta">
                <input
                  className={inputClass}
                  value={item.notes ?? ""}
                  onChange={(e) => onPatch({ notes: e.target.value || null })}
                />
              </Field>
            </div>
          </div>

          <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-zinc-500">Rozkład serii</p>
          <SetSchemeEditor
            sets={item.prescribedSets}
            weekNumber={weekNumber}
            onAdd={onAddSet}
            onPatch={onPatchSet}
            onRemove={onRemoveSet}
            onApplyPreset={onApplyPreset}
            onClear={onClearSets}
          />
        </div>
      )}
    </div>
  );
}
