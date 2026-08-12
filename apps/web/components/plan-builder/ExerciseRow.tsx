"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Exercise, RIR_HELP, rirFromRpe } from "@/lib/api";
import { ExerciseThumb } from "@/components/ExerciseThumb";
import { formatMeasureCore } from "@/lib/measure";
import { Badge, Field, IconButton, formatRest, inputClass } from "@/components/ui";
import { formatLoadDisplay, isDumbbellPair } from "@/lib/weight";
import { demoMedia } from "@/lib/youtube";
import { NumInput } from "./NumInput";
import { SetSchemeEditor } from "./SetSchemeEditor";
import { BuilderItem, BuilderSet } from "./types";

function summaryText(item: BuilderItem, exercise?: Exercise): string {
  const sets = item.sets ?? exercise?.defaultSets ?? null;
  let core = formatMeasureCore(item, exercise);
  if (item.measureType === "reps" && core !== "—") core = `${core} powt.`;
  const rest = item.restBetweenSetsSeconds ?? exercise?.defaultRestBetweenSetsSeconds ?? null;
  const parts = [sets ? `${sets} × ${core}` : core];
  if (rest != null) parts.push(formatRest(rest));
  if (item.loadKg != null) parts.push(formatLoadDisplay(item.loadKg, exercise));
  if (item.tempo) parts.push(`tempo ${item.tempo}`);
  if (item.targetRir != null) parts.push(`RIR ${item.targetRir}`);
  else if (item.targetRpe != null) parts.push(`RPE ${item.targetRpe}`);
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

  const isSupersetStart = isInSuperset && supersetLabel?.endsWith("1");

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`rounded-[10px] border bg-surface ${
        isInSuperset ? "border-border-strong border-l-[3px] bg-surface-sunken" : "border-border"
      } ${isDragging ? "opacity-50" : ""}`}
    >
      <div className="flex flex-col gap-2 p-3">
        {isSupersetStart && (
          <p className="eyebrow pl-8">{"/// Superseria"}</p>
        )}
        <div className="flex items-start gap-2">
          <button
            type="button"
            {...attributes}
            {...listeners}
            aria-label="Przeciągnij, aby zmienić kolejność"
            className="mt-0.5 shrink-0 cursor-grab touch-none px-0.5 text-muted-faint hover:text-foreground-secondary active:cursor-grabbing"
          >
            ⋮⋮
          </button>

          <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-surface-active font-mono text-xs font-semibold tabular-nums text-muted">
            {supersetLabel ?? index + 1}
          </span>

          <button
            type="button"
            onClick={onToggleExpand}
            className="flex min-w-0 flex-1 flex-wrap items-center gap-2 text-left"
          >
            <span className="shrink-0 text-xs text-muted">{expanded ? "▾" : "▸"}</span>
            <div className="h-10 w-10 shrink-0">
              <ExerciseThumb
                variant="square"
                youtubeId={demoMedia(exercise).youtubeId}
                category={exercise?.category}
                alt={item.exerciseName}
              />
            </div>
            <span className="min-w-0 break-words font-medium">{item.exerciseName}</span>
            {supersetLabel && <Badge tone="accent">{supersetLabel}</Badge>}
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pl-8">
          <span className="min-w-0 break-words font-mono text-xs tabular-nums text-muted">
            {summaryText(item, exercise)}
          </span>
          <div className="flex shrink-0 flex-wrap items-center gap-1">
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

        {item.notes && (
          <p className="ml-8 break-words rounded-[10px] bg-accent-dim px-2 py-1 text-xs text-muted-strong">
            {item.notes}
          </p>
        )}
      </div>

      {expanded && (
        <div className="border-t border-border p-3">
          <p className="mb-2 font-mono text-xs font-medium uppercase tracking-caps text-muted">Podstawowe</p>
          <div className="mb-3 grid grid-cols-2 gap-3">
            <Field label={`Serie${exercise ? ` (dom. ${exercise.defaultSets})` : ""}`}>
              <NumInput value={item.sets} min={1} onChange={(v) => onPatch({ sets: v })} placeholder="dom." />
            </Field>
            {item.measureType === "time" ? (
              <>
                <Field label="Czas powt. (s)">
                  <NumInput value={item.repDurationSeconds} min={1} onChange={(v) => onPatch({ repDurationSeconds: v })} placeholder="dom." />
                </Field>
                <Field label="Czas maks. (s)">
                  <NumInput value={item.repDurationSecondsMax} min={1} onChange={(v) => onPatch({ repDurationSecondsMax: v })} placeholder="—" />
                </Field>
              </>
            ) : item.measureType === "distance" ? (
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
            <Field label={isDumbbellPair(exercise ?? {}) ? "Ciężar (kg · na hantlę)" : "Ciężar (kg)"}>
              <NumInput value={item.loadKg} min={0} step={0.5} onChange={(v) => onPatch({ loadKg: v })} placeholder="dom." />
            </Field>
            <Field label="RIR celu" title={RIR_HELP}>
              <NumInput value={item.targetRir} min={0} step={0.5} onChange={(v) => onPatch({ targetRir: v })} placeholder="—" />
            </Field>
          </div>

          <p className="mb-2 font-mono text-xs font-medium uppercase tracking-caps text-muted">Zaawansowane</p>
          <div className="mb-3 grid grid-cols-2 gap-3">
            <Field label="Tempo">
              <input
                className={inputClass}
                value={item.tempo ?? ""}
                onChange={(e) => onPatch({ tempo: e.target.value || null })}
                placeholder="3110"
              />
            </Field>
            <Field
              label="RPE (opcjonalnie)"
              hint={item.targetRpe != null && item.targetRir == null ? `≈ RIR ${rirFromRpe(item.targetRpe)}` : undefined}
            >
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
            <div className="col-span-2">
              <Field label="Notatka dla klienta">
                <input
                  className={inputClass}
                  value={item.notes ?? ""}
                  onChange={(e) => onPatch({ notes: e.target.value || null })}
                />
              </Field>
            </div>
          </div>

          <p className="mb-2 font-mono text-xs font-medium uppercase tracking-caps text-muted">Rozkład serii</p>
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
