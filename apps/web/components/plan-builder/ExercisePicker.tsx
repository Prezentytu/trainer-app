"use client";

import { useMemo, useState } from "react";
import {
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  Exercise,
  ExerciseCategory,
  EXERCISE_TYPE_LABELS,
} from "@/lib/api";
import {
  createExercisePreviewLabel,
  exerciseInputFromQuickEntry,
} from "@/lib/exerciseDraft";
import { filterExercises } from "@/lib/quickEntry";
import { ExerciseThumb } from "@/components/ExerciseThumb";
import { Button, inputClass } from "@/components/ui";
import { CreateExerciseRow } from "./CreateExerciseRow";
import { useExerciseLibraryActions } from "./ExerciseLibraryContext";

export function ExercisePicker({ exercises, onAdd }: { exercises: Exercise[]; onAdd: (exerciseId: number) => void }) {
  const { createExercise, requestNewExercise } = useExerciseLibraryActions();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<ExerciseCategory | "all">("all");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const byName = filterExercises(query, exercises);
    return categoryFilter === "all"
      ? byName
      : byName.filter((e) => e.category === categoryFilter);
  }, [exercises, query, categoryFilter]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const e of exercises) {
      if (!e.category) continue;
      counts[e.category] = (counts[e.category] ?? 0) + 1;
    }
    return counts;
  }, [exercises]);
  const q = query.trim();
  const showCreate = q.length > 0 && filtered.length === 0;
  const draftInput = useMemo(() => exerciseInputFromQuickEntry(q), [q]);
  const previewLabel = createExercisePreviewLabel(draftInput);

  const close = () => {
    setOpen(false);
    setQuery("");
    setCategoryFilter("all");
    setCreateError(null);
  };

  const openDetails = () => {
    if (!showCreate || creating) return;
    requestNewExercise({
      prefill: draftInput,
      onCreated: (exercise) => {
        onAdd(exercise.id);
        close();
      },
    });
  };

  const createAndAdd = async () => {
    if (!showCreate || creating) return;
    setCreating(true);
    setCreateError(null);
    try {
      const { exercise } = await createExercise(draftInput);
      onAdd(exercise.id);
      close();
    } catch (err) {
      setCreateError((err as Error).message);
    } finally {
      setCreating(false);
    }
  };

  if (!open) {
    return (
      <Button variant="ghost" onClick={() => setOpen(true)}>
        + Dodaj ćwiczenie
      </Button>
    );
  }

  return (
    <div className="rounded-[10px] border border-dashed border-border-strong bg-surface-sunken p-2">
      <input
        autoFocus
        className={`${inputClass} mb-2 w-full`}
        placeholder="Szukaj ćwiczenia po nazwie…"
        value={query}
        disabled={creating}
        onChange={(e) => {
          setQuery(e.target.value);
          setCreateError(null);
        }}
      />
      <div className="mb-2 flex flex-wrap gap-1">
        <button
          type="button"
          onClick={() => setCategoryFilter("all")}
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
            categoryFilter === "all"
              ? "bg-surface-hover font-semibold text-foreground"
              : "bg-surface-active text-muted"
          }`}
        >
          Wszystkie
        </button>
        {CATEGORY_ORDER.filter((c) => (categoryCounts[c] ?? 0) > 0).map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCategoryFilter(c)}
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
              categoryFilter === c
                ? "bg-surface-hover font-semibold text-foreground"
                : "bg-surface-active text-muted"
            }`}
          >
            {CATEGORY_LABELS[c]}
          </button>
        ))}
      </div>
      <div className="max-h-56 overflow-y-auto">
        {filtered.length === 0 && !showCreate ? (
          <p className="px-2 py-3 text-center text-xs text-muted">Brak wyników.</p>
        ) : (
          <>
            {filtered.map((e) => {
              const thumb = e.media?.find((m) => m.kind === "demo") ?? e.media?.[0];
              return (
              <button
                key={e.id}
                type="button"
                onClick={() => {
                  onAdd(e.id);
                  close();
                }}
                className="flex w-full items-center gap-2 rounded-[10px] px-2 py-1.5 text-left text-sm text-foreground hover:bg-surface-hover"
              >
                <div className="h-10 w-10 shrink-0">
                  <ExerciseThumb
                    variant="square"
                    youtubeId={thumb?.youtubeId}
                    category={e.category}
                    alt={e.name}
                  />
                </div>
                <span className="min-w-0 flex-1 break-words">{e.name}</span>
                <span className="shrink-0 text-xs text-muted">
                  {e.category && e.category in CATEGORY_LABELS
                    ? CATEGORY_LABELS[e.category as ExerciseCategory]
                    : EXERCISE_TYPE_LABELS[e.type]}
                </span>
              </button>
              );
            })}
            {showCreate && (
              <CreateExerciseRow
                name={q}
                previewLabel={previewLabel}
                active
                creating={creating}
                error={createError}
                onCreate={() => void createAndAdd()}
                onDetails={openDetails}
              />
            )}
          </>
        )}
      </div>
      <div className="mt-1 flex justify-end">
        <Button variant="ghost" size="sm" onClick={close}>
          Zamknij
        </Button>
      </div>
    </div>
  );
}
