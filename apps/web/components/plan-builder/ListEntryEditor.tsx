"use client";

import { useState } from "react";
import { Exercise, ExerciseType, rirFromRpe } from "@/lib/api";
import { splitExerciseName } from "@/lib/exerciseName";
import { MEASURE_SHORT, measurePatch } from "@/lib/measure";
import { Field, Switch, inputClass } from "@/components/ui";
import { isDumbbellPair } from "@/lib/weight";
import { compactSchemeLine } from "@/lib/schemeSummary";
import { NumInput } from "./NumInput";
import { RangeInput } from "./RangeInput";
import { ItemDefaultsBar } from "./ItemDefaultsBar";
import { SchemeModeSection } from "./SchemeModeSection";
import { SetSchemeEditor } from "./SetSchemeEditor";
import { editorChipOff, editorChipOn } from "./editorChips";
import { parseRampSchemeInfo } from "./listGroups";
import { BuilderItem, BuilderSet, newKey } from "./types";

const MEASURE_OPTS: ExerciseType[] = ["reps", "time", "distance"];

export type EditorPartner = {
  label: string;
  name: string;
  summary: string;
  setCount: number;
};

function seedPrescribedSets(item: BuilderItem, count?: number): BuilderSet[] {
  const n = Math.max(1, count ?? item.sets ?? 3);
  return Array.from({ length: n }, (_, i) => ({
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
}

function measureSlot(item: BuilderItem, onPatch: (patch: Partial<BuilderItem>) => void) {
  if (item.measureType === "time") {
    return (
      <Field label="Czas powt. (s)">
        <NumInput
          value={item.repDurationSeconds}
          min={1}
          onChange={(v) => onPatch({ repDurationSeconds: v })}
          placeholder="dom."
        />
      </Field>
    );
  }
  if (item.measureType === "distance") {
    return (
      <Field label="Dystans (m)">
        <NumInput
          value={item.distanceMeters}
          min={1}
          onChange={(v) => onPatch({ distanceMeters: v })}
          placeholder="dom."
        />
      </Field>
    );
  }
  return (
    <Field label="Powtórzenia" hint="np. 8 albo 5-10">
      <RangeInput
        reps={item.reps}
        repsMax={item.repsMax}
        onChange={(next) => onPatch(next)}
        placeholder="8"
      />
    </Field>
  );
}

export function ListEntryEditor({
  item,
  weekNumber,
  exercise,
  superLabel,
  inSuperset = false,
  partners = [],
  lastPrescriptionLabel,
  onUndoLastPrescription,
  onCollapse,
  onPatch,
  onToggleWarmup,
  onMakeSuper,
  onUnlink,
  onMove,
  onSwap,
  onDuplicate,
  onRemove,
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
  superLabel: string;
  inSuperset?: boolean;
  partners?: EditorPartner[];
  lastPrescriptionLabel?: string | null;
  onUndoLastPrescription?: () => void;
  onCollapse: () => void;
  onPatch: (patch: Partial<BuilderItem>) => void;
  onToggleWarmup: () => void;
  onMakeSuper: () => void;
  onUnlink?: () => void;
  onMove?: (dir: -1 | 1) => void;
  onSwap?: () => void;
  onDuplicate?: () => void;
  onRemove: () => void;
  onAddSet: () => void;
  onInsertSet?: (index: number, side: "before" | "after") => string | void;
  onPatchSet: (setKey: string, patch: Partial<BuilderSet>) => void;
  onRemoveSet: (setKey: string) => void;
  onApplyPreset: (presetId: string) => void;
  onApplyRestToAll?: (seconds: number | null) => void;
  onClearSets: () => void;
}) {
  const isRamp = parseRampSchemeInfo(item.setScheme) != null;
  const hasSets = item.prescribedSets.length > 0;
  const [moreOpen, setMoreOpen] = useState(false);
  // Zwinięcie chowa wiersze i nic nie kasuje — czyszczenie to osobna akcja z Cofnij.
  const [tableOpen, setTableOpen] = useState(hasSets || isRamp);
  const defaultRest = item.restBetweenSetsSeconds ?? exercise?.defaultRestBetweenSetsSeconds ?? null;

  const equalizeTo = (count: number) => {
    if (count <= 0) return;
    let next = [...item.prescribedSets];
    if (next.length === 0) {
      next = seedPrescribedSets(item, count);
    } else if (next.length < count) {
      const last = next[next.length - 1];
      while (next.length < count) {
        next.push({ ...last, key: newKey(), order: next.length + 1, note: null });
      }
    } else {
      next = next.slice(0, count).map((s, i) => ({ ...s, order: i + 1 }));
    }
    onPatch({ prescribedSets: next, sets: next.length });
  };

  return (
    <div
      className="flex flex-col gap-3 rounded-2xl border border-border-strong bg-surface p-3"
      onKeyDown={(e) => {
        if (e.key !== "Escape") return;
        e.preventDefault();
        onCollapse();
      }}
    >
      <div className="space-y-2.5 border-b border-border pb-3">
        <SchemeModeSection item={item} onPatch={onPatch} />

        {lastPrescriptionLabel && onUndoLastPrescription ? (
          <p className="text-sm text-muted">
            {lastPrescriptionLabel}{" "}
            <button
              type="button"
              onClick={onUndoLastPrescription}
              className="font-medium text-foreground-secondary hover:text-foreground"
            >
              cofnij
            </button>
          </p>
        ) : null}

        {partners.length > 0 ? (
          <div className="space-y-1">
            {partners.map((p) => (
              <div key={p.label} className="flex flex-wrap items-center gap-2 text-sm text-muted">
                <span>
                  {p.label} {splitExerciseName(p.name).primary} — {p.summary}
                </span>
                {p.setCount > 0 && p.setCount !== (item.prescribedSets.length || item.sets || 0) ? (
                  <button
                    type="button"
                    onClick={() => equalizeTo(p.setCount)}
                    className="font-medium text-foreground-secondary hover:text-foreground"
                  >
                    wyrównaj serie
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        ) : null}

        {hasSets ? (
          <p className="font-mono text-[13px] tabular-nums text-foreground-secondary">
            {compactSchemeLine(item, exercise)}
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            <Field label="Serie">
              <NumInput
                value={item.sets}
                min={1}
                onChange={(v) => onPatch({ sets: v })}
                placeholder="3"
              />
            </Field>
            {measureSlot(item, onPatch)}
            <Field label={isDumbbellPair(exercise ?? {}) ? "Ciężar (kg · hantla)" : "Ciężar (kg)"}>
              <NumInput
                value={item.loadKg}
                min={0}
                step={0.5}
                onChange={(v) => onPatch({ loadKg: v, loadPercent: v != null ? null : item.loadPercent })}
                placeholder="—"
              />
            </Field>
          </div>
        )}

        <ItemDefaultsBar
          item={item}
          fallbackRestSeconds={exercise?.defaultRestBetweenSetsSeconds ?? null}
          onPatch={onPatch}
        />
      </div>

      <div className="space-y-2.5">
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
            onClick={() => {
              if (!tableOpen && !hasSets) onPatch({ prescribedSets: seedPrescribedSets(item) });
              setTableOpen((v) => !v);
            }}
            className="text-sm font-medium text-foreground-secondary transition-colors hover:text-foreground"
          >
            {tableOpen ? "Zwiń serię po serii" : "Rozpisz serię po serii"}
          </button>
        ) : null}
      </div>

      <div className="border-t border-border pt-3">
        <button
          type="button"
          onClick={() => setMoreOpen((v) => !v)}
          className="t-label text-muted-faint"
        >
          Zaawansowane {moreOpen ? "▾" : "▸"}
        </button>
        {moreOpen && (
          <div className="mt-3 space-y-3">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="t-label mr-1 text-muted">Miara</span>
              {MEASURE_OPTS.map((m) => (
                <button
                  key={m}
                  type="button"
                  className={item.measureType === m ? editorChipOn : editorChipOff}
                  onClick={() => onPatch(measurePatch(m, exercise))}
                >
                  {MEASURE_SHORT[m]}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              <Field label="% 1RM">
                <NumInput
                  value={item.loadPercent}
                  min={1}
                  step={1}
                  onChange={(v) => onPatch({ loadPercent: v, loadKg: v != null ? null : item.loadKg })}
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
              {!inSuperset ? (
                <Field label="Po ćwiczeniu (s)">
                  <NumInput
                    value={item.restAfterExerciseSeconds}
                    min={0}
                    onChange={(v) => onPatch({ restAfterExerciseSeconds: v })}
                    placeholder="90"
                  />
                </Field>
              ) : null}
              <div className="col-span-2 sm:col-span-3">
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
            <Switch label="Rozgrzewka" checked={item.isWarmup} onChange={() => onToggleWarmup()} />
          </div>
        )}
      </div>

      <div className="space-y-2 border-t border-border pt-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onMakeSuper}
              className="text-sm font-medium text-muted transition-colors hover:text-foreground-secondary"
            >
              + Superseria → {superLabel}
            </button>
            {onUnlink ? (
              <button
                type="button"
                onClick={onUnlink}
                className="text-sm font-medium text-muted transition-colors hover:text-foreground-secondary"
              >
                Rozłącz
              </button>
            ) : null}
            {onMove ? (
              <>
                <button
                  type="button"
                  onClick={() => onMove(-1)}
                  className="text-sm font-medium text-muted transition-colors hover:text-foreground-secondary"
                >
                  Wyżej
                </button>
                <button
                  type="button"
                  onClick={() => onMove(1)}
                  className="text-sm font-medium text-muted transition-colors hover:text-foreground-secondary"
                >
                  Niżej
                </button>
              </>
            ) : null}
            {onSwap ? (
              <button
                type="button"
                onClick={onSwap}
                className="text-sm font-medium text-muted transition-colors hover:text-foreground-secondary"
              >
                Zamień ćwiczenie
              </button>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-1">
            {onDuplicate ? (
              <button
                type="button"
                onClick={onDuplicate}
                className="rounded-[10px] px-3 py-2 text-sm font-medium text-muted transition-colors hover:text-foreground-secondary"
              >
                Duplikuj
              </button>
            ) : null}
            <button
              type="button"
              onClick={onRemove}
              className="rounded-[10px] px-3 py-2 text-sm font-medium text-muted transition-colors hover:text-danger-hover"
            >
              Usuń ćwiczenie
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
