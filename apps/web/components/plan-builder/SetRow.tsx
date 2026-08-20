"use client";

import { useState } from "react";
import { PercentBase, SET_ROLE_LABELS } from "@/lib/api";
import { Field, IconButton, inputClass } from "@/components/ui";
import { NumInput } from "./NumInput";
import { RangeInput } from "./RangeInput";
import {
  FloatingMenu,
  FloatingMenuItem,
  FloatingMenuLabel,
  FloatingMenuSeparator,
} from "./FloatingMenu";
import { editorChipOff, editorChipOn } from "./editorChips";

export { editorChipOff, editorChipOn } from "./editorChips";

// Rola ma stałą kolumnę — „rozgrzewka” nigdy nie przesuwa ciężaru ani przerwy.
export const SET_ROW_GRID =
  "grid-cols-[6rem_minmax(3rem,1fr)_minmax(3rem,1fr)_minmax(2.75rem,0.85fr)_2.25rem_2.25rem]";

const ROLE_OPTIONS = ["work", "warmup", "ramp", "top", "backoff"] as const;

function roleShort(role: string | null | undefined): string {
  if (role === "backoff") return "BO";
  return SET_ROLE_LABELS[role ?? ""] ?? "robocza";
}

export function SetRow({
  index,
  label,
  reps,
  repsMax,
  loadKg,
  loadPercent,
  loadKind,
  role,
  tempo,
  targetRpe,
  targetRir,
  note,
  durationSeconds,
  distanceMeters,
  percentOf,
  measureType,
  restSeconds,
  defaultRestSeconds,
  loadInputRef,
  onReps,
  onLoadKg,
  onLoadPercent,
  onLoadKind,
  onRole,
  onRest,
  onApplyRestToAll,
  onMorePatch,
  onInsert,
  onRemove,
  onLoadFocus,
  removeTitle = "Usuń serię",
}: {
  index: number;
  label?: string;
  reps: number | null;
  repsMax: number | null;
  loadKg: number | null;
  loadPercent: number | null;
  loadKind: "kg" | "percent";
  role?: string | null;
  tempo?: string | null;
  targetRpe?: number | null;
  targetRir?: number | null;
  note?: string | null;
  durationSeconds?: number | null;
  distanceMeters?: number | null;
  percentOf?: PercentBase | null;
  measureType?: "reps" | "time" | "distance";
  restSeconds?: number | null;
  /** Przerwa ćwiczenia — pokazujemy ją jako muted placeholder, gdy seria nie ma własnej. */
  defaultRestSeconds?: number | null;
  loadInputRef?: React.Ref<HTMLInputElement>;
  onReps: (next: { reps: number | null; repsMax: number | null }) => void;
  onLoadKg: (v: number | null) => void;
  onLoadPercent: (v: number | null) => void;
  onLoadKind?: (kind: "kg" | "percent") => void;
  onRole?: (role: string) => void;
  onRest?: (v: number | null) => void;
  onApplyRestToAll?: (v: number | null) => void;
  onMorePatch?: (patch: {
    tempo?: string | null;
    targetRpe?: number | null;
    targetRir?: number | null;
    note?: string | null;
    durationSeconds?: number | null;
    distanceMeters?: number | null;
    percentOf?: PercentBase | null;
  }) => void;
  onInsert?: (side: "before" | "after") => void;
  onRemove: () => void;
  onLoadFocus?: () => void;
  removeTitle?: string;
}) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const display = label ?? `${index} · ${roleShort(role)}`;
  const hasMore = onMorePatch != null || onInsert != null;

  return (
    <div>
      <div className={`grid ${SET_ROW_GRID} items-center gap-1.5`}>
        <div className="min-w-0">
          {onRole ? (
            <FloatingMenu
              label="Rola serii"
              minWidth="9rem"
              trigger={({ open, toggle, ref }) => (
                <button
                  ref={ref}
                  type="button"
                  onClick={toggle}
                  className="t-label block w-full truncate text-left text-muted transition-colors hover:text-foreground"
                  title={`Rola serii — ${roleShort(role)}`}
                  aria-haspopup="menu"
                  aria-expanded={open}
                >
                  {display}
                </button>
              )}
            >
              {({ close }) =>
                ROLE_OPTIONS.map((r) => (
                  <FloatingMenuItem
                    key={r}
                    active={(role ?? "work") === r}
                    onClick={() => {
                      onRole(r);
                      close();
                    }}
                  >
                    {SET_ROLE_LABELS[r]}
                  </FloatingMenuItem>
                ))
              }
            </FloatingMenu>
          ) : (
            <span className="t-label block truncate text-muted" title={display}>
              {display}
            </span>
          )}
        </div>

        <div className="min-w-0" onFocus={onLoadFocus}>
          {loadKind === "percent" ? (
            <NumInput
              value={loadPercent}
              min={1}
              max={100}
              step={1}
              onChange={onLoadPercent}
              placeholder="80"
              aria-label="Procent obciążenia"
              className="px-1.5"
            />
          ) : (
            <NumInput
              inputRef={loadInputRef}
              value={loadKg}
              min={0}
              step={0.5}
              onChange={onLoadKg}
              placeholder="—"
              aria-label="Ciężar w kilogramach"
              className="px-1.5"
            />
          )}
        </div>

        <div className="min-w-0">
          {measureType === "time" ? (
            <NumInput
              value={durationSeconds ?? null}
              min={1}
              onChange={(v) => onMorePatch?.({ durationSeconds: v })}
              placeholder="30"
              aria-label="Czas serii w sekundach"
              className="px-1.5"
            />
          ) : measureType === "distance" ? (
            <NumInput
              value={distanceMeters ?? null}
              min={1}
              onChange={(v) => onMorePatch?.({ distanceMeters: v })}
              placeholder="20"
              aria-label="Dystans serii w metrach"
              className="px-1.5"
            />
          ) : (
            <RangeInput
              reps={reps}
              repsMax={repsMax}
              onChange={onReps}
              placeholder="8"
              className="px-1.5"
              aria-label="Powtórzenia serii — jedna liczba albo zakres, np. 5-10"
            />
          )}
        </div>

        <div className="min-w-0">
          <NumInput
            value={restSeconds ?? null}
            min={0}
            onChange={(v) => onRest?.(v)}
            placeholder={defaultRestSeconds != null ? String(defaultRestSeconds) : "—"}
            aria-label="Przerwa po tej serii w sekundach"
            className={`px-1.5 ${restSeconds == null ? "text-muted" : ""}`}
            title={
              restSeconds == null
                ? "Dziedziczy domyślną przerwę ćwiczenia"
                : "Własna przerwa tej serii"
            }
          />
        </div>

        {hasMore ? (
          <FloatingMenu
            label="Więcej opcji serii"
            align="right"
            minWidth="12rem"
            trigger={({ open, toggle, ref }) => (
              <button
                ref={ref}
                type="button"
                onClick={toggle}
                className="inline-flex h-[var(--h-control-sm)] w-full items-center justify-center rounded-[var(--r-field)] text-sm text-muted-faint transition-colors hover:bg-surface-hover hover:text-foreground"
                aria-expanded={open}
                aria-haspopup="menu"
                title="Więcej opcji serii"
              >
                …
              </button>
            )}
          >
            {({ close }) => (
              <>
                {onInsert ? (
                  <>
                    <FloatingMenuItem
                      onClick={() => {
                        onInsert("before");
                        close();
                      }}
                    >
                      Wstaw serię przed
                    </FloatingMenuItem>
                    <FloatingMenuItem
                      onClick={() => {
                        onInsert("after");
                        close();
                      }}
                    >
                      Wstaw serię po
                    </FloatingMenuItem>
                    <FloatingMenuSeparator />
                  </>
                ) : null}
                {onRest && restSeconds != null ? (
                  <FloatingMenuItem
                    onClick={() => {
                      onRest(null);
                      close();
                    }}
                  >
                    Użyj domyślnej przerwy
                  </FloatingMenuItem>
                ) : null}
                {onApplyRestToAll && restSeconds != null ? (
                  <FloatingMenuItem
                    onClick={() => {
                      onApplyRestToAll(restSeconds);
                      close();
                    }}
                  >
                    Zastosuj tę przerwę do wszystkich
                  </FloatingMenuItem>
                ) : null}
                {onMorePatch ? (
                  <FloatingMenuItem
                    onClick={() => {
                      setDetailsOpen(true);
                      close();
                    }}
                  >
                    Tempo, RPE, notatka…
                  </FloatingMenuItem>
                ) : null}
                <FloatingMenuSeparator />
                <FloatingMenuLabel>Seria {index}</FloatingMenuLabel>
                <FloatingMenuItem
                  danger
                  onClick={() => {
                    onRemove();
                    close();
                  }}
                >
                  Usuń serię
                </FloatingMenuItem>
              </>
            )}
          </FloatingMenu>
        ) : (
          <span />
        )}

        <IconButton title={removeTitle} size="xs" onClick={onRemove}>
          ✕
        </IconButton>
      </div>

      {onMorePatch && detailsOpen ? (
        <div className="mt-2 grid grid-cols-2 gap-2 rounded-[10px] border border-border bg-surface-sunken p-3">
          <Field label="Tempo">
            <input
              className={inputClass}
              value={tempo ?? ""}
              onChange={(e) => onMorePatch({ tempo: e.target.value.toUpperCase().slice(0, 5) || null })}
              placeholder="3110"
            />
          </Field>
          <Field label="RPE">
            <NumInput
              value={targetRpe ?? null}
              min={1}
              step={0.5}
              onChange={(v) => onMorePatch({ targetRpe: v })}
              placeholder="—"
            />
          </Field>
          <Field label="RIR">
            <NumInput
              value={targetRir ?? null}
              min={0}
              step={0.5}
              onChange={(v) => onMorePatch({ targetRir: v })}
              placeholder="—"
            />
          </Field>
          {onLoadKind ? (
            <Field label="Jednostka">
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  className={loadKind === "kg" ? editorChipOn : editorChipOff}
                  onClick={() => onLoadKind("kg")}
                >
                  kg
                </button>
                <button
                  type="button"
                  className={loadKind === "percent" ? editorChipOn : editorChipOff}
                  onClick={() => onLoadKind("percent")}
                >
                  %
                </button>
              </div>
            </Field>
          ) : null}
          {loadKind === "percent" ? (
            <div className="col-span-2">
              <p className="t-label mb-1.5 text-muted">Baza procentu</p>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  className={(percentOf ?? "top") === "top" ? editorChipOn : editorChipOff}
                  onClick={() => onMorePatch({ percentOf: "top" })}
                >
                  od topu
                </button>
                <button
                  type="button"
                  className={percentOf === "1rm" ? editorChipOn : editorChipOff}
                  onClick={() => onMorePatch({ percentOf: "1rm" })}
                >
                  1RM
                </button>
              </div>
            </div>
          ) : null}
          <div className="col-span-2">
            <Field label="Notatka serii">
              <input
                className={inputClass}
                value={note ?? ""}
                onChange={(e) => onMorePatch({ note: e.target.value || null })}
                placeholder="np. ostatnia seria na zapas"
              />
            </Field>
          </div>
          <div className="col-span-2">
            <button
              type="button"
              onClick={() => setDetailsOpen(false)}
              className="text-sm font-medium text-muted transition-colors hover:text-foreground-secondary"
            >
              Zwiń szczegóły serii
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
