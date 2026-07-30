"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  Exercise,
  ExerciseCategory,
  ExerciseType,
  EXERCISE_TYPE_LABELS,
} from "@/lib/api";
import {
  createExercisePreviewLabel,
  exerciseInputFromQuickEntry,
} from "@/lib/exerciseDraft";
import { filterExercises } from "@/lib/quickEntry";
import { ExerciseThumb } from "@/components/ExerciseThumb";
import { formatRest, inputClass } from "@/components/ui";
import { CreateExerciseRow } from "./CreateExerciseRow";
import { useExerciseLibraryActions } from "./ExerciseLibraryContext";

function defaultsLine(e: Exercise): string {
  if (e.type === "time") {
    const dur = e.defaultRepDurationSeconds ? `${e.defaultRepDurationSeconds}s` : "—";
    return `${e.defaultSets} × ${dur} · ${formatRest(e.defaultRestBetweenSetsSeconds)}`;
  }
  if (e.type === "distance") {
    const dist = e.defaultDistanceMeters ? `${e.defaultDistanceMeters} m` : "—";
    return `${e.defaultSets} × ${dist} · ${formatRest(e.defaultRestBetweenSetsSeconds)}`;
  }
  const load = e.defaultLoadKg != null ? ` @ ${e.defaultLoadKg} kg` : "";
  return `${e.defaultSets} × ${e.defaultReps}${load} · ${formatRest(e.defaultRestBetweenSetsSeconds)}`;
}

const TYPE_FILTERS: Array<{ id: ExerciseType | "all"; label: string }> = [
  { id: "all", label: "Typ" },
  { id: "reps", label: EXERCISE_TYPE_LABELS.reps },
  { id: "time", label: EXERCISE_TYPE_LABELS.time },
  { id: "distance", label: EXERCISE_TYPE_LABELS.distance },
];

