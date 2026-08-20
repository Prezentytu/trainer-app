"use client";

import { useCallback, useState } from "react";
import {
  matchingPresetId,
  PLAN_PRESETS,
  poliquinWeekHint,
} from "@/lib/planPresets";
import { formatSetListPreview, parseSetList } from "@/lib/setList";
import { Field, IconButton, inputClass } from "@/components/ui";
import { computeSetKg } from "./computedLoad";
import {
  FloatingMenu,
  FloatingMenuItem,
  FloatingMenuLabel,
  FloatingMenuSeparator,
} from "./FloatingMenu";
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
  defaultRestSeconds,
  onAdd,
  onInsert,
  onPatch,
  onRemove,
  onApplyPreset,
  onApplyRestToAll,
  onClear,
  onReplaceSets,
}: {
  sets: BuilderSet[];
  weekNumber?: number;
  open?: boolean;
  measureType?: "reps" | "time" | "distance";
  itemLoadKg?: number | null;
  oneRmKg?: number | null;
  /** Przerwa ćwiczenia — placeholder w kolumnie przerwy dla serii bez własnej wartości. */
  defaultRestSeconds?: number | null;
  onAdd: () => void;
  /** Zwraca `key` nowej serii — pozwala od razu ustawić fokus na jej ciężarze. */
  onInsert?: (index: number, side: "before" | "after") => string | void;
  onPatch: (setKey: string, patch: Partial<BuilderSet>) => void;
  onRemove: (setKey: string) => void;
  onApplyPreset: (presetId: string) => void;
  onApplyRestToAll?: (seconds: number | null) => void;
  onClear: () => void;
  onReplaceSets?: (sets: BuilderSet[]) => void;
}) {
  const [pasteOpen, setPasteOpen] = useState(false);
  const [paste, setPaste] = useState("");
  const [pasteError, setPasteError] = useState<string | null>(null);
  const [focusKey, setFocusKey] = useState<string | null>(null);

  const focusRef = useCallback(
    (el: HTMLInputElement | null) => {
      if (!el) return;
      el.focus();
      el.select();
      setFocusKey(null);
    },
    [],
  );

  if (open === false) return null;

  const activePresetId = matchingPresetId(sets, weekNumber);
  const parsedPaste = paste.trim() ? parseSetList(paste) : null;
  const needsTopHint = sets.some(
    (s) => loadKindOf(s) === "percent" && computeSetKg(s, sets, { oneRmKg, itemLoadKg }) == null,
  );

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
        restSeconds: null,
      })),
    );
    setPaste("");
    setPasteError(null);
    setPasteOpen(false);
  };

  return (
    <div className="space-y-2">
      {sets.length > 0 ? (
        <div className="rounded-[10px] bg-surface-sunken p-2">
          <div className={`grid ${SET_ROW_GRID} gap-1.5 px-0.5 pb-1.5`}>
            <span className="t-label truncate text-muted-faint">Seria</span>
            <span className="t-label truncate text-center text-muted-faint">Ciężar</span>
            <span className="t-label truncate text-center text-muted-faint">Powt.</span>
            <span className="t-label truncate text-center text-muted-faint">Przerwa</span>
            <span />
            <span />
          </div>
          <div className="flex flex-col divide-y divide-border">
            {sets.map((s, idx) => {
              const kind = loadKindOf(s);
              const computed = computeSetKg(s, sets, { oneRmKg, itemLoadKg });
              return (
                <div key={s.key} className="py-1">
                  <SetRow
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
                    restSeconds={s.restSeconds}
                    defaultRestSeconds={defaultRestSeconds}
                    loadInputRef={s.key === focusKey ? focusRef : undefined}
                    onReps={(next) => onPatch(s.key, next)}
                    onLoadKg={(v) =>
                      onPatch(s.key, { loadKg: v, loadPercent: v != null ? null : s.loadPercent })
                    }
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
                    onRest={(v) => onPatch(s.key, { restSeconds: v })}
                    onApplyRestToAll={onApplyRestToAll}
                    onMorePatch={(patch) => onPatch(s.key, patch)}
                    onInsert={
                      onInsert
                        ? (side) => {
                            const created = onInsert(idx, side);
                            if (typeof created === "string") setFocusKey(created);
                          }
                        : undefined
                    }
                    onRemove={() => onRemove(s.key)}
                  />
                  {kind === "percent" && computed != null ? (
                    <p className="mt-0.5 pl-[6.4rem] font-mono text-[11px] tabular-nums text-muted-faint">
                      ≈ {computed} kg
                    </p>
                  ) : null}
                </div>
              );
            })}
          </div>
          {needsTopHint ? (
            <p className="px-0.5 pt-2 text-xs text-muted">
              Ustaw docelowy ciężar, żeby zobaczyć kilogramy przy seriach procentowych.
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onAdd}
          className="text-sm font-medium text-foreground-secondary transition-colors hover:text-foreground"
        >
          + Seria
        </button>
        <div className="ml-auto flex items-center gap-0.5">
          <FloatingMenu
            label="Szablony serii"
            align="right"
            minWidth="14rem"
            trigger={({ open: menuOpen, toggle, ref }) => (
              <button
                ref={ref}
                type="button"
                onClick={toggle}
                className="inline-flex h-[var(--h-control-sm)] w-[var(--h-control-sm)] items-center justify-center rounded-[var(--r-field)] text-sm text-muted-faint transition-colors hover:bg-surface-hover hover:text-foreground"
                aria-expanded={menuOpen}
                aria-haspopup="menu"
                title="Szablony i wklejanie serii"
              >
                …
              </button>
            )}
          >
            {({ close }) => (
              <>
                <FloatingMenuLabel>Gotowy rozpis</FloatingMenuLabel>
                {PLAN_PRESETS.map((p) => (
                  <FloatingMenuItem
                    key={p.id}
                    active={activePresetId === p.id}
                    onClick={() => {
                      onApplyPreset(p.id);
                      close();
                    }}
                  >
                    {p.id === "642531" ? `${p.chipLabel} · ${poliquinWeekHint(weekNumber)}` : p.chipLabel}
                  </FloatingMenuItem>
                ))}
                {onReplaceSets ? (
                  <>
                    <FloatingMenuSeparator />
                    <FloatingMenuItem
                      onClick={() => {
                        setPasteOpen(true);
                        close();
                      }}
                    >
                      Wklej z tekstu
                    </FloatingMenuItem>
                  </>
                ) : null}
                {onApplyRestToAll && sets.length > 1 ? (
                  <FloatingMenuItem
                    onClick={() => {
                      onApplyRestToAll(null);
                      close();
                    }}
                  >
                    Wróć do domyślnej przerwy we wszystkich
                  </FloatingMenuItem>
                ) : null}
              </>
            )}
          </FloatingMenu>
          {sets.length > 0 ? (
            <IconButton title="Wyczyść rozpisane serie" size="xs" onClick={onClear}>
              ✕
            </IconButton>
          ) : null}
        </div>
      </div>

      {pasteOpen && onReplaceSets ? (
        <Field label="Wklej serie">
          <input
            className={inputClass}
            autoFocus
            value={paste}
            placeholder="65x5, 70x5 albo 8-10x60"
            onChange={(e) => {
              setPaste(e.target.value);
              setPasteError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setPasteOpen(false);
                return;
              }
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
    </div>
  );
}
