"use client";

import { useState } from "react";
import {
  matchingPresetId,
  PLAN_PRESETS,
  poliquinWeekHint,
} from "@/lib/planPresets";
import { formatSetListPreview, parseSetList } from "@/lib/setList";
import { Field, inputClass } from "@/components/ui";
import { polishSetCount } from "@/lib/plural";
import { computeSetKg } from "./computedLoad";
import { SET_ROW_GRID, SetRow } from "./SetRow";
import { BuilderSet, newKey } from "./types";

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
  const [templateOpen, setTemplateOpen] = useState(false);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [paste, setPaste] = useState("");
  const [pasteError, setPasteError] = useState<string | null>(null);
  if (open === false) return null;

  const activePresetId = matchingPresetId(sets, weekNumber);
  const custom = sets.length > 0 && activePresetId == null;
  const parsedPaste = paste.trim() ? parseSetList(paste) : null;
  const needsTopHint = sets.some((s) => loadKindOf(s) === "percent" && computeSetKg(s, sets, { oneRmKg, itemLoadKg }) == null);

  const applyPaste = () => {
    if (!onReplaceSets) return;
    const parsed = parseSetList(paste);
    if (!parsed) {
      setPasteError("Nie rozpoznano serii. Wklej np. 65x5, 70x5 albo 8-10x60.");
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
    setPasteOpen(false);
  };

  return (
    <div className="space-y-2.5">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <button
            type="button"
            onClick={() => setTemplateOpen((v) => !v)}
            className="text-sm font-medium text-foreground-secondary hover:text-foreground"
            aria-expanded={templateOpen}
          >
            Szablon ▾
          </button>
          {templateOpen ? (
            <div className="absolute left-0 top-full z-30 mt-1 min-w-[14rem] rounded-[10px] border border-border-strong bg-surface p-1">
              {PLAN_PRESETS.map((p) => {
                const active = activePresetId === p.id;
                const weekHint = p.id === "642531" ? poliquinWeekHint(weekNumber) : null;
                return (
                  <button
                    key={p.id}
                    type="button"
                    className={`flex w-full rounded-[8px] px-2.5 py-1.5 text-left text-sm ${
                      active ? "bg-surface-active text-foreground" : "text-foreground-secondary hover:bg-surface-hover"
                    }`}
                    onClick={() => {
                      onApplyPreset(p.id);
                      setTemplateOpen(false);
                    }}
                  >
                    {p.id === "642531" ? `${p.chipLabel} · ${weekHint}` : p.chipLabel}
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>
        {custom ? <span className="t-label text-muted">Własny rozpis</span> : null}
        {onReplaceSets ? (
          <button
            type="button"
            onClick={() => setPasteOpen((v) => !v)}
            className="text-sm text-muted hover:text-foreground-secondary"
          >
            Wklej z tekstu
          </button>
        ) : null}
      </div>

      {pasteOpen && onReplaceSets ? (
        <Field label="Wklej serie">
          <input
            className={inputClass}
            value={paste}
            placeholder="65x5, 70x5 albo 8-10x60"
            onChange={(e) => {
              setPaste(e.target.value);
              setPasteError(null);
            }}
            onKeyDown={(e) => {
              if (e.key !== "Enter") return;
              e.preventDefault();
              applyPaste();
            }}
          />
          {pasteError ? (
            <p className="mt-1 text-sm text-danger">{pasteError}</p>
          ) : parsedPaste ? (
            <p className="mt-1 text-xs text-foreground-secondary">
              Enter wstawi: {formatSetListPreview(parsedPaste)}
            </p>
          ) : (
            <p className="mt-1 text-xs text-muted">
              Enter wstawia listę. 65×5 to 65 kg na 5 powtórzeń.
            </p>
          )}
        </Field>
      ) : null}

      {sets.length > 0 ? (
        <div className="min-w-0 overflow-x-auto">
          <div className="inline-block min-w-[22rem]">
            <div className={`grid ${SET_ROW_GRID} gap-2 pb-1`}>
              <span className="t-label text-muted">Seria</span>
              <span className="t-label text-muted">Ciężar</span>
              <span className="t-label text-muted">Powtórzenia</span>
              <span />
              <span />
            </div>
            <div className="flex flex-col gap-1.5">
              {sets.map((s, idx) => {
                const kind = loadKindOf(s);
                const computed = computeSetKg(s, sets, { oneRmKg, itemLoadKg });
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
                  />
                );
              })}
            </div>
            {needsTopHint ? (
              <p className="mt-2 text-xs text-muted">
                Ustaw docelowy ciężar, żeby zobaczyć kilogramy przy seriach procentowych.
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onAdd}
          className="text-sm font-medium text-foreground-secondary hover:text-foreground"
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
        {sets.length > 0 ? (
          <span className="text-xs text-muted">{polishSetCount(sets.length)}</span>
        ) : null}
      </div>
    </div>
  );
}
