"use client";

import { useState } from "react";
import { PLAN_PRESETS } from "@/lib/planPresets";
import { SetRow, editorChipOff, editorChipOn } from "./SetRow";
import { BuilderSet } from "./types";

const BO_PERCENT_CHIPS = [60, 70, 80, 90] as const;

function loadKindOf(s: BuilderSet): "kg" | "percent" {
  return s.loadPercent != null && s.loadKg == null ? "percent" : "kg";
}

export function SetSchemeEditor({
  sets,
  open,
  onAdd,
  onPatch,
  onRemove,
  onApplyPreset,
  onClear,
}: {
  sets: BuilderSet[];
  weekNumber?: number;
  open?: boolean;
  onAdd: () => void;
  onPatch: (setKey: string, patch: Partial<BuilderSet>) => void;
  onRemove: (setKey: string) => void;
  onApplyPreset: (presetId: string) => void;
  onClear: () => void;
}) {
  const [focusKey, setFocusKey] = useState<string | null>(null);
  if (open === false) return null;

  const focused = sets.find((s) => s.key === focusKey) ?? sets[sets.length - 1] ?? null;
  const showPctChips = focused != null && loadKindOf(focused) === "percent";

  const activePresetId =
    PLAN_PRESETS.find((p) => sets.length > 0 && p.label.includes("6-4-2") && sets.some((s) => s.role === "ramp"))
      ?.id ?? null;

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center gap-1.5">
        {PLAN_PRESETS.map((p) => {
          const short =
            p.id === "642531" ? "6-4-2-5-3-1" : p.id === "ramp15" ? "15-10-5" : p.id === "ramp10" ? "10" : "5";
          const active = activePresetId === p.id || (p.id === "642531" && sets.some((s) => s.note?.includes("2RM")));
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onApplyPreset(p.id)}
              className={active ? editorChipOn : editorChipOff}
              title={p.label}
            >
              {short}
            </button>
          );
        })}
        <button
          type="button"
          onClick={onAdd}
          className="ml-auto text-sm font-medium text-foreground-secondary hover:text-foreground"
        >
          + Seria
        </button>
        {sets.length > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="text-sm text-muted hover:text-foreground-secondary"
          >
            Wyczyść
          </button>
        )}
      </div>

      {sets.length > 0 && (
        <div>
          {sets.map((s, idx) => {
            const kind = loadKindOf(s);
            return (
              <SetRow
                key={s.key}
                label={String(idx + 1)}
                reps={s.reps}
                repsMax={s.repsMax}
                loadKg={s.loadKg}
                loadPercent={s.loadPercent}
                loadKind={kind}
                role={s.role}
                onReps={(v) => onPatch(s.key, { reps: v })}
                onRepsMax={(v) => onPatch(s.key, { repsMax: v })}
                onLoadKg={(v) => onPatch(s.key, { loadKg: v, loadPercent: v != null ? null : s.loadPercent })}
                onLoadPercent={(v) =>
                  onPatch(s.key, {
                    loadPercent: v,
                    loadKg: v != null ? null : s.loadKg,
                    percentOf: v != null ? (s.percentOf ?? "top") : null,
                  })
                }
                onLoadKind={(next) => {
                  if (next === "percent") {
                    onPatch(s.key, {
                      loadKg: null,
                      loadPercent: s.loadPercent ?? 80,
                      percentOf: s.percentOf ?? "top",
                    });
                  } else {
                    onPatch(s.key, { loadPercent: null, percentOf: null });
                  }
                }}
                onRole={(role) => onPatch(s.key, { role })}
                onRemove={() => onRemove(s.key)}
                onLoadFocus={() => setFocusKey(s.key)}
              />
            );
          })}
          {showPctChips && focused ? (
            <div className="flex flex-wrap items-center gap-1.5 pt-2">
              {BO_PERCENT_CHIPS.map((p) => (
                <button
                  key={p}
                  type="button"
                  className={focused.loadPercent === p ? editorChipOn : editorChipOff}
                  onClick={() =>
                    onPatch(focused.key, { loadPercent: p, loadKg: null, percentOf: focused.percentOf ?? "top" })
                  }
                >
                  {p}%
                </button>
              ))}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
