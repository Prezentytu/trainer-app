"use client";

import { useState } from "react";
import { Exercise, ExerciseType, RIR_HELP, rirFromRpe } from "@/lib/api";
import { MEASURE_SHORT, measurePatch } from "@/lib/measure";
import { Field, SegmentedControl, Switch, inputClass, inputNumericClass } from "@/components/ui";
import { isDumbbellPair } from "@/lib/weight";
import { NumInput } from "./NumInput";
import { SetSchemeEditor } from "./SetSchemeEditor";
import { SetRow, editorChipOff, editorChipOn } from "./SetRow";
import {
  BackoffRow,
  buildRampPrescribedSets,
  formatRampScheme,
  parseRampSchemeInfo,
  readRampBackoffs,
} from "./listGroups";
import { BuilderItem, BuilderSet, newKey } from "./types";

const MEASURE_OPTS: ExerciseType[] = ["reps", "time", "distance"];

const RIR_OPTS = [
  { label: "0", value: 0 },
  { label: "1", value: 1 },
  { label: "2", value: 2 },
  { label: "3+", value: 3 },
] as const;

const RAMP_SHORTCUTS = [6, 4, 2, 1] as const;
const BO_PERCENT_CHIPS = [60, 70, 80, 90] as const;
const DEFAULT_BO: BackoffRow = { reps: 5, repsMax: 10, percent: 80 };

function applyRamp(
  onPatch: (patch: Partial<BuilderItem>) => void,
  opts: {
    targetRm: number;
    sets: number | null;
    backoffs: BackoffRow[];
  }
) {
  const targetRm = Math.min(15, Math.max(1, Math.round(opts.targetRm)));
  if (opts.backoffs.length > 0) {
    const prescribedSets = buildRampPrescribedSets({
      targetRm,
      backoffs: opts.backoffs,
    });
    onPatch({
      setScheme: formatRampScheme(
        targetRm,
        opts.backoffs.map((b) => b.percent)
      ),
      reps: null,
      repsMax: null,
      sets: opts.sets,
      prescribedSets,
    });
  } else {
    onPatch({
      setScheme: formatRampScheme(targetRm),
      reps: null,
      repsMax: null,
      sets: opts.sets,
      prescribedSets: [],
    });
  }
}

function seedPrescribedSets(item: BuilderItem): BuilderSet[] {
  const n = Math.max(1, item.sets ?? 3);
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
    <Field label="Powtórzenia">
      <div className="flex items-center gap-1.5">
        <NumInput value={item.reps} min={1} onChange={(v) => onPatch({ reps: v })} placeholder="8" />
        <span className="text-muted-faint">–</span>
        <NumInput value={item.repsMax} min={1} onChange={(v) => onPatch({ repsMax: v })} placeholder="—" />
      </div>
    </Field>
  );
}

