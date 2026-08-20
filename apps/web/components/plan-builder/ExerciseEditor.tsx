"use client";

import { useState } from "react";
import { Exercise, rirFromRpe } from "@/lib/api";
import { Field, inputClass } from "@/components/ui";
import { isDumbbellPair } from "@/lib/weight";
import { compactSchemeLine } from "@/lib/schemeSummary";
import { NumInput } from "./NumInput";
import { RangeInput } from "./RangeInput";
import { ItemDefaultsBar } from "./ItemDefaultsBar";
import { SchemeModeSection } from "./SchemeModeSection";
import { SetSchemeEditor } from "./SetSchemeEditor";
import { parseRampSchemeInfo } from "./listGroups";
import { libraryDefaults } from "./lastPrescription";
import { BuilderItem, BuilderSet } from "./types";

/** Pola edycji pozycji planu — bez ramki/nagłówka (żyją w SidePanel). */
export function ExerciseEditor({
  item,
  weekNumber,
  exercise,
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
  weekNumber: number;
  exercise?: Exercise;
  onPatch: (patch: Partial<BuilderItem>) => void;
  onAddSet: () => void;
  onInsertSet?: (index: number, side: "before" | "after") => string | void;
  onPatchSet: (setKey: string, patch: Partial<BuilderSet>) => void;
  onRemoveSet: (setKey: string) => void;
  onApplyPreset: (presetId: string) => void;
  onApplyRestToAll?: (seconds: number | null) => void;
  onClearSets: () => void;
}) {
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const isRamp = parseRampSchemeInfo(item.setScheme) != null;
  const hasSets = item.prescribedSets.length > 0;
  // Zwinięcie chowa wiersze, nie kasuje danych — czyszczenie to osobna, jawna akcja.
  const [tableOpen, setTableOpen] = useState(hasSets || isRamp);
  const defaultRest = item.restBetweenSetsSeconds ?? exercise?.defaultRestBetweenSetsSeconds ?? null;

  return (
    <div className="space-y-3">
      {item.lastPrescriptionLabel ? (
        <p className="text-sm text-muted">
          {item.lastPrescriptionLabel}{" "}
          {exercise ? (
            <button
              type="button"
              onClick={() => onPatch(libraryDefaults(item, exercise))}
              className="font-medium text-foreground-secondary hover:text-foreground"
            >
              cofnij
            </button>
          ) : null}
        </p>
      ) : null}

      <SchemeModeSection item={item} onPatch={onPatch} />

      {hasSets ? (
        <p className="font-mono text-[13px] tabular-nums text-foreground-secondary">
          {compactSchemeLine(item, exercise)}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
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
            <Field label="Powtórzenia" hint="np. 8 albo 5-10">
              <RangeInput
                reps={item.reps}
                repsMax={item.repsMax}
                onChange={(next) => onPatch(next)}
                placeholder="8"
              />
            </Field>
          )}
          <Field
            label={isDumbbellPair(exercise ?? {}) ? "Ciężar (kg · na hantlę)" : "Ciężar (kg)"}
            hint={isDumbbellPair(exercise ?? {}) ? "Wpisz wagę jednej hantli — klient zobaczy 2×" : undefined}
          >
            <NumInput
              value={item.loadKg}
              min={0}
              step={0.5}
              onChange={(v) => onPatch({ loadKg: v })}
              placeholder="klient decyduje"
            />
          </Field>
        </div>
      )}

      <ItemDefaultsBar
        item={item}
        fallbackRestSeconds={exercise?.defaultRestBetweenSetsSeconds ?? null}
        onPatch={onPatch}
      />

      {tableOpen ? (
        <SetSchemeEditor
          sets={item.prescribedSets}
          weekNumber={weekNumber}
          open
          measureType={item.measureType}
          itemLoadKg={item.loadKg}
          defaultRestSeconds={defaultRest}
          onAdd={onAddSet}
          onInsert={onInsertSet}
          onPatch={onPatchSet}
          onRemove={onRemoveSet}
          onApplyPreset={onApplyPreset}
          onApplyRestToAll={onApplyRestToAll}
          onClear={onClearSets}
          onReplaceSets={(next) => onPatch({ prescribedSets: next, sets: next.length })}
        />
      ) : null}

      {!isRamp ? (
        <button
          type="button"
          onClick={() => setTableOpen((v) => !v)}
          className="text-sm font-medium text-foreground-secondary transition-colors hover:text-foreground"
        >
          {tableOpen ? "Zwiń serię po serii" : "Rozpisz serię po serii"}
        </button>
      ) : null}

      <div className="border-t border-border pt-3">
        <button
          type="button"
          onClick={() => setAdvancedOpen((v) => !v)}
          className="t-label text-muted-faint"
        >
          Zaawansowane {advancedOpen ? "▾" : "▸"}
        </button>
        {advancedOpen && (
          <div className="mt-3 grid grid-cols-2 gap-3">
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
            <Field label="Po ćwiczeniu (s)">
              <NumInput
                value={item.restAfterExerciseSeconds}
                min={0}
                onChange={(v) => onPatch({ restAfterExerciseSeconds: v })}
                placeholder="90"
              />
            </Field>
            <div className="col-span-2">
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
    </div>
  );
}
