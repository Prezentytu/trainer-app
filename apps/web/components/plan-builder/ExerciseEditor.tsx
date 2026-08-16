"use client";

import { useState } from "react";
import { Exercise, RIR_HELP, rirFromRpe } from "@/lib/api";
import { Field, Switch, inputClass } from "@/components/ui";
import { isDumbbellPair } from "@/lib/weight";
import { polishSetCount } from "@/lib/plural";
import { NumInput } from "./NumInput";
import { RampControls } from "./RampControls";
import { SetSchemeEditor } from "./SetSchemeEditor";
import {
  buildRampPrescribedSets,
  formatRampScheme,
  mergeRampRoles,
  parseRampSchemeInfo,
  readRampBackoffs,
} from "./listGroups";
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
  const rampInfo = parseRampSchemeInfo(item.setScheme);
  const isRamp = rampInfo != null;
  const backoffs = readRampBackoffs(item);
  const [schemeOpen, setSchemeOpen] = useState(isRamp || item.prescribedSets.length > 0);
  const tableOpen = isRamp || schemeOpen || item.prescribedSets.length > 0;

  const pickRamp = () => {
    const targetRm = rampInfo?.targetRm ?? 6;
    const generated = buildRampPrescribedSets({
      targetRm,
      topKg: item.loadKg,
      backoffs,
    });
    onPatch({
      setScheme: formatRampScheme(targetRm, backoffs.map((b) => b.percent)),
      reps: null,
      repsMax: null,
      loadKg: item.loadKg,
      prescribedSets: mergeRampRoles(item.prescribedSets, generated),
    });
    setSchemeOpen(true);
  };

  const pickSets = () => {
    onPatch({ setScheme: null });
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
      setScheme: formatRampScheme(v, backoffs.map((b) => b.percent)),
      prescribedSets: next.length > 0 ? next : buildRampPrescribedSets({ targetRm: v, topKg: item.loadKg, backoffs }),
    });
  };

  const summaryFromSets = (() => {
    if (item.prescribedSets.length === 0) return null;
    const reps = item.prescribedSets.map((s) => s.reps).filter((r): r is number => r != null);
    const loads = item.prescribedSets
      .map((s) => s.loadKg)
      .filter((k): k is number => k != null);
    const repPart = reps.length ? `${Math.min(...reps)}${reps.length > 1 ? `–${Math.max(...reps)}` : ""}` : "—";
    const loadPart = loads.length ? `${Math.max(...loads)} kg` : "—";
    return `${polishSetCount(item.prescribedSets.length)} · ${repPart} · ${loadPart}`;
  })();

  return (
    <div className="space-y-4">
      <RampControls
        mode={isRamp ? "ramp" : "sets"}
        targetRm={rampInfo?.targetRm ?? 6}
        topKg={item.prescribedSets.find((s) => s.role === "top")?.loadKg ?? item.loadKg}
        backoffEnabled={backoffs.length > 0}
        showSetsCount={false}
        showRest={false}
        onModeChange={(mode) => (mode === "ramp" ? pickRamp() : pickSets())}
        onTargetRm={setRampTarget}
        onTopKg={setTopKg}
        onBackoffEnabled={(enabled) => {
          if (!enabled) {
            onPatch({
              setScheme: formatRampScheme(rampInfo?.targetRm ?? 6),
              prescribedSets: item.prescribedSets.filter((s) => s.role !== "backoff"),
            });
            return;
          }
          const generated = buildRampPrescribedSets({
            targetRm: rampInfo?.targetRm ?? 6,
            topKg: item.loadKg,
            backoffs: [{ reps: 5, repsMax: 10, percent: 80 }],
          });
          onPatch({
            setScheme: formatRampScheme(rampInfo?.targetRm ?? 6, [80]),
            prescribedSets: mergeRampRoles(item.prescribedSets, generated),
          });
        }}
      />

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
