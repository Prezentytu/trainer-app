"use client";

import { useEffect, useRef, useState } from "react";
import { Button, Switch } from "@/components/ui";

export function CopyWeekPopover({
  activeWeek,
  nextWeek,
  onCopy,
}: {
  activeWeek: number;
  nextWeek: number;
  onCopy: (opts: { keepSets: boolean; reapplyPresets: boolean }) => void;
}) {
  const [open, setOpen] = useState(false);
  const [keepSets, setKeepSets] = useState(true);
  const [reapplyPresets, setReapplyPresets] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="rounded-full border border-border px-3.5 py-1.5 text-sm font-medium text-muted transition-colors hover:border-border-strong hover:text-foreground-secondary"
      >
        Kopiuj tydzień
      </button>
      {open && (
        <div className="absolute left-0 top-full z-30 mt-2 w-72 rounded-xl border border-border bg-surface p-4 shadow-raised">
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
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
              Anuluj
            </Button>
            <Button
              size="sm"
              onClick={() => {
                onCopy({ keepSets, reapplyPresets });
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
