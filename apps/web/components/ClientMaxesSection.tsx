"use client";

import { FormEvent, useMemo, useState } from "react";
import { ClientMax, Exercise } from "@/lib/api";
import { DEFAULT_EXERCISE_INPUT } from "@/lib/exerciseDraft";
import { createOrReuseExercise } from "@/lib/exerciseLibrary";
import { foldDiacritics } from "@/lib/exerciseSearch";
import { formatDayShort } from "@/lib/dates";
import { ExerciseCombobox } from "@/components/ExerciseCombobox";
import { Icon } from "@/components/Icon";
import {
  Button,
  Card,
  EmptyState,
  Field,
  inputClass,
  SearchInput,
} from "@/components/ui";

export function ClientMaxesSection({
  maxes,
  exercises,
  onExercisesChange,
  onAdd,
  onUpdate,
  onRemove,
}: {
  maxes: ClientMax[];
  exercises: Exercise[];
  onExercisesChange: (next: Exercise[]) => void;
  onAdd: (input: { exerciseId: number; maxKg: number; measuredOn: string }) => Promise<void>;
  onUpdate: (id: number, input: { maxKg: number; measuredOn: string; note: string | null }) => Promise<void>;
  onRemove: (max: ClientMax) => void;
}) {
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(8);
  const [showForm, setShowForm] = useState(false);
  const [exerciseId, setExerciseId] = useState<number | null>(null);
  const [exerciseError, setExerciseError] = useState<string | null>(null);
  const [kg, setKg] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editKg, setEditKg] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editNote, setEditNote] = useState("");

  const latest = useMemo(() => {
    const map = new Map<number, ClientMax>();
    for (const m of maxes) {
      if (!map.has(m.exerciseId)) map.set(m.exerciseId, m);
    }
    return [...map.values()];
  }, [maxes]);

  const filtered = useMemo(() => {
    const q = foldDiacritics(query.trim());
    const rows = q
      ? latest.filter((m) => foldDiacritics(m.exerciseName).includes(q))
      : latest;
    return rows.sort((a, b) => a.exerciseName.localeCompare(b.exerciseName, "pl"));
  }, [latest, query]);

  const visible = filtered.slice(0, limit);

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault();
    setExerciseError(null);
    if (exerciseId == null) {
      setExerciseError("Wybierz ćwiczenie.");
      return;
    }
    if (!kg) return;
    await onAdd({
      exerciseId,
      maxKg: Number(kg.replace(",", ".")),
      measuredOn: date,
    });
    setKg("");
    setExerciseId(null);
    setShowForm(false);
  };

  const startEdit = (m: ClientMax) => {
    setEditingId(m.id);
    setEditKg(String(m.maxKg));
    setEditDate(m.measuredOn);
    setEditNote(m.note ?? "");
  };

  const saveEdit = async (id: number) => {
    await onUpdate(id, {
      maxKg: Number(editKg.replace(",", ".")),
      measuredOn: editDate,
      note: editNote.trim() || null,
    });
    setEditingId(null);
  };

  return (
    <section>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
          <Icon name="barbell" size={16} className="text-foreground-secondary" decorative />
          Maxy (1RM)
        </h2>
        {!showForm ? (
          <Button variant="secondary" onClick={() => setShowForm(true)}>
            Dodaj max
          </Button>
        ) : null}
      </div>

      {showForm ? (
        <Card className="mb-4" title="Dodaj max (1RM)">
          <form onSubmit={(e) => void handleAdd(e)} className="grid gap-3 sm:grid-cols-4">
            <div className="flex flex-col gap-1.5 text-sm sm:col-span-1">
              <span className="t-label">Ćwiczenie</span>
              <ExerciseCombobox
                exercises={exercises}
                value={exerciseId}
                placeholder="Szukaj lub utwórz ćwiczenie…"
                onSelect={(exercise) => {
                  setExerciseId(exercise.id);
                  setExerciseError(null);
                  onExercisesChange(
                    exercises.some((e) => e.id === exercise.id)
                      ? exercises
                      : [...exercises, exercise].sort((a, b) => a.name.localeCompare(b.name, "pl")),
                  );
                }}
                onCreate={async (input) => {
                  const { exercise } = await createOrReuseExercise({
                    ...DEFAULT_EXERCISE_INPUT,
                    ...input,
                  });
                  onExercisesChange(
                    exercises.some((e) => e.id === exercise.id)
                      ? exercises
                      : [...exercises, exercise].sort((a, b) => a.name.localeCompare(b.name, "pl")),
                  );
                  return exercise;
                }}
              />
              {exerciseError ? <p className="mt-1 text-xs text-danger">{exerciseError}</p> : null}
            </div>
            <Field label="Kg">
              <input
                className={inputClass}
                value={kg}
                onChange={(e) => setKg(e.target.value)}
                inputMode="decimal"
                placeholder="100"
              />
            </Field>
            <Field label="Data">
              <input className={inputClass} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </Field>
            <div className="flex flex-wrap items-end gap-2">
              <Button type="submit">Dodaj max</Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setShowForm(false);
                  setExerciseError(null);
                }}
              >
                Anuluj
              </Button>
            </div>
          </form>
        </Card>
      ) : null}

      {latest.length === 0 ? (
        <EmptyState
          title="Dodaj 1RM do planów procentowych"
          action={
            <Button size="sm" onClick={() => setShowForm(true)}>
              Dodaj max
            </Button>
          }
        >
          Bez maxów plany oparte o %1RM nie wyliczą kilogramów na serie.
        </EmptyState>
      ) : (
        <div className="space-y-3">
          <SearchInput
            value={query}
            onChange={(v) => {
              setQuery(v);
              setLimit(8);
            }}
            placeholder="Szukaj maxa…"
            aria-label="Szukaj maxa"
          />
          <div className="divide-y divide-border border-y border-border">
            {visible.map((m) => (
              <div key={m.id} className="py-2.5">
                {editingId === m.id ? (
                  <form
                    className="grid gap-2 sm:grid-cols-4"
                    onSubmit={(e) => {
                      e.preventDefault();
                      void saveEdit(m.id);
                    }}
                  >
                    <p className="min-w-0 break-words text-sm font-medium sm:col-span-4">{m.exerciseName}</p>
                    <Field label="Kg">
                      <input
                        className={inputClass}
                        value={editKg}
                        onChange={(e) => setEditKg(e.target.value)}
                        inputMode="decimal"
                      />
                    </Field>
                    <Field label="Data">
                      <input
                        className={inputClass}
                        type="date"
                        value={editDate}
                        onChange={(e) => setEditDate(e.target.value)}
                      />
                    </Field>
                    <Field label="Notatka">
                      <input
                        className={inputClass}
                        value={editNote}
                        onChange={(e) => setEditNote(e.target.value)}
                      />
                    </Field>
                    <div className="flex flex-wrap items-end gap-2">
                      <Button type="submit" size="sm">
                        Zapisz
                      </Button>
                      <Button type="button" variant="ghost" size="sm" onClick={() => setEditingId(null)}>
                        Anuluj
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="min-w-0 break-words text-sm font-medium">{m.exerciseName}</p>
                      <p className="text-xs text-muted">
                        {formatDayShort(m.measuredOn)}
                        {m.note ? ` · ${m.note}` : ""}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="font-mono text-sm font-semibold tabular-nums">{m.maxKg} kg</span>
                      <Button variant="ghost" size="sm" onClick={() => startEdit(m)}>
                        Edytuj
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => onRemove(m)}>
                        Usuń
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          {filtered.length > limit ? (
            <Button variant="ghost" onClick={() => setLimit((n) => n + 50)}>
              Pokaż wszystkie ({filtered.length})
            </Button>
          ) : null}
        </div>
      )}
    </section>
  );
}
