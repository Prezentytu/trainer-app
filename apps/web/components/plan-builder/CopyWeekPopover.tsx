"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/Icon";
import { Button, Field, IconButton, Switch, inputClass } from "@/components/ui";

export type CopyWeekProgression = {
  mode: "none" | "kg" | "percent" | "reps";
  amount: number;
};

export type CopyWeekOpts = {
  keepSets: boolean;
  reapplyPresets: boolean;
  progression: CopyWeekProgression;
};

const MODE_OPTS: { id: CopyWeekProgression["mode"]; label: string }[] = [
  { id: "none", label: "Bez zmian" },
  { id: "kg", label: "+ kg" },
  { id: "percent", label: "+ %" },
  { id: "reps", label: "+ powt." },
];

export function CopyWeekPopover({
  activeWeek,
  nextWeek,
  onCopy,
}: {
  activeWeek: number;
  nextWeek: number;
  onCopy: (opts: CopyWeekOpts) => void;
}) {
  const [open, setOpen] = useState(false);
  const [keepSets, setKeepSets] = useState(true);
  const [reapplyPresets, setReapplyPresets] = useState(false);
  const [mode, setMode] = useState<CopyWeekProgression["mode"]>("none");
  const [amount, setAmount] = useState("2.5");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const parsedAmount = Number(amount.replace(",", "."));
  const amountOk = mode === "none" || (Number.isFinite(parsedAmount) && parsedAmount !== 0);

  return (
    <div className="relative" ref={ref}>
      <IconButton
        title="Kopiuj tydzień"
        size="sm"
        variant="outline"
        active={open}
        onClick={() => setOpen((v) => !v)}
      >
        <Icon name="copy" size={16} decorative />
      </IconButton>
      {open && (
        <div className="absolute left-0 top-full z-30 mt-2 w-80 rounded-[var(--r-card)] border border-border-strong bg-surface p-4">
          <p className="font-display text-sm font-semibold text-foreground">
            Kopiuj Tydzień {activeWeek} →
          </p>
          <p className="mt-1 text-xs text-muted-strong">
            Powiela wszystkie dni i ćwiczenia jako nowy tydzień do dalszej modyfikacji.
          </p>
          <div className="mt-3 space-y-2">
            <Switch
              label="Zachowaj rozpisane serie"
              checked={keepSets}
              onChange={(v) => {
                setKeepSets(v);
                if (!v) setReapplyPresets(false);
              }}
            />
            <Switch
              label="Przelicz preset dla nowego tygodnia"
              checked={reapplyPresets}
              onChange={setReapplyPresets}
              disabled={!keepSets}
            />
          </div>

          <div className="mt-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-muted-faint">
              Progresja
            </p>
            <div className="flex flex-wrap gap-1.5">
              {MODE_OPTS.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => setMode(o.id)}
                  className={`rounded-[10px] border px-2.5 py-1.5 text-xs font-medium transition-colors ${
                    mode === o.id
                      ? "border-accent-border bg-accent-dim text-accent-strong"
                      : "border-border-strong bg-surface-sunken text-foreground-secondary hover:bg-surface-hover"
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
            {mode !== "none" && (
              <div className="mt-2">
                <Field
                  label={
                    mode === "kg" ? "Dodaj kg" : mode === "percent" ? "Dodaj %" : "Dodaj powtórzenia"
                  }
                >
                  <input
                    className={inputClass}
                    inputMode="decimal"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder={mode === "kg" ? "2.5" : mode === "percent" ? "5" : "1"}
                  />
                </Field>
                <p className="mt-1 text-xs text-muted">
                  Zastosuje się do ciężaru / powtórzeń pozycji siłowych w skopiowanym tygodniu.
                </p>
              </div>
            )}
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
              Anuluj
            </Button>
            <Button
              size="sm"
              disabled={!amountOk}
              onClick={() => {
                onCopy({
                  keepSets,
                  reapplyPresets,
                  progression: {
                    mode,
                    amount: mode === "none" ? 0 : parsedAmount,
                  },
                });
                setOpen(false);
              }}
            >
              Kopiuj jako Tydzień {nextWeek}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
