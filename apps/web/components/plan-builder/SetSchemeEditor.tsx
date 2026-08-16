"use client";

import { useState } from "react";
import {
  matchingPresetId,
  PLAN_PRESETS,
  poliquinWeekHint,
} from "@/lib/planPresets";
import { parseSetList } from "@/lib/setList";
import { Field, inputClass } from "@/components/ui";
import { polishSetCount } from "@/lib/plural";
import { computeSetKg } from "./computedLoad";
import { editorChipOff, editorChipOn } from "./editorChips";
import { SetRow } from "./SetRow";
import { BuilderSet, newKey } from "./types";

const BO_PERCENT_CHIPS = [60, 70, 80, 90] as const;

function loadKindOf(s: BuilderSet): "kg" | "percent" {
  return s.loadPercent != null && s.loadKg == null ? "percent" : "kg";
}

export function SetSchemeEditor({
  sets,
  weekNumber = 1,
  open,
  measureType,
  itemLoadKg,
  oneRmKg,
  onAdd,
  onPatch,
  onRemove,
  onApplyPreset,
  onClear,
  onReplaceSets,
}: {
  sets: BuilderSet[];
  weekNumber?: number;
  open?: boolean;
  measureType?: "reps" | "time" | "distance";
  itemLoadKg?: number | null;
  oneRmKg?: number | null;
  onAdd: () => void;
  onPatch: (setKey: string, patch: Partial<BuilderSet>) => void;
  onRemove: (setKey: string) => void;
  onApplyPreset: (presetId: string) => void;
  onClear: () => void;
  onReplaceSets?: (sets: BuilderSet[]) => void;
}) {
  const [focusKey, setFocusKey] = useState<string | null>(null);
  const [paste, setPaste] = useState("");
  const [pasteError, setPasteError] = useState<string | null>(null);
  if (open === false) return null;

  const focused = sets.find((s) => s.key === focusKey) ?? sets[sets.length - 1] ?? null;
  const showPctChips = focused != null && loadKindOf(focused) === "percent";
  const activePresetId = matchingPresetId(sets, weekNumber);
  const custom = sets.length > 0 && activePresetId == null;

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center gap-1.5">
        <span className="t-label mr-1 text-muted">Szablon</span>
        {PLAN_PRESETS.map((p) => {
          const active = activePresetId === p.id;
          const weekHint = p.id === "642531" ? poliquinWeekHint(weekNumber) : null;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onApplyPreset(p.id)}
              className={active ? editorChipOn : editorChipOff}
              title={p.id === "642531" ? `${p.title} — zastosuje ${weekHint}` : p.title}
            >
              {p.id === "642531" ? `${p.chipLabel} · ${weekHint}` : p.chipLabel}
            </button>
          );
        })}
        {custom ? <span className="t-label text-muted">Własny rozpis</span> : null}
        <button
          type="button"
          onClick={onAdd}
          className="ml-auto text-sm font-medium text-foreground-secondary hover:text-foreground"
        >
          + Seria
        </button>
        {sets.length > 0 ? (
          <button
            type="button"
            onClick={onClear}
            className="text-sm text-muted hover:text-foreground-secondary"
          >
            Wyczyść
          </button>
        ) : null}
      </div>

      {onReplaceSets ? (
        <Field label="Wklej serie">
          <input
            className={inputClass}
            value={paste}
            placeholder="8x30, 8-10x60, 5x85%"
            onChange={(e) => {
              setPaste(e.target.value);
              setPasteError(null);
            }}
            onKeyDown={(e) => {
              if (e.key !== "Enter") return;
              e.preventDefault();
              const parsed = parseSetList(paste);
              if (!parsed) {
                setPasteError("Nie rozpoznano serii. Wklej np. 8x30, 8-10x60 albo 5x85%.");
                return;
              }
              onReplaceSets(
                parsed.map((s, i) => ({
                  key: newKey(),
                  order: i + 1,
                  reps: s.reps,
                  repsMax: s.repsMax ?? null,
                  durationSeconds: null,
                  distanceMeters: null,
                  loadKg: s.loadPercent != null ? null : s.loadKg,
                  loadPercent: s.loadPercent ?? null,
                  percentOf: s.loadPercent != null ? "top" : null,
                  targetRpe: null,
                  targetRir: null,
                  tempo: null,
                  role: "work",
                  note: s.isBodyweight ? "BW" : null,
                })),
              );
              setPaste("");
              setPasteError(null);
            }}
          />
          {pasteError ? (
            <p className="mt-1 text-sm text-danger">{pasteError}</p>
          ) : (
            <p className="mt-1 text-xs text-muted">
              Enter wkleja listę. Format: 8x30, 8-10x60 albo 5x85%.
            </p>
          )}
        </Field>
      ) : null}

      {sets.length > 0 ? (
        <div className="min-w-0 overflow-x-auto">
          <div className="min-w-[22rem]">
            <div className="grid grid-cols-[minmax(5.75rem,auto)_minmax(7rem,1fr)_minmax(8.5rem,auto)_2rem] gap-2 pb-1">
              <span className="t-label text-muted">Seria</span>
              <span className="t-label text-muted">Powtórzenia</span>
              <span className="t-label text-muted">Ciężar</span>
              <span />
            </div>
            {sets.map((s, idx) => {
              const kind = loadKindOf(s);
              const computed = computeSetKg(s, sets, { oneRmKg, itemLoadKg });
              const hint =
                s.percentOf === "1rm" && oneRmKg == null
                  ? "Brak maxa klienta — ustaw 1RM, żeby zobaczyć kg"
                  : "Ustaw docelowy ciężar, żeby zobaczyć kg";
              return (
                <SetRow
                  key={s.key}
                  index={idx + 1}
                  reps={s.reps}
                  repsMax={s.repsMax}
                  loadKg={s.loadKg}
                  loadPercent={s.loadPercent}
                  loadKind={kind}
                  role={s.role}
                  tempo={s.tempo}
                  targetRpe={s.targetRpe}
                  targetRir={s.targetRir}
                  note={s.note}
                  durationSeconds={s.durationSeconds}
                  distanceMeters={s.distanceMeters}
                  percentOf={s.percentOf}
                  measureType={measureType}
                  computedKg={kind === "percent" ? computed : null}
                  computedHint={hint}
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
                  onMorePatch={(patch) => onPatch(s.key, patch)}
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
            <p className="mt-2 text-xs text-muted">{polishSetCount(sets.length)}</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
