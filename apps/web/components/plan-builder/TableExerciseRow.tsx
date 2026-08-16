"use client";

import { Exercise, rirFromRpe } from "@/lib/api";
import { ExerciseThumb } from "@/components/ExerciseThumb";
import { Badge, IconButton, inputClass } from "@/components/ui";
import { isDumbbellPair } from "@/lib/weight";
import { demoMedia } from "@/lib/youtube";
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

// Wspólna siatka kolumn dla wiersza i nagłówka tabeli (TableDay) — trzymana w jednym miejscu,
// żeby kolumny obu nie mogły się rozjechać.
export const TABLE_ROW_GRID_COLS =
  "grid-cols-[1.75rem_1.75rem_minmax(11rem,1.4fr)_9.5rem_4.5rem_5rem_3.5rem_5rem_minmax(8rem,1fr)_8.5rem]";

const cellInput = `${inputClass} px-2 py-1.5 text-center text-sm`;

function SetsRepsCell({
  item,
  exercise,
  onPatch,
}: {
  item: BuilderItem;
  exercise?: Exercise;
  onPatch: (patch: Partial<BuilderItem>) => void;
}) {
  const setsField = (
    <NumInput
      className="w-10 px-1 py-1.5 text-center"
      value={item.sets}
      min={1}
      onChange={(v) => onPatch({ sets: v })}
      placeholder={exercise ? String(exercise.defaultSets) : "—"}
    />
  );
  const times = (
    <span className="shrink-0 text-xs text-muted">×</span>
  );

  if (item.measureType === "time") {
    return (
      <div className="flex items-center gap-1">
        {setsField}
        {times}
        <NumInput
          className="w-12 px-1 py-1.5 text-center"
          value={item.repDurationSeconds}
          min={1}
          onChange={(v) => onPatch({ repDurationSeconds: v })}
          placeholder="s"
        />
      </div>
    );
  }
  if (item.measureType === "distance") {
    return (
      <div className="flex items-center gap-1">
        {setsField}
        {times}
        <NumInput
          className="w-14 px-1 py-1.5 text-center"
          value={item.distanceMeters}
          min={1}
          onChange={(v) => onPatch({ distanceMeters: v })}
          placeholder="m"
        />
      </div>
    );
  }
  return (
    <div className="flex items-center gap-0.5">
      {setsField}
      {times}
      <NumInput
        className="w-10 px-1 py-1.5 text-center"
        value={item.reps}
        min={1}
        onChange={(v) => onPatch({ reps: v })}
        placeholder={exercise ? String(exercise.defaultReps) : "—"}
      />
      <span className="shrink-0 text-xs text-muted">–</span>
      <NumInput
        className="w-10 px-1 py-1.5 text-center"
        value={item.repsMax}
        min={1}
        onChange={(v) => onPatch({ repsMax: v })}
        placeholder="—"
      />
    </div>
  );
}

