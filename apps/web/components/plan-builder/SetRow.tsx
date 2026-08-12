"use client";

import { useEffect, useRef, useState } from "react";
import { SET_ROLE_LABELS } from "@/lib/api";
import { IconButton } from "@/components/ui";
import { NumInput } from "./NumInput";

export const editorChipOn =
  "inline-flex h-[30px] items-center justify-center rounded-[10px] bg-invert-bg px-2.5 font-mono text-xs font-semibold tabular-nums text-invert-fg";
export const editorChipOff =
  "inline-flex h-[30px] items-center justify-center rounded-[10px] border border-border-strong bg-transparent px-2.5 font-mono text-xs font-medium tabular-nums text-foreground-secondary hover:bg-surface-hover";

const ROLE_OPTIONS = ["work", "warmup", "ramp", "top", "backoff"] as const;

export function SetRow({
  label,
  reps,
  repsMax,
  loadKg,
  loadPercent,
  loadKind,
  role,
  onReps,
  onRepsMax,
  onLoadKg,
  onLoadPercent,
  onLoadKind,
  onRole,
  onRemove,
  onLoadFocus,
  removeTitle = "Usuń serię",
}: {
  label: string;
  reps: number | null;
  repsMax: number | null;
  loadKg: number | null;
  loadPercent: number | null;
  /** kg albo % — nie oba naraz. */
  loadKind: "kg" | "percent";
  role?: string | null;
  onReps: (v: number | null) => void;
  onRepsMax: (v: number | null) => void;
  onLoadKg: (v: number | null) => void;
  onLoadPercent: (v: number | null) => void;
  onLoadKind?: (kind: "kg" | "percent") => void;
  onRole?: (role: string) => void;
  onRemove: () => void;
  onLoadFocus?: () => void;
  removeTitle?: string;
}) {
  const [roleOpen, setRoleOpen] = useState(false);
  const roleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!roleOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (roleRef.current && !roleRef.current.contains(e.target as Node)) setRoleOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setRoleOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [roleOpen]);

  const setPercent = (v: number | null) => {
    onLoadPercent(v);
    if (v != null) onLoadKg(null);
  };

  const setKg = (v: number | null) => {
    onLoadKg(v);
    if (v != null) onLoadPercent(null);
  };

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-border py-2 last:border-b-0">
      <div className="relative w-10 shrink-0" ref={roleRef}>
        {onRole ? (
          <>
            <button
              type="button"
              onClick={() => setRoleOpen((v) => !v)}
              className="t-label w-full text-left text-muted hover:text-foreground"
              title="Rola serii"
              aria-haspopup="menu"
              aria-expanded={roleOpen}
            >
              {label}
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
          <span className="t-label text-muted">{label}</span>
        )}
      </div>

      <div className="flex min-w-[7rem] flex-1 items-center gap-1.5">
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

      <div className="flex w-[7.5rem] shrink-0 items-center gap-1" onFocus={onLoadFocus}>
        {loadKind === "percent" ? (
          <NumInput
            value={loadPercent}
            min={1}
            max={100}
            step={1}
            onChange={setPercent}
            placeholder="80"
            aria-label="% obciążenia"
          />
        ) : (
          <NumInput
            value={loadKg}
            min={0}
            step={0.5}
            onChange={setKg}
            placeholder="kg"
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

      <IconButton title={removeTitle} size="xs" onClick={onRemove}>
        ✕
      </IconButton>
    </div>
  );
}
