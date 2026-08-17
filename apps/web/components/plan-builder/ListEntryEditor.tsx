"use client";

import { useState } from "react";
import { Exercise, ExerciseType, RIR_HELP, rirFromRpe } from "@/lib/api";
import { MEASURE_SHORT, measurePatch } from "@/lib/measure";
import { Field, Switch, inputClass } from "@/components/ui";
import { isDumbbellPair } from "@/lib/weight";
import { NumInput } from "./NumInput";
import { RampControls } from "./RampControls";
import { SetSchemeEditor } from "./SetSchemeEditor";
import { editorChipOff, editorChipOn } from "./editorChips";
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

export type EditorPartner = {
  label: string;
  name: string;
  summary: string;
  setCount: number;
};

function topKgOf(item: BuilderItem): number | null {
  return item.prescribedSets.find((s) => s.role === "top")?.loadKg ?? item.loadKg;
}

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
  inSuperset = false,
  partners = [],
  lastPrescriptionLabel,
  onUndoLastPrescription,
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
  inSuperset?: boolean;
  partners?: EditorPartner[];
  lastPrescriptionLabel?: string | null;
  onUndoLastPrescription?: () => void;
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
  const [moreOpen, setMoreOpen] = useState(false);
  const [schemeWanted, setSchemeWanted] = useState(item.prescribedSets.length > 0);
  const schemeOpen = isRamp || schemeWanted || item.prescribedSets.length > 0;

  const pickSets = () => {
    setSchemeWanted(item.prescribedSets.length > 0);
    onPatch({ setScheme: null });
  };

  const pickRamp = (target = rampInfo?.targetRm ?? 6) => {
    onPatch({
      setScheme: formatRampScheme(
        target,
        backoffs.length > 0 ? backoffs.map((b) => b.percent) : null,
      ),
      reps: null,
      repsMax: null,
      prescribedSets: [],
    });
  };

  const setRampTarget = (v: number) => {
    const scheme = formatRampScheme(
      v,
      backoffs.length > 0 ? backoffs.map((b) => b.percent) : null,
    );
    if (item.prescribedSets.length === 0) {
      onPatch({ setScheme: scheme, reps: null, repsMax: null });
      return;
    }
    const next = item.prescribedSets.map((s) =>
      s.role === "top" || s.role === "ramp" ? { ...s, reps: v } : s,
    );
    onPatch({ setScheme: scheme, reps: null, repsMax: null, prescribedSets: next });
  };

  const setTopKg = (v: number | null) => {
    const next = item.prescribedSets.map((s) =>
      s.role === "top" ? { ...s, loadKg: v, loadPercent: null, percentOf: null } : s,
    );
    onPatch({ loadKg: v, prescribedSets: next });
  };

  const setBackoffs = (rows: BackoffRow[]) => {
    const scheme = formatRampScheme(
      rampInfo?.targetRm ?? 6,
      rows.length > 0 ? rows.map((b) => b.percent) : null,
    );
    if (item.prescribedSets.length === 0) {
      onPatch({ setScheme: scheme });
      return;
    }
    const withoutBo = item.prescribedSets.filter((s) => s.role !== "backoff");
    const generated = buildRampPrescribedSets({
      targetRm: rampInfo?.targetRm ?? 6,
      topKg: topKgOf(item),
      backoffs: rows,
    });
    const next = [...withoutBo, ...generated.filter((s) => s.role === "backoff")].map((s, i) => ({
      ...s,
      order: i + 1,
    }));
    onPatch({ setScheme: scheme, prescribedSets: next });
  };

  const fillRamp = () => {
    const generated = buildRampPrescribedSets({
      targetRm: rampInfo?.targetRm ?? 6,
      topKg: topKgOf(item),
      backoffs,
    });
    onPatch({
      setScheme: formatRampScheme(
        rampInfo?.targetRm ?? 6,
        backoffs.length > 0 ? backoffs.map((b) => b.percent) : null,
      ),
      reps: null,
      repsMax: null,
      sets: generated.length,
      loadKg: topKgOf(item),
      prescribedSets: generated,
    });
    setSchemeWanted(true);
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

  const rirActive = (v: number) => {
    if (item.targetRir == null) return false;
    if (v === 3) return item.targetRir >= 3;
    return item.targetRir === v;
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
        <p className="t-label text-muted">Ćwiczenie</p>
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

        <RampControls
          mode={isRamp ? "ramp" : "sets"}
          targetRm={rampInfo?.targetRm ?? 6}
          topKg={topKgOf(item)}
          setsCount={item.sets}
          restSeconds={item.restBetweenSetsSeconds}
          restLabel="Przerwa (s)"
          backoffs={backoffs}
          showRest={!inSuperset}
          onModeChange={(mode) => (mode === "ramp" ? pickRamp() : pickSets())}
          onTargetRm={setRampTarget}
          onTopKg={setTopKg}
          onSetsCount={(v) => onPatch({ sets: v })}
          onRest={(v) => onPatch({ restBetweenSetsSeconds: v })}
          onBackoffsChange={setBackoffs}
        />

        {isRamp ? (
          <button
            type="button"
            onClick={fillRamp}
            className="text-sm font-medium text-foreground-secondary hover:text-foreground"
          >
            Rozpisz rozbieg
          </button>
        ) : null}

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
                  {p.label} {p.name} — {p.summary}
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

        {isRamp ? null : schemeOpen ? null : (
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
            {!inSuperset ? (
              <Field label="Przerwa (s)">
                <NumInput
                  value={item.restBetweenSetsSeconds}
                  min={0}
                  onChange={(v) => onPatch({ restBetweenSetsSeconds: v })}
                  placeholder="60"
                />
              </Field>
            ) : null}
          </div>
        )}
      </div>

      <div className="space-y-2.5">
        <p className="t-label text-muted">Serie</p>
        {schemeOpen && (
          <SetSchemeEditor
            sets={item.prescribedSets}
            weekNumber={weekNumber}
            open
            measureType={item.measureType}
            itemLoadKg={item.loadKg}
            onAdd={onAddSet}
            onPatch={onPatchSet}
            onRemove={onRemoveSet}
            onApplyPreset={onApplyPreset}
            onClear={onClearSets}
            onReplaceSets={(next) => onPatch({ prescribedSets: next, sets: next.length })}
          />
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
        <p className="t-label text-muted">Akcje</p>
        <div className="flex flex-wrap items-center justify-between gap-2">
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
    </div>
  );
}
