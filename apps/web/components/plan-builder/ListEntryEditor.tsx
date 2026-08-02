"use client";

import { useState } from "react";
import { Exercise, ExerciseType, RIR_HELP, rirFromRpe } from "@/lib/api";
import { MEASURE_SHORT, measurePatch } from "@/lib/measure";
import { Field, Switch, inputClass } from "@/components/ui";
import { NumInput } from "./NumInput";
import { SetSchemeEditor } from "./SetSchemeEditor";
import {
  buildRampPrescribedSets,
  formatRampScheme,
  parseRampSchemeInfo,
  readRampBackoff,
} from "./listGroups";
import { BuilderItem, BuilderSet } from "./types";

const MEASURE_OPTS: ExerciseType[] = ["reps", "time", "distance"];

const RIR_OPTS = [
  { label: "0", value: 0 },
  { label: "1", value: 1 },
  { label: "2", value: 2 },
  { label: "3+", value: 3 },
] as const;

const RAMP_SHORTCUTS = [6, 4, 2, 1] as const;
const BO_PERCENT_CHIPS = [60, 70, 80, 90] as const;

const segOn =
  "rounded-[10px] border border-accent-border bg-accent-dim px-3 py-1.5 text-sm font-medium text-accent-strong";
const segOff =
  "rounded-[10px] border border-border-strong bg-surface-sunken px-3 py-1.5 text-sm font-medium text-foreground-secondary hover:bg-surface-hover";
const chipOn =
  "rounded-[10px] border border-accent-border bg-accent-dim px-2.5 py-1.5 font-mono text-xs font-semibold tabular-nums text-accent-strong";
const chipOff =
  "rounded-[10px] border border-border-strong bg-surface-sunken px-2.5 py-1.5 font-mono text-xs font-medium tabular-nums text-foreground-secondary hover:bg-surface-hover";