export function ListEntryEditor({
  item,
  weekNumber,
  exercise,
  superLabel,
  onCollapse,
  onPatch,
  onToggleWarmup,
  onMakeSuper,
  onDuplicate,
  onRemove,
  onAddSet,
  onPatchSet,
  onRemoveSet,
  onApplyPreset,
  onClearSets,
}: {
  item: BuilderItem;
  weekNumber: number;
  exercise?: Exercise;
  superLabel: string;
  onCollapse: () => void;
  onPatch: (patch: Partial<BuilderItem>) => void;
  onToggleWarmup: () => void;
  onMakeSuper: () => void;
  onDuplicate?: () => void;
  onRemove: () => void;
  onAddSet: () => void;
  onPatchSet: (setKey: string, patch: Partial<BuilderSet>) => void;
  onRemoveSet: (setKey: string) => void;
  onApplyPreset: (presetId: string) => void;
  onClearSets: () => void;
}) {
  const rampInfo = parseRampSchemeInfo(item.setScheme);
  const isRamp = rampInfo != null;
  const backoffs = readRampBackoffs(item);
  const backoffEnabled = backoffs.length > 0;
  const [moreOpen, setMoreOpen] = useState(false);
  const [schemeWanted, setSchemeWanted] = useState(!isRamp && item.prescribedSets.length > 0);
  const [boFocus, setBoFocus] = useState<number>(0);
  const schemeOpen = !isRamp && (schemeWanted || item.prescribedSets.length > 0);

  const pickSets = () => {
    setSchemeWanted(false);
    onPatch({ setScheme: null, prescribedSets: [] });
  };

  const pickRamp = (target = rampInfo?.targetRm ?? 6) => {
    setSchemeWanted(false);
    applyRamp(onPatch, {
      targetRm: target,
      sets: item.sets,
      backoffs,
    });
  };

  const setRampTarget = (v: number | null) => {
    if (v == null || v < 1) return;
    applyRamp(onPatch, { targetRm: v, sets: item.sets, backoffs });
  };

  const setBackoffEnabled = (enabled: boolean) => {
    applyRamp(onPatch, {
      targetRm: rampInfo?.targetRm ?? 6,
      sets: item.sets,
      backoffs: enabled ? (backoffs.length > 0 ? backoffs : [{ ...DEFAULT_BO }]) : [],
    });
  };

  const setBackoffs = (next: BackoffRow[]) => {
    applyRamp(onPatch, {
      targetRm: rampInfo?.targetRm ?? 6,
      sets: item.sets,
      backoffs: next,
    });
  };

  const patchBackoffRow = (index: number, patch: Partial<BackoffRow>) => {
    setBackoffs(backoffs.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  };

  const addBackoffRow = () => {
    const last = backoffs[backoffs.length - 1] ?? DEFAULT_BO;
    setBackoffs([...backoffs, { ...last }]);
  };

  const removeBackoffRow = (index: number) => {
    setBackoffs(backoffs.filter((_, i) => i !== index));
  };

  const openScheme = () => {
    setSchemeWanted(true);
    if (item.prescribedSets.length > 0) return;
    onPatch({ prescribedSets: seedPrescribedSets(item) });
  };

  const closeScheme = () => {
    setSchemeWanted(false);
    onClearSets();
  };

  const rirActive = (v: number) => {
    if (item.targetRir == null) return false;
    if (v === 3) return item.targetRir >= 3;
    return item.targetRir === v;
  };

  const focusedBo = backoffs[boFocus] ?? backoffs[backoffs.length - 1];

  return (
    <div
      className="flex flex-col gap-3.5 rounded-2xl border border-border-strong bg-surface p-4"
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.preventDefault();
          onCollapse();
          return;
        }
        if (e.key !== "Enter" || e.shiftKey || e.nativeEvent.isComposing) return;
        const target = e.target as HTMLElement;
        if (target.tagName !== "INPUT" && target.tagName !== "TEXTAREA") return;
        e.preventDefault();
        onCollapse();
      }}
    >
      <div className="flex flex-wrap items-center gap-1.5">
        <SegmentedControl
          items={[
            { value: "sets", label: "Serie × wartość" },
            { value: "ramp", label: "Rampa" },
          ]}
          value={isRamp ? "ramp" : "sets"}
          onChange={(v) => (v === "ramp" ? pickRamp() : pickSets())}
        />
        {isRamp && (
          <>
            <span className="ml-1 text-xs text-muted">do</span>
            {RAMP_SHORTCUTS.map((t) => (
              <button
                key={t}
                type="button"
                className={rampInfo.targetRm === t ? editorChipOn : editorChipOff}
                onClick={() => pickRamp(t)}
              >
                {t}RM
              </button>
            ))}
          </>
        )}
      </div>

      {isRamp ? (
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          <Field label="Cel rampy (xRM)">
            <NumInput
              value={rampInfo.targetRm}
              min={1}
              max={15}
              onChange={setRampTarget}
              placeholder="6"
            />
          </Field>
          <Field label="Serie" hint="opcjonalnie">
            <NumInput
              value={item.sets}
              min={1}
              onChange={(v) => onPatch({ sets: v })}
              placeholder="—"
            />
          </Field>
          <Field label="Ciężar (kg)">
            <div className={`${inputNumericClass} flex items-center justify-center text-muted-faint`}>—</div>
          </Field>
          <Field label="Przerwa (s)">
            <NumInput
              value={item.restBetweenSetsSeconds}
              min={0}
              onChange={(v) => onPatch({ restBetweenSetsSeconds: v })}
              placeholder="60"
            />
          </Field>
        </div>
      ) : schemeOpen ? (
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          <div className="hidden sm:block" />
          <div className="hidden sm:block" />
          <div className="hidden sm:block" />
          <Field label="Przerwa (s)">
            <NumInput
              value={item.restBetweenSetsSeconds}
              min={0}
              onChange={(v) => onPatch({ restBetweenSetsSeconds: v })}
              placeholder="60"
            />
          </Field>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
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
          <Field label="Przerwa (s)">
            <NumInput
              value={item.restBetweenSetsSeconds}
              min={0}
              onChange={(v) => onPatch({ restBetweenSetsSeconds: v })}
              placeholder="60"
            />
          </Field>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-1.5" title={RIR_HELP}>
        <span className="t-label mr-1 text-muted">RIR</span>
        {RIR_OPTS.map((o) => (
          <button
            key={o.label}
            type="button"
            className={rirActive(o.value) ? editorChipOn : editorChipOff}
            onClick={() => onPatch({ targetRir: o.value })}
          >
            {o.label}
          </button>
        ))}
      </div>

      {isRamp && (
        <div className="border-t border-border pt-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Switch label="Backoff (BO)" checked={backoffEnabled} onChange={setBackoffEnabled} />
            {backoffEnabled ? (
              <span className="font-mono text-xs tabular-nums text-muted">
                {formatRampScheme(
                  rampInfo.targetRm,
                  backoffs.map((b) => b.percent)
                )}
              </span>
            ) : null}
          </div>
          {backoffEnabled && (
            <div className="mt-1">
              {backoffs.map((row, index) => (
                <SetRow
                  key={`bo-${index}`}
                  label={`BO ${index + 1}`}
                  reps={row.reps}
                  repsMax={row.repsMax}
                  loadKg={null}
                  loadPercent={row.percent}
                  loadKind="percent"
                  onReps={(v) => patchBackoffRow(index, { reps: v })}
                  onRepsMax={(v) => patchBackoffRow(index, { repsMax: v })}
                  onLoadKg={() => undefined}
                  onLoadPercent={(v) => patchBackoffRow(index, { percent: v ?? 80 })}
                  onRemove={() => removeBackoffRow(index)}
                  onLoadFocus={() => setBoFocus(index)}
                  removeTitle="Usuń serię BO"
                />
              ))}
              {focusedBo ? (
                <div className="flex flex-wrap items-center gap-1.5 pt-2">
                  {BO_PERCENT_CHIPS.map((p) => (
                    <button
                      key={p}
                      type="button"
                      className={focusedBo.percent === p ? editorChipOn : editorChipOff}
                      onClick={() => patchBackoffRow(Math.min(boFocus, backoffs.length - 1), { percent: p })}
                    >
                      {p}%
                    </button>
                  ))}
                </div>
              ) : null}
              <button
                type="button"
                onClick={addBackoffRow}
                className="mt-2 text-sm font-medium text-foreground-secondary hover:text-foreground"
              >
                + Seria BO
              </button>
            </div>
          )}
        </div>
      )}

      {schemeOpen && (
        <div className="border-t border-border pt-3">
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
        </div>
      )}

      {!isRamp && (
        <div>
          {schemeOpen ? (
            <button
              type="button"
              onClick={closeScheme}
              className="text-sm font-medium text-muted hover:text-foreground-secondary"
            >
              Zwiń rozpis
            </button>
          ) : (
            <button
              type="button"
              onClick={openScheme}
              className="text-sm font-medium text-foreground-secondary hover:text-foreground"
            >
              Rozpisz serie
            </button>
          )}
        </div>
      )}

      <div>
        <button
          type="button"
          onClick={() => setMoreOpen((v) => !v)}
          className="t-label text-muted-faint"
        >
          Więcej {moreOpen ? "▾" : "▸"}
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
              <Field label="Tempo">
                <input
                  className={inputClass}
                  value={item.tempo ?? ""}
                  onChange={(e) => onPatch({ tempo: e.target.value.toUpperCase().slice(0, 5) || null })}
                  placeholder="3110"
                />
              </Field>
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
              <Field label="Po ćwiczeniu (s)">
                <NumInput
                  value={item.restAfterExerciseSeconds}
                  min={0}
                  onChange={(v) => onPatch({ restAfterExerciseSeconds: v })}
                  placeholder="90"
                />
              </Field>
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

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
        <button
          type="button"
          onClick={onMakeSuper}
          className="text-sm font-medium text-muted transition-colors hover:text-foreground-secondary"
        >
          + Superseria → {superLabel}
        </button>
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
  );
}
