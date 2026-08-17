"use client";

import { useEffect, useId, useRef, useState } from "react";
import { isDefaultDayLabel, WEEKDAY_CHIPS, WEEKDAY_NAMES } from "@/lib/schedule";
import { inputClass } from "@/components/ui";
import { BuilderDay } from "./types";

export function DayMenu({
  day,
  weeks,
  onPatch,
  onApplyToOtherWeeks,
  onDuplicate,
  onRemove,
  nameClassName,
}: {
  day: BuilderDay;
  weeks: number[];
  onPatch: (patch: Partial<BuilderDay>) => void;
  onApplyToOtherWeeks?: () => void;
  onDuplicate: (targetWeek?: number) => void;
  onRemove: () => void;
  nameClassName: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const dialogId = useId();
  const titleId = useId();
  const otherWeeks = weeks.filter((w) => w !== day.weekNumber);
  const showApply = Boolean(onApplyToOtherWeeks) && weeks.length > 1;

  useEffect(() => {
    if (!open) return;
    nameRef.current?.focus();
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const pickWeekday = (iso: number) => {
    if (day.dayOfWeek === iso) {
      onPatch({ dayOfWeek: null });
      return;
    }
    const patch: Partial<BuilderDay> = { dayOfWeek: iso };
    if (isDefaultDayLabel(day.label, day.order)) {
      patch.label = WEEKDAY_NAMES[iso];
    }
    onPatch(patch);
  };

  return (
    <div className="relative min-w-0 flex-1" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-controls={open ? dialogId : undefined}
        title="Ustawienia dnia"
        className={nameClassName}
      >
        {day.label.trim() || "Bez nazwy"}
      </button>
      {open ? (
        <div
          role="dialog"
          aria-labelledby={titleId}
          id={dialogId}
          className="absolute left-0 top-full z-30 mt-1.5 w-[min(20rem,calc(100vw-2rem))] origin-top-left rounded-[var(--r-card)] border border-border-strong bg-surface p-3 duration-[var(--dur-fast)]"
        >
          <label className="t-label text-muted" htmlFor={`${titleId}-name`} id={titleId}>
            Nazwa dnia
          </label>
          <input
            id={`${titleId}-name`}
            ref={nameRef}
            className={`${inputClass} mt-1.5`}
            value={day.label}
            onChange={(e) => onPatch({ label: e.target.value })}
            placeholder="Nazwa dnia"
          />

          <p className="t-label mt-3 text-muted">Dzień tygodnia</p>
          <div className="mt-1.5 grid grid-cols-7 gap-1">
            {WEEKDAY_CHIPS.map((c) => (
              <button
                key={c.iso}
                type="button"
                className={`inline-flex h-7 items-center justify-center rounded-[10px] font-mono text-[12px] ${
                  day.dayOfWeek === c.iso
                    ? "bg-invert-bg font-semibold text-invert-fg"
                    : "border border-border-strong font-medium text-foreground-secondary hover:bg-surface-hover"
                }`}
                onClick={() => pickWeekday(c.iso)}
              >
                {c.label}
              </button>
            ))}
          </div>
          {showApply && onApplyToOtherWeeks ? (
            <button
              type="button"
              className="mt-1.5 w-full rounded-[var(--r-field)] px-2 py-2 text-left text-sm text-foreground-secondary hover:bg-surface-hover hover:text-foreground"
              onClick={() => {
                onApplyToOtherWeeks();
                setOpen(false);
              }}
            >
              Zastosuj te dni do pozostałych tygodni
            </button>
          ) : null}

          <label className="t-label mt-3 block text-muted" htmlFor={`${titleId}-notes`}>
            Notatka / rozgrzewka
          </label>
          <textarea
            id={`${titleId}-notes`}
            className={`${inputClass} mt-1.5 h-auto min-h-[4.5rem] py-2`}
            rows={2}
            value={day.notes ?? ""}
            onChange={(e) => onPatch({ notes: e.target.value || null })}
            placeholder="np. rozgrzewka ogólna, zasady tempa"
          />

          <div className="mt-3 border-t border-border pt-2">
            <button
              type="button"
              className="block w-full rounded-[var(--r-field)] px-2 py-2 text-left text-sm text-foreground-secondary hover:bg-surface-hover hover:text-foreground"
              onClick={() => {
                onDuplicate();
                setOpen(false);
              }}
            >
              Duplikuj w tym tygodniu
            </button>
            {otherWeeks.map((w) => (
              <button
                key={w}
                type="button"
                className="block w-full rounded-[var(--r-field)] px-2 py-2 text-left text-sm text-foreground-secondary hover:bg-surface-hover hover:text-foreground"
                onClick={() => {
                  onDuplicate(w);
                  setOpen(false);
                }}
              >
                Duplikuj do tygodnia {w}
              </button>
            ))}
            <button
              type="button"
              className="block w-full rounded-[var(--r-field)] px-2 py-2 text-left text-sm text-danger hover:bg-danger-bg"
              onClick={() => {
                setOpen(false);
                onRemove();
              }}
            >
              Usuń dzień
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
