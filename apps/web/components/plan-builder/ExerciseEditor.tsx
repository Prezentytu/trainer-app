"use client";

import { useState } from "react";
import { Exercise, RIR_HELP, rirFromRpe } from "@/lib/api";
import { Field, Switch, inputClass } from "@/components/ui";
import { NumInput } from "./NumInput";
import { SetSchemeEditor } from "./SetSchemeEditor";
import { BuilderItem, BuilderSet } from "./types";

export function ExerciseEditor({
  item,
  weekNumber,
  exercise,
  dragHandleProps,
  onCollapse,
  onPatch,
  onAddSet,
  onPatchSet,
  onRemoveSet,
  onApplyPreset,
  onClearSets,
}: {
  item: BuilderItem;
  weekNumber: number;
  exercise?: Exercise;
  dragHandleProps?: Record<string, unknown>;
  onCollapse: () => void;
  onPatch: (patch: Partial<BuilderItem>) => void;
  onAddSet: () => void;
  onPatchSet: (setKey: string, patch: Partial<BuilderSet>) => void;
  onRemoveSet: (setKey: string) => void;
  onApplyPreset: (presetId: string) => void;
  onClearSets: () => void;
}) {
  const [advancedOpen, setAdvancedOpen] = useState(true);
  const [schemeOpen, setSchemeOpen] = useState(item.prescribedSets.length > 0);

  const repsDisplay =
    item.measureType === "reps"
      ? item.repsMax
        ? `${item.reps ?? "—"}–${item.repsMax}`
        : String(item.reps ?? "")
      : "";

  return (
    <div className="overflow-hidden rounded-xl border border-border-strong bg-surface">
      <div className="flex items-center gap-2 border-b border-border bg-surface-hover px-3 py-2.5">
        <button
          type="button"
          {...dragHandleProps}
          aria-label="Przeciągnij"
          className="cursor-grab touch-none text-muted-faint hover:text-foreground-secondary active:cursor-grabbing"
        >
          ⠿
        </button>
        <span className="min-w-0 flex-1 break-words text-sm font-semibold">{item.exerciseName}</span>
        <button
          type="button"
          onClick={onCollapse}
          className="text-sm text-muted hover:text-foreground-secondary"
        >
          Zwiń
        </button>
      </div>

      <div className="space-y-4 p-4">
        <div className="grid grid-cols-3 gap-3">
          <Field label="Serie">
            <NumInput
              value={item.sets}
              min={1}
              onChange={(v) => onPatch({ sets: v })}
              placeholder={exercise ? String(exercise.defaultSets) : "3"}
            />
          </Field>
          {item.measureType === "time" ? (
            <Field label="Czas powt. (s)">
              <NumInput
                value={item.repDurationSeconds}
                min={1}
                onChange={(v) => onPatch({ repDurationSeconds: v })}
                placeholder="dom."
              />
            </Field>
          ) : item.measureType === "distance" ? (
            <Field label="Dystans (m)">
              <NumInput
                value={item.distanceMeters}
                min={1}
                onChange={(v) => onPatch({ distanceMeters: v })}
                placeholder="dom."
              />
            </Field>
          ) : (
            <Field label="Powtórzenia">
              <div className="flex items-center gap-1">
                <NumInput value={item.reps} min={1} onChange={(v) => onPatch({ reps: v })} placeholder="8" />
                <span className="text-muted-faint">–</span>
                <NumInput value={item.repsMax} min={1} onChange={(v) => onPatch({ repsMax: v })} placeholder="12" />
              </div>
            </Field>
          )}
          <Field label="Ciężar (kg)">
            <NumInput
              value={item.loadKg}
              min={0}
              step={0.5}
              onChange={(v) => onPatch({ loadKg: v })}
              placeholder="klient decyduje"
            />
          </Field>
        </div>

        <div>
          <button
            type="button"
            onClick={() => setAdvancedOpen((v) => !v)}
            className="mb-2 font-mono text-xs font-semibold uppercase tracking-[0.08em] text-muted-faint"
          >
            Zaawansowane {advancedOpen ? "▾" : "▸"}
          </button>
          {advancedOpen && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Field label="Tempo">
                <input
                  className={inputClass}
                  value={item.tempo ?? ""}
                  onChange={(e) => onPatch({ tempo: e.target.value || null })}
                  placeholder="3110"
                />
              </Field>
              <Field label="RIR" title={RIR_HELP}>
                <NumInput
                  value={item.targetRir}
                  min={0}
                  step={0.5}
                  onChange={(v) => onPatch({ targetRir: v })}
                  placeholder="—"
                />
              </Field>
              <Field
                label="RPE"
                hint={
                  item.targetRpe != null && item.targetRir == null
                    ? `≈ RIR ${rirFromRpe(item.targetRpe)}`
                    : undefined
                }
              >
                <NumInput
                  value={item.targetRpe}
                  min={1}
                  step={0.5}
                  onChange={(v) => onPatch({ targetRpe: v })}
                  placeholder="—"
                />
              </Field>
              <Field label="Przerwa serie">
                <NumInput
                  value={item.restBetweenSetsSeconds}
                  min={0}
                  onChange={(v) => onPatch({ restBetweenSetsSeconds: v })}
                  placeholder="60"
                />
              </Field>
              <Field label="Po ćwiczeniu">
                <NumInput
                  value={item.restAfterExerciseSeconds}
                  min={0}
                  onChange={(v) => onPatch({ restAfterExerciseSeconds: v })}
                  placeholder="90"
                />
              </Field>
              <div className="col-span-2 sm:col-span-4">
                <Field label="Notatka dla klienta">
                  <input
                    className={inputClass}
                    value={item.notes ?? ""}
                    onChange={(e) => onPatch({ notes: e.target.value || null })}
                    placeholder="np. łokcie pod 45°…"
                  />
                </Field>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[10px] border border-border bg-surface-sunken px-3.5 py-3">
          <Switch
            label="Rozpisz serie"
            checked={schemeOpen}
            onChange={(v) => {
              setSchemeOpen(v);
              if (!v) onClearSets();
            }}
          />
          {schemeOpen && (
            <span className="font-mono text-xs tabular-nums text-muted">
              {item.prescribedSets.length || repsDisplay || item.sets || "—"} serie ·{" "}
              <span className="text-accent">otwórz tabelę ↓</span>
            </span>
          )}
        </div>

        {schemeOpen && (
          <SetSchemeEditor
            sets={item.prescribedSets}
            weekNumber={weekNumber}
            open
            onAdd={onAddSet}
            onPatch={onPatchSet}
            onRemove={onRemoveSet}
            onApplyPreset={onApplyPreset}
            onClear={onClearSets}
          />
        )}
      </div>
    </div>
  );
}