function applyRamp(
  onPatch: (patch: Partial<BuilderItem>) => void,
  opts: {
    targetRm: number;
    sets: number | null;
    backoff: ReturnType<typeof readRampBackoff>;
  }
) {
  const targetRm = Math.min(15, Math.max(1, Math.round(opts.targetRm)));
  if (opts.backoff.enabled) {
    const prescribedSets = buildRampPrescribedSets({
      targetRm,
      backoffCount: opts.backoff.count,
      backoffPercent: opts.backoff.percent,
      reps: opts.backoff.reps,
      repsMax: opts.backoff.repsMax,
    });
    onPatch({
      setScheme: formatRampScheme(targetRm, opts.backoff.percent),
      reps: null,
      repsMax: null,
      sets: prescribedSets.length,
      prescribedSets,
    });
  } else {
    onPatch({
      setScheme: formatRampScheme(targetRm),
      reps: null,
      repsMax: null,
      sets: opts.sets ?? 6,
      prescribedSets: [],
    });
  }
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
  const backoff = readRampBackoff(item);
  const [moreOpen, setMoreOpen] = useState(false);
  const [schemeOpen, setSchemeOpen] = useState(item.prescribedSets.length > 0 && !isRamp);

  const pickSets = () => {
    onPatch({ setScheme: null, prescribedSets: [] });
  };

  const pickRamp = (target = rampInfo?.targetRm ?? 6) => {
    setSchemeOpen(false);
    applyRamp(onPatch, {
      targetRm: target,
      sets: item.sets ?? 6,
      backoff: { ...backoff, enabled: backoff.enabled },
    });
  };

  const setRampTarget = (v: number | null) => {
    if (v == null || v < 1) return;
    applyRamp(onPatch, { targetRm: v, sets: item.sets, backoff });
  };

  const setBackoffEnabled = (enabled: boolean) => {
    applyRamp(onPatch, {
      targetRm: rampInfo?.targetRm ?? 6,
      sets: item.sets,
      backoff: { ...backoff, enabled, count: enabled ? Math.max(1, backoff.count) : backoff.count },
    });
  };

  const patchBackoff = (patch: Partial<ReturnType<typeof readRampBackoff>>) => {
    applyRamp(onPatch, {
      targetRm: rampInfo?.targetRm ?? 6,
      sets: item.sets,
      backoff: { ...backoff, enabled: true, ...patch },
    });
  };

  const rirActive = (v: number) => {
    if (item.targetRir == null) return false;
    if (v === 3) return item.targetRir >= 3;
    return item.targetRir === v;
  };

  return (
    <div
      className="flex flex-col gap-3.5 rounded-2xl border border-border-strong bg-surface p-4"
      onKeyDown={(e) => {
        // PlanBuilder owija widok w <form> zapisu — tu nie wolno zagnieżdżać kolejnego.
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
        <span className="mr-1 w-16 text-xs text-muted">Schemat</span>
        <button type="button" className={isRamp ? segOff : segOn} onClick={pickSets}>
          Serie × wartość
        </button>
        <button type="button" className={isRamp ? segOn : segOff} onClick={() => pickRamp()}>
          Rampa
        </button>
        {isRamp && (
          <>
            <span className="ml-2 text-xs text-muted">do</span>
            {RAMP_SHORTCUTS.map((t) => (
              <button
                key={t}
                type="button"
                className={rampInfo.targetRm === t ? chipOn : chipOff}
                onClick={() => pickRamp(t)}
              >
                {t}RM
              </button>
            ))}
          </>
        )}
      </div>

      {!isRamp && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 w-16 text-xs text-muted">Miara</span>
          {MEASURE_OPTS.map((m) => (
            <button
              key={m}
              type="button"
              className={item.measureType === m ? chipOn : chipOff}
              onClick={() => onPatch(measurePatch(m, exercise))}
            >
              {MEASURE_SHORT[m]}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <Field label="Serie">
          <NumInput
            value={item.sets}
            min={1}
            onChange={(v) => {
              if (isRamp && backoff.enabled) return;
              onPatch({ sets: v });
            }}
            placeholder="3"
          />
        </Field>
        {isRamp ? (
          <Field label="Cel rampy (xRM)">
            <NumInput
              value={rampInfo.targetRm}
              min={1}
              max={15}
              onChange={setRampTarget}
              placeholder="6"
            />
          </Field>
        ) : item.measureType === "time" ? (
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
          <Field label="Powtórzenia (od–do)">
            <div className="flex items-center gap-1.5">
              <NumInput value={item.reps} min={1} onChange={(v) => onPatch({ reps: v })} placeholder="8" />
              <span className="text-muted-faint">–</span>
              <NumInput value={item.repsMax} min={1} onChange={(v) => onPatch({ repsMax: v })} placeholder="—" />
            </div>
          </Field>
        )}
        <Field label="Tempo">
          <input
            className={inputClass}
            value={item.tempo ?? ""}
            onChange={(e) => onPatch({ tempo: e.target.value.toUpperCase().slice(0, 5) || null })}
            placeholder="3110"
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

      {isRamp && (
        <div className="rounded-xl border border-border bg-surface-sunken p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Switch label="Backoff (BO)" checked={backoff.enabled} onChange={setBackoffEnabled} />
            {backoff.enabled ? (
              <span className="font-mono text-xs tabular-nums text-muted">
                {formatRampScheme(rampInfo.targetRm, backoff.percent)}
              </span>
            ) : null}
          </div>
          {backoff.enabled && (
            <div className="mt-3 space-y-3">
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                <Field label="Liczba serii BO">
                  <NumInput
                    value={backoff.count}
                    min={1}
                    max={3}
                    onChange={(v) => patchBackoff({ count: v ?? 1 })}
                    placeholder="1"
                  />
                </Field>
                <Field label="Powtórzenia BO (od–do)">
                  <div className="flex items-center gap-1.5">
                    <NumInput
                      value={backoff.reps}
                      min={1}
                      onChange={(v) => patchBackoff({ reps: v })}
                      placeholder="5"
                    />
                    <span className="text-muted-faint">–</span>
                    <NumInput
                      value={backoff.repsMax}
                      min={1}
                      onChange={(v) => patchBackoff({ repsMax: v })}
                      placeholder="10"
                    />
                  </div>
                </Field>
                <Field label="% topu">
                  <NumInput
                    value={backoff.percent}
                    min={1}
                    max={100}
                    step={1}
                    onChange={(v) => patchBackoff({ percent: v ?? 80 })}
                    placeholder="80"
                  />
                </Field>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="mr-1 text-xs text-muted">Szybki %</span>
                {BO_PERCENT_CHIPS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    className={backoff.percent === p ? chipOn : chipOff}
                    onClick={() => patchBackoff({ percent: p })}
                  >
                    {p}%
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-1.5" title={RIR_HELP}>
        <span className="mr-1 w-16 text-xs text-muted">RIR</span>
        {RIR_OPTS.map((o) => (
          <button
            key={o.label}
            type="button"
            className={rirActive(o.value) ? chipOn : chipOff}
            onClick={() => onPatch({ targetRir: o.value })}
          >
            {o.label}
          </button>
        ))}
      </div>

      <div>
        <button
          type="button"
          onClick={() => setMoreOpen((v) => !v)}
          className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-muted-faint"
        >
          Więcej {moreOpen ? "▾" : "▸"}
        </button>
        {moreOpen && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              <Field label="Ciężar (kg)">
                <NumInput
                  value={item.loadKg}
                  min={0}
                  step={0.5}
                  onChange={(v) => onPatch({ loadKg: v, loadPercent: v != null ? null : item.loadPercent })}
                  placeholder="—"
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

            <div className="flex flex-wrap items-center gap-4">
              <Switch label="Rozgrzewka" checked={item.isWarmup} onChange={() => onToggleWarmup()} />
              {!isRamp && (
                <Switch
                  label="Rozpisz serie"
                  checked={schemeOpen}
                  onChange={(v) => {
                    setSchemeOpen(v);
                    if (!v) onClearSets();
                  }}
                />
              )}
            </div>

            {schemeOpen && !isRamp && (
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
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
        <button
          type="button"
          onClick={onMakeSuper}
          className="rounded-[10px] border border-dashed border-border-strong px-3 py-2 text-sm font-medium text-foreground-secondary transition-colors hover:border-accent-border hover:text-accent-strong"
        >
          + Superseria z tym → dodasz jako {superLabel}
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
