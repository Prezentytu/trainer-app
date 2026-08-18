"use client";

import { KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import { Exercise } from "@/lib/api";
import { ExerciseThumb } from "@/components/ExerciseThumb";
import {
  createExercisePreviewLabel,
  exerciseInputFromQuickEntry,
} from "@/lib/exerciseDraft";
import { formatMeasureCore } from "@/lib/measure";
import { itemOverridesFromParsed, matchExercises, parseQuickEntry } from "@/lib/quickEntry";
import { readRecentExerciseIds, rememberExercise } from "@/lib/recentExercises";
import { demoMedia } from "@/lib/youtube";
import { COMPOSER_PLACEHOLDER, markComposerHelpSeen } from "./ComposerHelp";
import { useComposerChrome } from "./ComposerChrome";
import { CreateExerciseRow } from "@/components/CreateExerciseRow";
import { useExerciseLibraryActions } from "./ExerciseLibraryContext";
import { useLastPrescription } from "./lastPrescription";
import { buildListGroups, nextPositionLabel, superHintLabel } from "./listGroups";
import { BuilderDay, BuilderItem } from "./types";

export function ListComposer({
  exercises,
  day,
  pendingNum,
  pendingWarmup = false,
  onCancelPending,
  onAdd,
  onAddAt,
}: {
  exercises: Exercise[];
  day: BuilderDay;
  pendingNum: number | null;
  pendingWarmup?: boolean;
  onCancelPending: () => void;
  onAdd: (exerciseId: number, overrides: Partial<BuilderItem>) => void;
  onAddAt: (
    exerciseId: number,
    options: {
      positionNum: number;
      asSuper?: boolean;
      isWarmup?: boolean;
      overrides?: Partial<BuilderItem>;
    }
  ) => void;
}) {
  const { createExercise, requestNewExercise } = useExerciseLibraryActions();
  const lastPrescription = useLastPrescription();
  const { registerComposer, markFocused, helpOpen, setHelpOpen } = useComposerChrome();
  const [value, setValue] = useState("");
  const [recentIds, setRecentIds] = useState<number[]>(readRecentExerciseIds);
  const [highlighted, setHighlighted] = useState(0);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    registerComposer(day.key, inputRef.current);
    return () => registerComposer(day.key, null);
  }, [day.key, registerComposer]);

  const parsed = useMemo(() => parseQuickEntry(value), [value]);
  const matches = useMemo(
    () => matchExercises(parsed.query, exercises, recentIds),
    [parsed.query, exercises, recentIds],
  );
  const query = parsed.query.trim();
  const showCreate = query.length > 0;
  const optionCount = matches.length + (showCreate ? 1 : 0);
  const createIndex = showCreate ? matches.length : -1;
  const activeIndex = optionCount === 0 ? 0 : Math.min(highlighted, optionCount - 1);
  const createActive = showCreate && activeIndex === createIndex;

  const draftInput = useMemo(
    () => exerciseInputFromQuickEntry(query, parsed),
    [query, parsed]
  );
  const previewLabel = createExercisePreviewLabel(draftInput);

  const forcedNum = parsed.supersetPrefix ? Number(parsed.supersetPrefix.group) : null;
  const nextLabel = nextPositionLabel(day.items, { forcedNum, pendingNum, pendingWarmup });
  const hintSuper = superHintLabel(day.items);
  const groups = buildListGroups(day.items);

  const overridesFromParsed = (exercise: Exercise): Partial<BuilderItem> =>
    itemOverridesFromParsed(parsed, exercise.type);

  const reset = () => {
    setValue("");
    setHighlighted(0);
    setCreateError(null);
  };

  const afterPlace = () => {
    markComposerHelpSeen();
    setHelpOpen(false);
  };

  const placeExercise = (exercise: Exercise, asSuper: boolean) => {
    const overrides = overridesFromParsed(exercise);

    if (forcedNum != null) {
      onAddAt(exercise.id, {
        positionNum: forcedNum,
        asSuper: true,
        isWarmup: forcedNum === 0,
        overrides,
      });
      onCancelPending();
    } else if (asSuper && groups.length > 0) {
      const last = groups[groups.length - 1];
      onAddAt(exercise.id, {
        positionNum: last.positionNum,
        asSuper: true,
        isWarmup: last.isWarmup,
        overrides,
      });
      onCancelPending();
    } else if (pendingNum != null) {
      onAddAt(exercise.id, {
        positionNum: pendingNum,
        asSuper: true,
        isWarmup: pendingWarmup || pendingNum === 0,
        overrides,
      });
      onCancelPending();
    } else {
      onAdd(exercise.id, overrides);
    }

    setRecentIds(rememberExercise(exercise.id));
    reset();
    afterPlace();
    inputRef.current?.focus();
  };

  const openDetails = (asSuper: boolean) => {
    if (!showCreate || creating) return;
    requestNewExercise({
      prefill: draftInput,
      onCreated: (exercise) => placeExercise(exercise, asSuper),
    });
  };

  const createAndPlace = async (asSuper: boolean) => {
    if (!showCreate || creating) return;
    setCreating(true);
    setCreateError(null);
    try {
      const { exercise } = await createExercise(draftInput);
      placeExercise(exercise, asSuper);
    } catch (err) {
      setCreateError((err as Error).message);
    } finally {
      setCreating(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "?" && !value.trim()) {
      e.preventDefault();
      setHelpOpen(!helpOpen);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (optionCount) setHighlighted((h) => (h + 1) % optionCount);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (optionCount) setHighlighted((h) => (h - 1 + optionCount) % optionCount);
    } else if (e.key === "Tab") {
      if (createActive) {
        e.preventDefault();
        openDetails(e.shiftKey);
      }
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (creating) return;
      if (createActive) {
        void createAndPlace(e.shiftKey);
      } else {
        const it = matches[activeIndex];
        if (it) placeExercise(it, e.shiftKey);
      }
    } else if (e.key === "Escape") {
      if (helpOpen) {
        setHelpOpen(false);
        return;
      }
      reset();
      onCancelPending();
    }
  };

  const preview = (exercise: Exercise) => {
    const overrides = overridesFromParsed(exercise);
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
    const last = lastPrescription.get(exercise.id);
    if (
      last &&
      overrides.sets == null &&
      overrides.reps == null &&
      overrides.loadKg == null &&
      overrides.setScheme == null
    ) {
      return last.label;
    }
    const sets = draft.sets;
    const core = formatMeasureCore(draft, exercise);
    const parts = [`${sets}×${core}`];
    if (draft.tempo) parts.push(`tempo ${draft.tempo}`);
    if (draft.targetRir != null) parts.push(`RIR ${draft.targetRir}`);
    return parts.join(" · ");
  };

  const contextHint = (() => {
    if (createActive) return null;
    if (day.items.length === 0 && !value.trim()) return "↵ dodaj";
    if (day.items.length > 0) {
      return `↵ dodaj jako ${nextLabel} · ⇧↵ superseria ${hintSuper}`;
    }
    return "↵ dodaj";
  })();

  return (
    <div className="space-y-2">
      <div className="sticky bottom-4 z-10 overflow-visible rounded-2xl border border-border-strong bg-surface">
        {value.trim() && optionCount > 0 && (
          <div className="flex max-h-72 flex-col gap-0.5 overflow-y-auto rounded-t-2xl border-b border-border p-1.5">
            {matches.map((exercise, idx) => (
              <button
                key={exercise.id}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => placeExercise(exercise, false)}
                onMouseEnter={() => setHighlighted(idx)}
                className={`flex w-full items-center gap-2.5 rounded-[10px] px-2.5 py-2 text-left ${
                  idx === activeIndex ? "bg-surface-hover" : "bg-transparent"
                }`}
              >
                <div className="h-9 w-9 shrink-0">
                  <ExerciseThumb
                    variant="square"
                    youtubeId={demoMedia(exercise).youtubeId}
                    category={exercise.category}
                    alt={exercise.name}
                  />
                </div>
                <span className="min-w-0 flex-1 break-words text-sm font-medium text-foreground">
                  {exercise.name}
                </span>
                <span className="shrink-0 font-mono text-xs tabular-nums text-muted">{preview(exercise)}</span>
              </button>
            ))}
            {showCreate && (
              <div onMouseEnter={() => setHighlighted(createIndex)}>
                <CreateExerciseRow
                  name={query}
                  previewLabel={previewLabel}
                  active={createActive}
                  creating={creating}
                  error={createError}
                  onCreate={() => void createAndPlace(false)}
                  onDetails={() => openDetails(false)}
                />
              </div>
            )}
          </div>
        )}
        <div className="flex items-center gap-2.5 px-3.5 py-2.5">
          <span className="inline-flex h-7 min-w-[34px] shrink-0 items-center justify-center rounded-lg border border-dashed border-border-strong bg-surface-sunken px-2 font-mono text-xs font-semibold tabular-nums text-muted">
            {nextLabel}
          </span>
          <input
            ref={inputRef}
            value={value}
            disabled={creating}
            onChange={(e) => {
              setValue(e.target.value);
              setHighlighted(0);
              setCreateError(null);
            }}
            onKeyDown={handleKeyDown}
            placeholder={COMPOSER_PLACEHOLDER}
            onFocus={() => markFocused(day.key)}
            className="min-w-0 flex-1 bg-transparent py-1.5 text-sm text-foreground outline-none placeholder:text-muted-faint disabled:opacity-60"
          />
          {pendingNum != null && (
            <span className="flex shrink-0 items-center gap-1.5 rounded-full border border-border-strong bg-surface-hover px-2.5 py-1 text-xs text-foreground-secondary whitespace-nowrap">
              superseria z {pendingNum}{" "}
              <button type="button" onClick={onCancelPending} className="text-foreground-secondary hover:text-foreground">
                ×
              </button>
            </span>
          )}
          <span className="shrink-0 text-xs text-muted-faint whitespace-nowrap">↵ dodaj</span>
        </div>
      </div>

      {contextHint && (
        <p className="px-1 text-xs text-muted-faint">
          <span className="text-foreground-secondary">{contextHint}</span>
        </p>
      )}
    </div>
  );
}
