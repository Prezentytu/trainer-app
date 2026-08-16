"use client";

import { Field, SegmentedControl, Switch } from "@/components/ui";
import { NumInput } from "./NumInput";
import { editorChipOff, editorChipOn } from "./editorChips";

const RAMP_SHORTCUTS = [6, 4, 2, 1] as const;

export function RampControls({
  mode,
  targetRm,
  topKg,
  setsCount,
  restSeconds,
  restLabel = "Przerwa (s)",
  backoffEnabled,
  showSetsCount = true,
  showRest = true,
  onModeChange,
  onTargetRm,
  onTopKg,
  onSetsCount,
  onRest,
  onBackoffEnabled,
}: {
  mode: "sets" | "ramp";
  targetRm: number;
  topKg: number | null;
  setsCount?: number | null;
  restSeconds?: number | null;
  restLabel?: string;
  backoffEnabled: boolean;
  showSetsCount?: boolean;
  showRest?: boolean;
  onModeChange: (mode: "sets" | "ramp") => void;
  onTargetRm: (value: number) => void;
  onTopKg: (value: number | null) => void;
  onSetsCount?: (value: number | null) => void;
  onRest?: (value: number | null) => void;
  onBackoffEnabled: (enabled: boolean) => void;
}) {
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
                className={targetRm === t ? editorChipOn : editorChipOff}
                onClick={() => onTargetRm(t)}
              >
                {t}RM
              </button>
            ))}
          </>
        ) : null}
      </div>

      {mode === "ramp" ? (
        <>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
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
          <Switch
            label="Backoff po serii szczytowej"
            checked={backoffEnabled}
            onChange={onBackoffEnabled}
          />
        </>
      ) : null}
    </div>
  );
}
