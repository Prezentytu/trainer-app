"use client";

import { KeyboardEvent, useMemo, useRef, useState } from "react";
import { Exercise } from "@/lib/api";
import { ExerciseThumb } from "@/components/ExerciseThumb";
import {
  createExercisePreviewLabel,
  exerciseInputFromQuickEntry,
} from "@/lib/exerciseDraft";
import { formatMeasureCore, measureOverridesFromParsed } from "@/lib/measure";
import { matchExercises, parseQuickEntry } from "@/lib/quickEntry";
import { demoMedia } from "@/lib/youtube";
import { Badge, IconButton, inputClass } from "@/components/ui";
import { ComposerHelp, markComposerHelpSeen, useComposerHelpOpen } from "./ComposerHelp";
import { CreateExerciseRow } from "./CreateExerciseRow";
import { useExerciseLibraryActions } from "./ExerciseLibraryContext";
import { ExercisePicker } from "./ExercisePicker";
import { BuilderDay, BuilderItem } from "./types";

function previewSummary(exercise: Exercise, overrides: Partial<BuilderItem>): string {
  const draft: BuilderItem = {
    key: "",
    exerciseId: exercise.id,
    exerciseName: exercise.name,
    exerciseType: exercise.type,
    measureType: overrides.measureType ?? exercise.type,
    order: 0,
    linkedToNext: false,
    isWarmup: false,
    sets: overrides.sets ?? exercise.defaultSets,
    reps: overrides.reps ?? (exercise.type === "reps" ? exercise.defaultReps : null),
    repsMax: overrides.repsMax ?? null,
    repDurationSeconds:
      overrides.repDurationSeconds ??
      (exercise.type === "time" ? exercise.defaultRepDurationSeconds : null),
    repDurationSecondsMax: overrides.repDurationSecondsMax ?? null,
    distanceMeters:
      overrides.distanceMeters ??
      (exercise.type === "distance" ? exercise.defaultDistanceMeters : null),
    tempo: overrides.tempo ?? null,
    targetRpe: null,
    targetRir: overrides.targetRir ?? null,
    setScheme: null,
    restBetweenSetsSeconds: null,
    restAfterExerciseSeconds: null,
    loadKg: null,
    loadPercent: null,
    notes: null,
    prescribedSets: [],
  };
  const sets = draft.sets;
  const core = formatMeasureCore(draft, exercise);
  const parts = [`${sets}×${core}`];
  if (draft.tempo) parts.push(draft.tempo);
  if (draft.targetRir != null) parts.push(`RIR ${draft.targetRir}`);
  return parts.join(" · ");
}

