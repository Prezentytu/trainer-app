"use client";

import { useState } from "react";
import { Button, Field, inputClass } from "@/components/ui";

export function CopyTargets({
  sourceWeek,
  weeks,
  onCopy,
  onCancel,
  confirmLabel,
}: {
  sourceWeek: number;
  weeks: number[];
  onCopy: (targetWeeks: number[], extraWeeks: number) => void;
  onCancel: () => void;
  confirmLabel: string;
}) {
  const others = weeks.filter((w) => w !== sourceWeek);
  const [selected, setSelected] = useState<number[]>([]);
  const [extra, setExtra] = useState("0");
  const extraCount = Math.max(0, Math.min(12, Math.round(Number(extra.replace(",", ".")) || 0)));
  const canSubmit = selected.length > 0 || extraCount > 0;

  const toggle = (week: number) => {
    setSelected((prev) => (prev.includes(week) ? prev.filter((w) => w !== week) : [...prev, week]));
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-strong">Wybierz tygodnie albo dodaj nowe na końcu.</p>
      {others.length > 0 ? (
        <div>
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <p className="t-label text-muted">Do tygodni</p>
            <button
              type="button"
              className="text-[12px] text-foreground-secondary hover:text-foreground"
              onClick={() => setSelected(selected.length === others.length ? [] : others)}
            >
              {selected.length === others.length ? "Odznacz wszystkie" : "Pozostałe tygodnie"}
            </button>
          </div>
          <div className="flex flex-wrap gap-1">
            {others.map((w) => {
              const on = selected.includes(w);
              return (
                <button
                  key={w}
                  type="button"
                  onClick={() => toggle(w)}
                  className={`min-h-8 min-w-8 rounded-[10px] border px-2.5 py-1 font-mono text-[12px] tabular-nums ${
                    on
                      ? "border-invert-bg bg-invert-bg font-semibold text-invert-fg"
                      : "border-border-strong text-foreground-secondary hover:bg-surface-hover"
                  }`}
                >
                  {w}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
      <Field label="Ile nowych tygodni dodać">
        <input
          className={inputClass}
          inputMode="numeric"
          value={extra}
          onChange={(e) => setExtra(e.target.value)}
        />
      </Field>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          Anuluj
        </Button>
        <Button
          type="button"
          size="sm"
          disabled={!canSubmit}
          onClick={() => onCopy(selected, extraCount)}
        >
          {confirmLabel}
        </Button>
      </div>
    </div>
  );
}