function DrawerBody({
  exercises,
  onClose,
  onAdd,
}: {
  exercises: Exercise[];
  onClose: () => void;
  onAdd: (exerciseId: number) => void;
}) {
  const { createExercise, requestNewExercise } = useExerciseLibraryActions();
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<ExerciseType | "all">("all");
  const [categoryFilter, setCategoryFilter] = useState<ExerciseCategory | "all">("all");
  const [highlight, setHighlight] = useState(0);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const e of exercises) {
      if (!e.category) continue;
      counts[e.category] = (counts[e.category] ?? 0) + 1;
    }
    return counts;
  }, [exercises]);

  const filtered = useMemo(() => {
    let list = filterExercises(query, exercises);
    if (categoryFilter !== "all") list = list.filter((e) => e.category === categoryFilter);
    if (typeFilter !== "all") list = list.filter((e) => e.type === typeFilter);
    return list;
  }, [exercises, query, typeFilter, categoryFilter]);

  const q = query.trim();
  const showCreate = q.length > 0 && filtered.length === 0;
  const optionCount = filtered.length + (showCreate ? 1 : 0);
  const createIndex = showCreate ? filtered.length : -1;
  const safeHighlight = optionCount === 0 ? 0 : Math.min(highlight, optionCount - 1);
  const createActive = showCreate && safeHighlight === createIndex;

  const draftInput = useMemo(() => exerciseInputFromQuickEntry(q), [q]);
  const previewLabel = createExercisePreviewLabel(draftInput);

  const commit = (id: number) => {
    onAdd(id);
    onClose();
  };

  const openDetails = () => {
    if (!showCreate || creating) return;
    requestNewExercise({
      prefill: draftInput,
      onCreated: (exercise) => commit(exercise.id),
    });
  };

  const createAndCommit = async () => {
    if (!showCreate || creating) return;
    setCreating(true);
    setCreateError(null);
    try {
      const { exercise } = await createExercise(draftInput);
      commit(exercise.id);
    } catch (err) {
      setCreateError((err as Error).message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <aside className="relative flex h-full w-full max-w-[380px] flex-col border-l border-border bg-surface shadow-modal">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <h2 className="font-display text-lg font-bold">Dodaj ćwiczenie</h2>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-9 w-9 items-center justify-center rounded-[10px] text-muted hover:bg-surface-hover"
          aria-label="Zamknij"
        >
          ×
        </button>
      </div>

      <div className="space-y-3 border-b border-border px-5 py-4">
        <input
          ref={(el) => {
            inputRef.current = el;
            el?.focus();
          }}
          className={inputClass}
          placeholder="Szukaj ćwiczenia…"
          value={query}
          disabled={creating}
          onChange={(e) => {
            setQuery(e.target.value);
            setHighlight(0);
            setCreateError(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              if (optionCount) setHighlight((h) => Math.min(h + 1, optionCount - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setHighlight((h) => Math.max(h - 1, 0));
            } else if (e.key === "Tab" && createActive) {
              e.preventDefault();
              openDetails();
            } else if (e.key === "Enter") {
              e.preventDefault();
              if (creating) return;
              if (createActive) void createAndCommit();
              else if (filtered[safeHighlight]) commit(filtered[safeHighlight].id);
            } else if (e.key === "Escape") {
              onClose();
            }
          }}
        />
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => {
              setCategoryFilter("all");
              setHighlight(0);
            }}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              categoryFilter === "all"
                ? "bg-accent text-accent-foreground"
                : "bg-surface-active text-muted hover:text-foreground-secondary"
            }`}
          >
            Wszystkie
          </button>
          {CATEGORY_ORDER.filter((c) => (categoryCounts[c] ?? 0) > 0).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => {
                setCategoryFilter(c);
                setHighlight(0);
              }}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                categoryFilter === c
                  ? "bg-accent text-accent-foreground"
                  : "bg-surface-active text-muted hover:text-foreground-secondary"
              }`}
            >
              {CATEGORY_LABELS[c]}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {TYPE_FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => {
                setTypeFilter(f.id);
                setHighlight(0);
              }}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                typeFilter === f.id
                  ? "bg-accent text-accent-foreground"
                  : "bg-surface-active text-muted hover:text-foreground-secondary"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2">
        {filtered.length === 0 && !showCreate ? (
          <p className="px-2 py-6 text-center text-sm text-muted">Brak wyników.</p>
        ) : (
          <>
            {filtered.map((e, idx) => {
              const active = idx === safeHighlight;
              const thumb = e.media?.find((m) => m.kind === "demo") ?? e.media?.[0];
              return (
                <button
                  key={e.id}
                  type="button"
                  onMouseEnter={() => setHighlight(idx)}
                  onClick={() => commit(e.id)}
                  className={`flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5 text-left transition-colors ${
                    active ? "border border-border-strong bg-surface-hover" : "border border-transparent"
                  }`}
                >
                  <div className="w-14 shrink-0">
                    <ExerciseThumb
                      youtubeId={thumb?.youtubeId}
                      category={e.category}
                      alt={e.name}
                      seconds={thumb?.seconds}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="break-words text-sm font-medium">{e.name}</p>
                    <p className="mt-0.5 font-mono text-xs tabular-nums text-muted">
                      {e.category && e.category in CATEGORY_LABELS
                        ? CATEGORY_LABELS[e.category as ExerciseCategory]
                        : EXERCISE_TYPE_LABELS[e.type]}{" "}
                      · {defaultsLine(e)}
                    </p>
                  </div>
                  {active ? (
                    <span className="shrink-0 rounded-[10px] bg-accent px-2.5 py-1 text-xs font-semibold text-accent-foreground">
                      Dodaj
                    </span>
                  ) : (
                    <span className="shrink-0 text-muted-faint">+</span>
                  )}
                </button>
              );
            })}
            {showCreate && (
              <div onMouseEnter={() => setHighlight(createIndex)} className="mt-1">
                <CreateExerciseRow
                  name={q}
                  previewLabel={previewLabel}
                  active={createActive}
                  creating={creating}
                  error={createError}
                  onCreate={() => void createAndCommit()}
                  onDetails={openDetails}
                />
              </div>
            )}
          </>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-border px-5 py-3 text-xs text-muted">
        <span>
          {filtered.length} z {exercises.length}
        </span>
        <button
          type="button"
          onClick={() =>
            requestNewExercise({
              prefill: exerciseInputFromQuickEntry(q || "Nowe ćwiczenie"),
              onCreated: (exercise) => commit(exercise.id),
            })
          }
          className="text-accent hover:text-accent-strong"
        >
          + Nowe ćwiczenie
        </button>
        <Link
          href="/exercises"
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted hover:text-foreground-secondary"
        >
          Otwórz bibliotekę ↗
        </Link>
      </div>
    </aside>
  );
}

export function ExerciseDrawer({
  open,
  exercises,
  onClose,
  onAdd,
}: {
  open: boolean;
  exercises: Exercise[];
  onClose: () => void;
  onAdd: (exerciseId: number) => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button type="button" aria-label="Zamknij" className="absolute inset-0 bg-[var(--overlay-scrim)]" onClick={onClose} />
      <DrawerBody key="drawer-open" exercises={exercises} onClose={onClose} onAdd={onAdd} />
    </div>
  );
}