export function QuickComposer({
  exercises,
  day,
  onAdd,
  onToggleLink,
}: {
  exercises: Exercise[];
  day: BuilderDay;
  onAdd: (exerciseId: number, overrides: Partial<BuilderItem>) => void;
  onToggleLink: (itemKey: string) => void;
}) {
  const { createExercise, requestNewExercise } = useExerciseLibraryActions();
  const { open: helpOpen, onOpenChange: setHelpOpen } = useComposerHelpOpen();
  const [value, setValue] = useState("");
  const [highlighted, setHighlighted] = useState(0);
  const [browsing, setBrowsing] = useState(false);
  const [focused, setFocused] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const lastGroupRef = useRef<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const parsed = useMemo(() => parseQuickEntry(value), [value]);
  const matches = useMemo(() => matchExercises(parsed.query, exercises), [parsed.query, exercises]);
  const query = parsed.query.trim();
  const showCreate = query.length > 0;
  const optionCount = matches.length + (showCreate ? 1 : 0);
  const createIndex = showCreate ? matches.length : -1;
  const activeIndex = optionCount === 0 ? 0 : Math.min(highlighted, optionCount - 1);
  const createActive = showCreate && activeIndex === createIndex;
  const active = !createActive ? (matches[activeIndex] ?? null) : null;

  const draftInput = useMemo(
    () => exerciseInputFromQuickEntry(query, parsed),
    [query, parsed]
  );
  const previewLabel = createExercisePreviewLabel(draftInput);

  const reset = () => {
    setValue("");
    setHighlighted(0);
    setCreateError(null);
  };

  const placeExercise = (exercise: Exercise) => {
    const overrides = measureOverridesFromParsed(parsed, exercise.type);
    const previousItem = day.items[day.items.length - 1];
    onAdd(exercise.id, overrides);

    if (
      parsed.supersetPrefix &&
      lastGroupRef.current === parsed.supersetPrefix.group &&
      previousItem &&
      !previousItem.linkedToNext
    ) {
      onToggleLink(previousItem.key);
    }
    lastGroupRef.current = parsed.supersetPrefix?.group ?? null;

    reset();
    markComposerHelpSeen();
    setHelpOpen(false);
    inputRef.current?.focus();
  };

  const openDetails = () => {
    if (!showCreate || creating) return;
    requestNewExercise({
      prefill: draftInput,
      onCreated: placeExercise,
    });
  };

  const createAndPlace = async () => {
    if (!showCreate || creating) return;
    setCreating(true);
    setCreateError(null);
    try {
      const { exercise } = await createExercise(draftInput);
      placeExercise(exercise);
    } catch (err) {
      setCreateError((err as Error).message);
    } finally {
      setCreating(false);
    }
  };

  const handleTab = () => {
    if (!active) return;
    const prefixRaw = parsed.supersetPrefix
      ? `${parsed.supersetPrefix.group}${parsed.supersetPrefix.letter} `
      : "";
    const paramParts: string[] = [];
    if (parsed.sets != null || parsed.value != null) {
      const unit =
        parsed.measure === "time" ? "s" : parsed.measure === "distance" ? "m" : "";
      const range =
        parsed.valueMax != null ? `${parsed.value}-${parsed.valueMax}` : `${parsed.value ?? ""}`;
      paramParts.push(`${parsed.sets ?? ""}x${range}${unit}`);
    }
    if (parsed.tempo) paramParts.push(parsed.tempo);
    if (parsed.targetRir != null) paramParts.push(`rir${parsed.targetRir}`);
    const suffix = paramParts.length ? ` ${paramParts.join(" ")} ` : " ";
    setValue(`${prefixRaw}${active.name}${suffix}`);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "?" && !value.trim()) {
      e.preventDefault();
      setHelpOpen(!helpOpen);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (optionCount) setHighlighted((h) => Math.min(h + 1, optionCount - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted((h) => Math.max(h - 1, 0));
    } else if (e.key === "Tab") {
      if (createActive) {
        e.preventDefault();
        openDetails();
      } else if (active) {
        e.preventDefault();
        handleTab();
      }
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (creating) return;
      if (createActive) {
        void createAndPlace();
      } else if (active) {
        placeExercise(active);
      }
    } else if (e.key === "Escape") {
      if (helpOpen) {
        setHelpOpen(false);
        return;
      }
      reset();
    }
  };

  if (browsing) {
    return (
      <div className="space-y-2">
        <ExercisePicker
          exercises={exercises}
          onAdd={(exerciseId) => {
            onAdd(exerciseId, {});
            setBrowsing(false);
          }}
        />
        <button
          type="button"
          onClick={() => setBrowsing(false)}
          className="text-xs text-muted-strong hover:text-foreground-secondary"
        >
          ← wróć do szybkiego wpisywania
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="flex items-center gap-1.5">
        {parsed.supersetPrefix && (
          <Badge tone="accent">
            {parsed.supersetPrefix.group}
            {parsed.supersetPrefix.letter}
          </Badge>
        )}
        <div className="relative flex-1">
          <input
            ref={inputRef}
            className={`${inputClass} w-full pr-16`}
            placeholder='np. „przysiad 3x8” lub „deska 3x30s”'
            value={value}
            disabled={creating}
            onChange={(e) => {
              setValue(e.target.value);
              setHighlighted(0);
              setCreateError(null);
            }}
            onKeyDown={handleKeyDown}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
          />
          {focused && value.trim() && (
            <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted">
              ↵ dodaj
            </span>
          )}
        </div>
        <ComposerHelp open={helpOpen} onOpenChange={setHelpOpen} />
        <IconButton title="Przeglądaj listę ćwiczeń" onClick={() => setBrowsing(true)}>
          🔍
        </IconButton>
      </div>

      {value.trim() && optionCount > 0 && (
        <div className="absolute z-10 mt-1 w-full rounded-lg border border-border bg-surface shadow-xl">
          <ul className="max-h-64 overflow-y-auto py-1">
            {matches.map((exercise, idx) => (
              <li key={exercise.id}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => placeExercise(exercise)}
                  onMouseEnter={() => setHighlighted(idx)}
                  className={`flex w-full items-center justify-between gap-3 px-3 py-1.5 text-left text-sm ${
                    idx === activeIndex ? "bg-surface-hover text-foreground" : "text-foreground-secondary"
                  }`}
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <div className="h-8 w-8 shrink-0">
                      <ExerciseThumb
                        variant="square"
                        youtubeId={demoMedia(exercise).youtubeId}
                        category={exercise.category}
                        alt={exercise.name}
                      />
                    </div>
                    <span className="min-w-0 break-words">{exercise.name}</span>
                  </div>
                  <span className="shrink-0 text-xs text-muted">
                    {previewSummary(exercise, measureOverridesFromParsed(parsed, exercise.type))}
                  </span>
                </button>
              </li>
            ))}
            {showCreate && (
              <li onMouseEnter={() => setHighlighted(createIndex)} className="px-1">
                <CreateExerciseRow
                  name={query}
                  previewLabel={previewLabel}
                  active={createActive}
                  creating={creating}
                  error={createError}
                  onCreate={() => void createAndPlace()}
                  onDetails={openDetails}
                />
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
