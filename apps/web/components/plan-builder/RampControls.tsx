"use client";

import { useState } from "react";
import { Field, IconButton, SegmentedControl } from "@/components/ui";
import { NumInput } from "./NumInput";
import { editorChipOff, editorChipOn } from "./editorChips";
import type { BackoffRow } from "./listGroups";

const RAMP_SHORTCUTS = [6, 4, 2, 1] as const;
const DEFAULT_BO: BackoffRow = { reps: 5, repsMax: 10, percent: 80 };

export function RampControls({
  mode,
  targetRm,
  topKg,
  setsCount,
  restSeconds,
  restLabel = "Przerwa (s)",
  backoffs,
  showSetsCount = true,
  showRest = true,
  onModeChange,
  onTargetRm,
  onTopKg,
  onSetsCount,
  onRest,
  onBackoffsChange,
}: {
  mode: "sets" | "ramp";
  targetRm: number;
  topKg: number | null;
  setsCount?: number | null;
  restSeconds?: number | null;
  restLabel?: string;
  backoffs: BackoffRow[];
  showSetsCount?: boolean;
  showRest?: boolean;
  onModeChange: (mode: "sets" | "ramp") => void;
  onTargetRm: (value: number) => void;
  onTopKg: (value: number | null) => void;
  onSetsCount?: (value: number | null) => void;
  onRest?: (value: number | null) => void;
  onBackoffsChange: (rows: BackoffRow[]) => void;
}) {
  const knownShortcut = RAMP_SHORTCUTS.includes(targetRm as (typeof RAMP_SHORTCUTS)[number]);
  const [otherOpen, setOtherOpen] = useState(!knownShortcut);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-1.5">
        <SegmentedControl
          items={[
            { value: "sets", label: "Serie × wartość" },
            { value: "ramp", label: "Rampa" },
          ]}
          value={mode}
          onChange={(v) => onModeChange(v === "ramp" ? "ramp" : "sets")}
        />
        {mode === "ramp" ? (
          <>
            <span className="ml-1 text-xs text-muted">do</span>
            {RAMP_SHORTCUTS.map((t) => (
              <button
                key={t}
                type="button"
                className={targetRm === t && !otherOpen ? editorChipOn : editorChipOff}
                onClick={() => {
                  setOtherOpen(false);
                  onTargetRm(t);
                }}
              >
                {t}RM
              </button>
            ))}
            <button
              type="button"
              className={otherOpen ? editorChipOn : editorChipOff}
              onClick={() => setOtherOpen(true)}
            >
              inny…
            </button>
          </>
        ) : null}
      </div>

      {mode === "ramp" ? (
        <>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {otherOpen ? (
              <Field label="Cel rampy (xRM)">
                <NumInput
                  value={targetRm}
                  min={1}
                  max={15}
                  onChange={(v) => {
                    if (v == null || v < 1) return;
                    onTargetRm(v);
                  }}
                  placeholder="6"
                />
              </Field>
            ) : null}
            {showSetsCount ? (
              <Field label="Serie" hint="opcjonalnie">
                <NumInput
                  value={setsCount ?? null}
                  min={1}
                  onChange={(v) => onSetsCount?.(v)}
                  placeholder="—"
                />
              </Field>
            ) : null}
            <Field label="Docelowy ciężar (kg)">
              <NumInput
                value={topKg}
                min={0}
                step={0.5}
                onChange={onTopKg}
                placeholder="—"
              />
            </Field>
            {showRest ? (
              <Field label={restLabel}>
                <NumInput
                  value={restSeconds ?? null}
                  min={0}
                  onChange={(v) => onRest?.(v)}
                  placeholder="60"
                />
              </Field>
            ) : null}
          </div>

          {backoffs.length > 0 ? (
            <div className="space-y-1.5">
              <p className="t-label text-muted">Backoff</p>
              {backoffs.map((row, idx) => (
                <div key={`bo-${idx}`} className="flex flex-wrap items-center gap-1.5">
                  <NumInput
                    value={row.reps}
                    min={1}
                    onChange={(v) => {
                      const next = backoffs.map((b, i) => (i === idx ? { ...b, reps: v } : b));
                      onBackoffsChange(next);
                    }}
                    placeholder="5"
                    aria-label={`Backoff ${idx + 1} powtórzenia od`}
                  />
                  <span className="text-muted-faint">–</span>
                  <NumInput
                    value={row.repsMax}
                    min={1}
                    onChange={(v) => {
                      const next = backoffs.map((b, i) => (i === idx ? { ...b, repsMax: v } : b));
                      onBackoffsChange(next);
                    }}
                    placeholder="10"
                    aria-label={`Backoff ${idx + 1} powtórzenia do`}
                  />
                  <NumInput
                    value={row.percent}
                    min={1}
                    max={100}
                    onChange={(v) => {
                      if (v == null) return;
                      const next = backoffs.map((b, i) => (i === idx ? { ...b, percent: v } : b));
                      onBackoffsChange(next);
                    }}
                    placeholder="80"
                    aria-label={`Backoff ${idx + 1} procent topu`}
                  />
                  <span className="t-label text-muted">% topu</span>
                  <IconButton
                    title="Usuń backoff"
                    size="xs"
                    onClick={() => onBackoffsChange(backoffs.filter((_, i) => i !== idx))}
                  >
                    ✕
                  </IconButton>
                </div>
              ))}
            </div>
          ) : null}

          <button
            type="button"
            onClick={() => onBackoffsChange([...backoffs, { ...DEFAULT_BO }])}
            className="text-sm font-medium text-foreground-secondary hover:text-foreground"
          >
            + Backoff
          </button>
        </>
      ) : null}
    </div>
  );
}