export function TableExerciseRow({
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
  const rampInfo = parseRampSchemeInfo(item.setScheme);
  const isRamp = rampInfo != null;
  const backoffs = readRampBackoffs(item);
  return (
    <div
      className={`rounded-[10px] border bg-surface ${
        isInSuperset ? "border-accent/50 border-l-[3px] bg-accent-dim/40" : "border-border"
      }`}
    >
      <div className={`grid ${TABLE_ROW_GRID_COLS} items-center gap-2 px-2 py-2`}>
        <IconButton title={expanded ? "Zwiń szczegóły" : "Rozwiń szczegóły"} size="xs" onClick={onToggleExpand}>
          {expanded ? "▾" : "▸"}
        </IconButton>

        <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-surface-hover font-mono text-xs font-semibold tabular-nums text-muted">
          {supersetLabel ?? index + 1}
        </span>

        <div className="flex min-w-0 items-center gap-2">
          <div className="h-9 w-9 shrink-0">
            <ExerciseThumb
              variant="square"
              youtubeId={demoMedia(exercise).youtubeId}
              category={exercise?.category}
              alt={item.exerciseName}
            />
          </div>
          <div className="flex min-w-0 flex-wrap items-center gap-1.5">
            <span className="min-w-0 break-words text-sm font-medium">{item.exerciseName}</span>
            {item.isWarmup ? <Badge tone="neutral">rozgrzewka</Badge> : null}
            {supersetLabel && <Badge tone="accent">{supersetLabel}</Badge>}
          </div>
        </div>

        <SetsRepsCell item={item} exercise={exercise} onPatch={onPatch} />

        <input
          className={cellInput}
          value={item.tempo ?? ""}
          onChange={(e) => onPatch({ tempo: e.target.value || null })}
          placeholder="—"
          aria-label="Tempo"
        />

        <NumInput
          className="px-2 py-1.5 text-center"
          value={item.restBetweenSetsSeconds}
          min={0}
          onChange={(v) => onPatch({ restBetweenSetsSeconds: v })}
          placeholder={exercise ? String(exercise.defaultRestBetweenSetsSeconds) : "dom."}
        />

        <NumInput
          className="px-2 py-1.5 text-center"
          value={item.targetRir}
          min={0}
          step={0.5}
          onChange={(v) => onPatch({ targetRir: v })}
          placeholder="—"
          aria-label="RIR celu"
        />

        <NumInput
          className="px-2 py-1.5 text-center"
          value={item.loadKg}
          min={0}
          step={0.5}
          onChange={(v) => onPatch({ loadKg: v })}
          placeholder="dom."
          title={isDumbbellPair(exercise ?? {}) ? "Ciężar jednej hantli (klient zobaczy 2×)" : "Ciężar (kg)"}
          aria-label={isDumbbellPair(exercise ?? {}) ? "Ciężar na hantlę" : "Ciężar"}
        />

        <input
          className={`${inputClass} px-2 py-1.5 text-sm`}
          value={item.notes ?? ""}
          onChange={(e) => onPatch({ notes: e.target.value || null })}
          placeholder="Notatka dla klienta"
          aria-label="Notatka dla klienta"
        />

        <div className="flex flex-wrap items-center justify-end gap-1">
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

      {expanded && (
        <div className="border-t border-border p-3">
          <div className="mb-3 flex items-center gap-2">
            <label className="flex items-center gap-1.5 text-xs text-muted">
              RPE (opcjonalnie)
              <NumInput
                className="w-16 px-2 py-1 text-center"
                value={item.targetRpe}
                min={1}
                step={0.5}
                onChange={(v) => onPatch({ targetRpe: v })}
                placeholder="—"
              />
            </label>
            {item.targetRpe != null && item.targetRir == null && (
              <span className="text-xs text-muted">≈ RIR {rirFromRpe(item.targetRpe)}</span>
            )}
          </div>
          <div className="mb-3">
            <RampControls
              mode={isRamp ? "ramp" : "sets"}
              targetRm={rampInfo?.targetRm ?? 6}
              topKg={item.prescribedSets.find((s) => s.role === "top")?.loadKg ?? item.loadKg}
              backoffEnabled={backoffs.length > 0}
              showSetsCount={false}
              showRest={false}
              onModeChange={(mode) => {
                if (mode !== "ramp") {
                  onPatch({ setScheme: null });
                  return;
                }
                const targetRm = rampInfo?.targetRm ?? 6;
                const generated = buildRampPrescribedSets({
                  targetRm,
                  topKg: item.loadKg,
                  backoffs,
                });
                onPatch({
                  setScheme: formatRampScheme(targetRm, backoffs.map((b) => b.percent)),
                  prescribedSets: mergeRampRoles(item.prescribedSets, generated),
                });
              }}
              onTargetRm={(v) => {
                const next = item.prescribedSets.map((s) =>
                  s.role === "top" || s.role === "ramp" ? { ...s, reps: v } : s,
                );
                onPatch({
                  setScheme: formatRampScheme(v, backoffs.map((b) => b.percent)),
                  prescribedSets:
                    next.length > 0
                      ? next
                      : buildRampPrescribedSets({ targetRm: v, topKg: item.loadKg, backoffs }),
                });
              }}
              onTopKg={(v) =>
                onPatch({
                  loadKg: v,
                  prescribedSets: item.prescribedSets.map((s) =>
                    s.role === "top" ? { ...s, loadKg: v, loadPercent: null, percentOf: null } : s,
                  ),
                })
              }
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
          </div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">Rozkład serii</p>
          <SetSchemeEditor
            sets={item.prescribedSets}
            weekNumber={weekNumber}
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
      )}
    </div>
  );
}
