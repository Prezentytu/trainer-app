"use client";

import { useEffect, useRef, useState } from "react";
import { PercentBase, SET_ROLE_LABELS } from "@/lib/api";
import { Field, IconButton, inputClass } from "@/components/ui";
import { NumInput } from "./NumInput";
import { editorChipOff, editorChipOn } from "./editorChips";

export { editorChipOff, editorChipOn } from "./editorChips";

export const SET_ROW_GRID =
  "grid-cols-[minmax(4.5rem,auto)_minmax(0,1fr)_minmax(0,1fr)_2.5rem_2.5rem]";

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
  computedKg,
  onReps,
  onRepsMax,
  onLoadKg,
  onLoadPercent,
  onLoadKind,
  onRole,
  onMorePatch,
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
  computedKg?: number | null;
  onReps: (v: number | null) => void;
  onRepsMax: (v: number | null) => void;
  onLoadKg: (v: number | null) => void;
  onLoadPercent: (v: number | null) => void;
  onLoadKind?: (kind: "kg" | "percent") => void;
  onRole?: (role: string) => void;
  onMorePatch?: (patch: {
    tempo?: string | null;
    targetRpe?: number | null;
    targetRir?: number | null;
    note?: string | null;
    durationSeconds?: number | null;
    distanceMeters?: number | null;
    percentOf?: PercentBase | null;
  }) => void;
  onRemove: () => void;
  onLoadFocus?: () => void;
  removeTitle?: string;
}) {
  const [roleOpen, setRoleOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const roleRef = useRef<HTMLDivElement>(null);
  const display = label ?? `${index} · ${roleShort(role)}`;

  useEffect(() => {
    if (!roleOpen) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (roleRef.current && !roleRef.current.contains(t)) setRoleOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setRoleOpen(false);
        setMoreOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [roleOpen]);

  return (
    <div>
      <div className={`grid ${SET_ROW_GRID} items-center gap-2`}>
        <div className="relative min-w-0" ref={roleRef}>
          {onRole ? (
            <>
              <button
                type="button"
                onClick={() => setRoleOpen((v) => !v)}
                className="t-label w-full whitespace-nowrap text-left text-muted hover:text-foreground"
                title="Rola serii"
                aria-haspopup="menu"
                aria-expanded={roleOpen}
              >
                {display}
              </button>
              {roleOpen ? (
                <div
                  role="menu"
                  className="absolute left-0 top-full z-30 mt-1 min-w-[8.5rem] rounded-[10px] border border-border-strong bg-surface p-1"
                >
                  {ROLE_OPTIONS.map((r) => (
                    <button
                      key={r}
                      type="button"
                      role="menuitem"
                      className={`flex w-full rounded-[8px] px-2.5 py-1.5 text-left text-sm ${
                        (role ?? "work") === r
                          ? "bg-surface-active text-foreground"
                          : "text-foreground-secondary hover:bg-surface-hover"
                      }`}
                      onClick={() => {
                        onRole(r);
                        setRoleOpen(false);
                      }}
                    >
                      {SET_ROLE_LABELS[r]}
                    </button>
                  ))}
                </div>
              ) : null}
            </>
          ) : (
            <span className="t-label whitespace-nowrap text-muted">{display}</span>
          )}
        </div>

        <div className="min-w-0" onFocus={onLoadFocus}>
          <div className="flex items-center gap-1">
            {loadKind === "percent" ? (
              <NumInput
                value={loadPercent}
                min={1}
                max={100}
                step={1}
                onChange={onLoadPercent}
                placeholder="80"
                aria-label="% obciążenia"
              />
            ) : (
              <NumInput
                value={loadKg}
                min={0}
                step={0.5}
                onChange={onLoadKg}
                placeholder="—"
                aria-label="Ciężar kg"
              />
            )}
            {onLoadKind ? (
              <button
                type="button"
                className="t-label shrink-0 text-muted hover:text-foreground"
                onClick={() => onLoadKind(loadKind === "kg" ? "percent" : "kg")}
                title={loadKind === "kg" ? "Przełącz na %" : "Przełącz na kg"}
              >
                {loadKind === "kg" ? "kg" : "%"}
              </button>
            ) : (
              <span className="t-label shrink-0 text-muted">{loadKind === "kg" ? "kg" : "%"}</span>
            )}
          </div>
        </div>

        <div className="flex min-w-0 items-center gap-1">
          <NumInput
            value={reps}
            min={1}
            onChange={onReps}
            placeholder="8"
            aria-label="Powtórzenia od"
          />
          <span className="text-muted-faint">–</span>
          <NumInput
            value={repsMax}
            min={1}
            onChange={onRepsMax}
            placeholder="—"
            aria-label="Powtórzenia do"
          />
        </div>

        {onMorePatch ? (
          <button
            type="button"
            onClick={() => setMoreOpen((v) => !v)}
            className="inline-flex min-h-10 min-w-10 items-center justify-center text-sm text-muted-faint hover:text-foreground"
            aria-expanded={moreOpen}
            title="Więcej pól serii"
          >
            {moreOpen ? "▴" : "···"}
          </button>
        ) : (
          <span />
        )}

        <IconButton title={removeTitle} size="sm" onClick={onRemove}>
          ✕
        </IconButton>
      </div>
      {onMorePatch && moreOpen ? (
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
          {measureType === "time" ? (
            <Field label="Czas (s)">
              <NumInput
                value={durationSeconds ?? null}
                min={1}
                onChange={(v) => onMorePatch({ durationSeconds: v })}
                placeholder="—"
              />
            </Field>
          ) : null}
          {measureType === "distance" ? (
            <Field label="Dystans (m)">
              <NumInput
                value={distanceMeters ?? null}
                min={1}
                onChange={(v) => onMorePatch({ distanceMeters: v })}
                placeholder="—"
              />
            </Field>
          ) : null}
          {loadKind === "percent" ? (
            <div className="col-span-2">
              <p className="t-label mb-1.5 text-muted">Baza %</p>
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
        </div>
      ) : null}
    </div>
  );
}
