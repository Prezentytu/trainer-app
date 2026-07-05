"use client";

import { useMemo, useState } from "react";
import { Exercise, EXERCISE_TYPE_LABELS } from "@/lib/api";
import { Button, inputClass } from "@/components/ui";

export function ExercisePicker({ exercises, onAdd }: { exercises: Exercise[]; onAdd: (exerciseId: number) => void }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return exercises;
    return exercises.filter((e) => e.name.toLowerCase().includes(q) || EXERCISE_TYPE_LABELS[e.type].includes(q));
  }, [exercises, query]);

  const close = () => {
    setOpen(false);
    setQuery("");
  };

  if (!open) {
    return (
      <Button variant="ghost" onClick={() => setOpen(true)}>
        + Dodaj ćwiczenie
      </Button>
    );
  }

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950/80 p-2">
      <input
        autoFocus
        className={`${inputClass} mb-2 w-full`}
        placeholder="Szukaj ćwiczenia po nazwie…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <div className="max-h-56 overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="px-2 py-3 text-center text-xs text-zinc-500">Brak wyników.</p>
        ) : (
          filtered.map((e) => (
            <button
              key={e.id}
              type="button"
              onClick={() => {
                onAdd(e.id);
                close();
              }}
              className="flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left text-sm text-zinc-200 hover:bg-zinc-800"
            >
              <span>{e.name}</span>
              <span className="shrink-0 text-[11px] text-zinc-500">{EXERCISE_TYPE_LABELS[e.type]}</span>
            </button>
          ))
        )}
      </div>
      <div className="mt-1 flex justify-end">
        <Button variant="ghost" onClick={close}>
          Zamknij
        </Button>
      </div>
    </div>
  );
}
