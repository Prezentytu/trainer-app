"use client";

import { PercentBase, PERCENT_BASE_LABELS, SET_ROLE_LABELS } from "@/lib/api";
import { PLAN_PRESETS } from "@/lib/planPresets";
import { Button, IconButton, inputClass } from "@/components/ui";
import { NumInput } from "./NumInput";
import { BuilderSet } from "./types";

const ROLE_OPTIONS = ["work", "warmup", "ramp", "top", "backoff"];

export function SetSchemeEditor({
  sets,
  weekNumber,
  onAdd,
  onPatch,
  onRemove,
  onApplyPreset,
  onClear,
}: {
  sets: BuilderSet[];
  weekNumber: number;
  onAdd: () => void;
  onPatch: (setKey: string, patch: Partial<BuilderSet>) => void;
  onRemove: (setKey: string) => void;
  onApplyPreset: (presetId: string) => void;
  onClear: () => void;
}) {
  const advanced = sets.length > 0;
  return (
    <div className="rounded-lg border border-dashed border-zinc-700 p-3">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-zinc-400">Rozpisz serie (opcjonalnie):</span>
        <select
          className={`${inputClass} py-1`}
          value=""
          onChange={(e) => {
            if (e.target.value) onApplyPreset(e.target.value);
          }}
        >
          <option value="">preset…</option>
          {PLAN_PRESETS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </select>
        <Button variant="ghost" onClick={onAdd}>
          + Seria
        </Button>
        {advanced && (
          <Button variant="ghost" onClick={onClear}>
            Wyczyść serie
          </Button>
        )}
      </div>

      {advanced && (
        <div className="overflow-x-auto">
          <div className="grid min-w-[720px] gap-2">
            <div className="grid grid-cols-[auto_1fr_1fr_1fr_1fr_1fr_1fr_auto] gap-2 text-[11px] uppercase tracking-wide text-zinc-500">
              <span>#</span>
              <span>Powt.</span>
              <span>Powt. maks.</span>
              <span>%</span>
              <span>Baza %</span>
              <span>Ciężar</span>
              <span>RIR</span>
              <span />
            </div>
            {sets.map((s, idx) => (
              <div key={s.key} className="grid grid-cols-[auto_1fr_1fr_1fr_1fr_1fr_1fr_auto] items-center gap-2">
                <span className="text-xs text-zinc-500">{idx + 1}</span>
                <NumInput value={s.reps} min={0} onChange={(v) => onPatch(s.key, { reps: v })} placeholder="powt." />
                <NumInput value={s.repsMax} min={0} onChange={(v) => onPatch(s.key, { repsMax: v })} placeholder="—" />
                <NumInput value={s.loadPercent} min={0} onChange={(v) => onPatch(s.key, { loadPercent: v })} placeholder="%" />
                <select
                  className={`${inputClass} py-1`}
                  value={s.percentOf ?? ""}
                  onChange={(e) => onPatch(s.key, { percentOf: (e.target.value || null) as PercentBase | null })}
                >
                  <option value="">—</option>
                  {(Object.keys(PERCENT_BASE_LABELS) as PercentBase[]).map((b) => (
                    <option key={b} value={b}>
                      {PERCENT_BASE_LABELS[b]}
                    </option>
                  ))}
                </select>
                <NumInput value={s.loadKg} min={0} step={0.5} onChange={(v) => onPatch(s.key, { loadKg: v })} placeholder="kg" />
                <NumInput
                  value={s.targetRir}
                  min={0}
                  step={0.5}
                  onChange={(v) => onPatch(s.key, { targetRir: v })}
                  placeholder="—"
                  aria-label="RIR celu serii"
                />
                <div className="flex items-center gap-1">
                  <select
                    className={`${inputClass} py-1`}
                    value={s.role ?? "work"}
                    onChange={(e) => onPatch(s.key, { role: e.target.value })}
                    aria-label="Rola serii"
                  >
                    {ROLE_OPTIONS.map((r) => (
                      <option key={r} value={r}>
                        {SET_ROLE_LABELS[r]}
                      </option>
                    ))}
                  </select>
                  <IconButton title="Usuń serię" onClick={() => onRemove(s.key)}>
                    ✕
                  </IconButton>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-2 text-[11px] text-zinc-500">
            „% od topu” liczy się względem najcięższej/rampowej serii tej pozycji. Preset 6-4-2-5-3-1 dopasowuje się do
            numeru tygodnia (obecnie tydzień {weekNumber}).
          </p>
        </div>
      )}
    </div>
  );
}
