"use client";

import { PercentBase, PERCENT_BASE_LABELS, SET_ROLE_LABELS } from "@/lib/api";
import { PLAN_PRESETS } from "@/lib/planPresets";
import { IconButton, inputClass } from "@/components/ui";
import { computeSetKg } from "./computedLoad";
import { NumInput } from "./NumInput";
import { BuilderSet } from "./types";

const ROLE_OPTIONS = ["work", "warmup", "ramp", "top", "backoff"];

function rolePill(role: string | null | undefined) {
  const r = role ?? "work";
  const label = SET_ROLE_LABELS[r] ?? r;
  if (r === "top") return "bg-surface-active text-foreground";
  if (r === "backoff") return "bg-surface-sunken text-foreground-secondary";
  if (r === "ramp") return "bg-surface-active text-muted-strong";
  return "bg-surface-active text-foreground-secondary";
}

export function SetSchemeEditor({
  sets,
  weekNumber,
  open,
  onAdd,
  onPatch,
  onRemove,
  onApplyPreset,
  onClear,
}: {
  sets: BuilderSet[];
  weekNumber: number;
  open?: boolean;
  onAdd: () => void;
  onPatch: (setKey: string, patch: Partial<BuilderSet>) => void;
  onRemove: (setKey: string) => void;
  onApplyPreset: (presetId: string) => void;
  onClear: () => void;
}) {
  if (open === false) return null;

  const activePresetId =
    PLAN_PRESETS.find((p) => sets.length > 0 && p.label.includes("6-4-2") && sets.some((s) => s.role === "ramp"))
      ?.id ?? null;

  return (
    <div className="rounded-[10px] border border-border bg-surface-sunken p-3">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="font-mono text-xs font-medium uppercase tracking-caps text-muted">Metoda</span>
        {PLAN_PRESETS.map((p) => {
          const short =
            p.id === "642531" ? "6-4-2-5-3-1" : p.id === "ramp15" ? "15-10-5" : p.id === "ramp10" ? "10" : "5";
          const active = activePresetId === p.id || (p.id === "642531" && sets.some((s) => s.note?.includes("2RM")));
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onApplyPreset(p.id)}
              className={`rounded-full border px-3 py-1 font-mono text-xs tabular-nums transition-colors ${
                active
                  ? "border-border-strong bg-surface-active text-foreground"
                  : "border-border bg-surface text-muted hover:border-border-strong"
              }`}
              title={p.label}
            >
              {short}
            </button>
          );
        })}
        <button
          type="button"
          onClick={onAdd}
          className="ml-auto rounded-[10px] border border-border-strong px-3 py-1 text-xs font-medium text-foreground-secondary hover:bg-surface-hover"
        >
          + Seria
        </button>
        {sets.length > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="text-xs text-muted hover:text-foreground-secondary"
          >
            Wyczyść
          </button>
        )}
      </div>

      {sets.length > 0 && (
        <>
          <p className="mb-3 rounded-[10px] border border-border bg-surface px-3 py-2 text-xs text-muted-strong">
            Tydzień {weekNumber} generuje serie wg wybranego presetu. Zmiana tygodnia przelicza serie przy kopiowaniu
            z opcją „Przelicz preset”.
          </p>
          <div className="overflow-x-auto">
            <div className="grid min-w-[720px] gap-2">
              <div className="grid grid-cols-[2rem_7rem_5rem_4rem_6rem_5rem_4rem_auto] gap-2 font-mono text-[10px] font-medium uppercase tracking-caps text-muted">
                <span>#</span>
                <span>Rola</span>
                <span>Powt.</span>
                <span>%</span>
                <span>Baza</span>
                <span>Ciężar</span>
                <span>= kg</span>
                <span />
              </div>
              {sets.map((s, idx) => {
                const computed = computeSetKg(s, sets);
                const isTop = s.role === "top";
                return (
                  <div
                    key={s.key}
                    className={`grid grid-cols-[2rem_7rem_5rem_4rem_6rem_5rem_4rem_auto] items-center gap-2 rounded-lg px-1 py-1 ${
                      isTop ? "bg-surface-active shadow-[inset_3px_0_0_var(--border-strong)]" : ""
                    }`}
                  >
                    <span className="font-mono text-xs tabular-nums text-muted-faint">{idx + 1}</span>
                    <select
                      className={`h-8 rounded-full border-0 px-2 text-xs font-medium ${rolePill(s.role)}`}
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
                    <div className="flex items-center gap-0.5">
                      <NumInput
                        className="px-2 py-1 text-center"
                        value={s.reps}
                        min={0}
                        onChange={(v) => onPatch(s.key, { reps: v })}
                        placeholder="—"
                      />
                      {s.repsMax != null && (
                        <NumInput
                          className="px-2 py-1 text-center"
                          value={s.repsMax}
                          min={0}
                          onChange={(v) => onPatch(s.key, { repsMax: v })}
                          placeholder="—"
                        />
                      )}
                    </div>
                    <NumInput
                      className="px-2 py-1 text-center"
                      value={s.loadPercent}
                      min={0}
                      onChange={(v) => onPatch(s.key, { loadPercent: v })}
                      placeholder="—"
                    />
                    <select
                      className={`${inputClass} h-8 py-0 text-xs`}
                      value={s.percentOf ?? ""}
                      onChange={(e) =>
                        onPatch(s.key, { percentOf: (e.target.value || null) as PercentBase | null })
                      }
                    >
                      <option value="">—</option>
                      {(Object.keys(PERCENT_BASE_LABELS) as PercentBase[]).map((b) => (
                        <option key={b} value={b}>
                          {PERCENT_BASE_LABELS[b]}
                        </option>
                      ))}
                    </select>
                    <NumInput
                      className="px-2 py-1 text-center"
                      value={s.loadKg}
                      min={0}
                      step={0.5}
                      onChange={(v) => onPatch(s.key, { loadKg: v })}
                      placeholder="auto"
                    />
                    <span
                      className={`font-mono text-sm font-semibold tabular-nums ${
                        isTop ? "text-foreground" : "text-foreground-secondary"
                      }`}
                    >
                      {computed != null ? computed : "—"}
                    </span>
                    <IconButton title="Usuń serię" size="xs" onClick={() => onRemove(s.key)}>
                      ✕
                    </IconButton>
                  </div>
                );
              })}
            </div>
            <p className="mt-2 text-xs text-muted">
              „= kg” liczy się z bazy: np. 80% z topu. Klient widzi gotowe liczby, nie wzory. Baza 1RM wymaga maxów
              klienta (osobna funkcja).
            </p>
          </div>
        </>
      )}
    </div>
  );
}
