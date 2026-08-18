"use client";

import { useRef, useState } from "react";
import { Exercise, RIR_HELP, rirFromRpe } from "@/lib/api";
import { editorChipOff, editorChipOn } from "./editorChips";
import { Field, Switch, inputClass } from "@/components/ui";
import { isDumbbellPair } from "@/lib/weight";
import { polishSetCount } from "@/lib/plural";
import { NumInput } from "./NumInput";
import { RampControls } from "./RampControls";
import { SetSchemeEditor } from "./SetSchemeEditor";
import {
  BackoffRow,
  buildRampPrescribedSets,
  formatRampScheme,
  parseRampSchemeInfo,
  readRampBackoffs,
} from "./listGroups";
import { libraryDefaults } from "./lastPrescription";
import { BuilderItem, BuilderSet } from "./types";

/** Pola edycji pozycji planu — bez ramki/nagłówka (żyją w SidePanel). */
export function ExerciseEditor({
  item,
  weekNumber,
  exercise,
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
  onPatch: (patch: Partial<BuilderItem>) => void;
  onAddSet: () => void;
  onPatchSet: (setKey: string, patch: Partial<BuilderSet>) => void;
  onRemoveSet: (setKey: string) => void;
  onApplyPreset: (presetId: string) => void;
  onClearSets: () => void;
}) {
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const setsSnapshot = useRef<BuilderSet[] | null>(null);
  const rampInfo = parseRampSchemeInfo(item.setScheme);
  const isRamp = rampInfo != null;
  const backoffs = readRampBackoffs(item);
  const [schemeOpen, setSchemeOpen] = useState(isRamp || item.prescribedSets.length > 0);
  const tableOpen = isRamp || schemeOpen || item.prescribedSets.length > 0;

  const pickRamp = () => {
    const targetRm = rampInfo?.targetRm ?? 6;
    if (item.prescribedSets.length > 0) setsSnapshot.current = item.prescribedSets;
    onPatch({
      setScheme: formatRampScheme(targetRm, backoffs.length > 0 ? backoffs.map((b) => b.percent) : null),
      reps: null,
      repsMax: null,
      loadKg: item.loadKg,
      prescribedSets: [],
    });
    setSchemeOpen(true);
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
      topKg: item.loadKg,
      backoffs: rows,
    });
    onPatch({
      setScheme: scheme,
      prescribedSets: [...withoutBo, ...generated.filter((s) => s.role === "backoff")].map((s, i) => ({
        ...s,
        order: i + 1,
      })),
    });
  };

  const pickSets = () => {
    onPatch({
      setScheme: null,
      prescribedSets: setsSnapshot.current ?? item.prescribedSets,
    });
  };

  const setTopKg = (v: number | null) => {
    onPatch({
      loadKg: v,
      prescribedSets: item.prescribedSets.map((s) =>
        s.role === "top" ? { ...s, loadKg: v, loadPercent: null, percentOf: null } : s,
      ),
    });
  };

  const setRampTarget = (v: number) => {
    const next = item.prescribedSets.map((s) =>
      s.role === "top" || s.role === "ramp" ? { ...s, reps: v } : s,
    );
    onPatch({
      setScheme: formatRampScheme(v, backoffs.length > 0 ? backoffs.map((b) => b.percent) : null),
      prescribedSets: next,
    });
  };

  const summaryFromSets = (() => {
    if (item.prescribedSets.length === 0) return null;
    const reps = item.prescribedSets.map((s) => s.reps).filter((r): r is number => r != null);
    const loads = item.prescribedSets
      .map((s) => s.loadKg)
      .filter((k): k is number => k != null);
    const parts = [polishSetCount(item.prescribedSets.length)];
    if (reps.length) parts.push(`${Math.min(...reps)}${reps.length > 1 ? `–${Math.max(...reps)}` : ""}`);
    if (loads.length) parts.push(`${Math.max(...loads)} kg`);
    return parts.join(" · ");
  })();

  const rirActive = (v: number) => {
    if (item.targetRir == null) return false;
    if (v === 3) return item.targetRir >= 3;
    return item.targetRir === v;
  };

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
      <RampControls
        mode={isRamp ? "ramp" : "sets"}
        targetRm={rampInfo?.targetRm ?? 6}
        topKg={item.prescribedSets.find((s) => s.role === "top")?.loadKg ?? item.loadKg}
        backoffs={backoffs}
        showSetsCount={false}
        showRest={false}
        onModeChange={(mode) => (mode === "ramp" ? pickRamp() : pickSets())}
        onTargetRm={setRampTarget}
        onTopKg={setTopKg}
        onBackoffsChange={setBackoffs}
      />
      {isRamp ? (
        <button
          type="button"
          onClick={() => {
            const generated = buildRampPrescribedSets({
              targetRm: rampInfo?.targetRm ?? 6,
              topKg: item.loadKg,
              backoffs,
            });
            onPatch({
              setScheme: formatRampScheme(
                rampInfo?.targetRm ?? 6,
                backoffs.length > 0 ? backoffs.map((b) => b.percent) : null,
              ),
              prescribedSets: generated,
              sets: generated.length,
            });
          }}
          className="text-sm font-medium text-foreground-secondary hover:text-foreground"
        >
          Rozpisz serie rampy
        </button>
      ) : null}

      {tableOpen && summaryFromSets ? (
        <p className="text-sm text-foreground-secondary">{summaryFromSets}</p>
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
          <Field label="Powtórzenia">
            <div className="flex items-center gap-1">
              <NumInput value={item.reps} min={1} onChange={(v) => onPatch({ reps: v })} placeholder="8" />
              <span className="text-muted-faint">–</span>
              <NumInput value={item.repsMax} min={1} onChange={(v) => onPatch({ repsMax: v })} placeholder="12" />
            </div>
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

      <div className="flex flex-wrap items-center gap-1.5" title={RIR_HELP}>
        <span className="t-label mr-1 text-muted">RIR</span>
        {([
          { label: "0", value: 0 },
          { label: "1", value: 1 },
          { label: "2", value: 2 },
          { label: "3+", value: 3 },
        ] as const).map((o) => (
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

      <div>
        <button
          type="button"
          onClick={() => setAdvancedOpen((v) => !v)}
          className="mb-2 font-mono text-xs font-semibold uppercase tracking-[0.08em] text-muted-faint"
        >
          Zaawansowane {advancedOpen ? "▾" : "▸"}
        </button>
        {advancedOpen && (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Tempo">
              <input
                className={inputClass}
                value={item.tempo ?? ""}
                onChange={(e) => onPatch({ tempo: e.target.value || null })}
                placeholder="3110"
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

      {!isRamp ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[10px] border border-border bg-surface-sunken px-3.5 py-3">
          <Switch
            label="Rozpisz serie"
            checked={tableOpen}
            onChange={(v) => {
              setSchemeOpen(v);
              if (!v) onClearSets();
            }}
          />
          {tableOpen ? (
            <span className="font-mono text-xs tabular-nums text-muted">
              {polishSetCount(item.prescribedSets.length || item.sets || 0)}
            </span>
          ) : null}
        </div>
      ) : null}

      {tableOpen ? (
        <div className="min-w-0 overflow-x-auto">
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
        </div>
      ) : null}
    </div>
  );
}
