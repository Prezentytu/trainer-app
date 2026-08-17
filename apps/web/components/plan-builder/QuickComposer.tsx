"use client";

import { KeyboardEvent, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
import { Icon } from "@/components/Icon";
import { Badge, IconButton, inputClass } from "@/components/ui";
import { COMPOSER_PLACEHOLDER, markComposerHelpSeen } from "./ComposerHelp";
import { useComposerChrome } from "./ComposerChrome";
import { CreateExerciseRow } from "@/components/CreateExerciseRow";
import { useExerciseLibraryActions } from "./ExerciseLibraryContext";
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
  if (overrides.setScheme) {
    const parts = [overrides.setScheme];
    if (overrides.loadKg != null) parts.push(`${overrides.loadKg}kg`);
    if (overrides.tempo) parts.push(overrides.tempo);
    if (overrides.targetRir != null) parts.push(`RIR ${overrides.targetRir}`);
    return parts.join(" · ");
  }
  const parts = [`${sets}×${core}`];
  if (overrides.loadKg != null) parts.push(`${overrides.loadKg}kg`);
  if (draft.tempo) parts.push(draft.tempo);
  if (draft.targetRir != null) parts.push(`RIR ${draft.targetRir}`);
  return parts.join(" · ");
}

export function QuickComposer({
  exercises,
  day,
  onAdd,
  onToggleLink,
  onBrowse,
}: {
  exercises: Exercise[];
  day: BuilderDay;
  onAdd: (exerciseId: number, overrides: Partial<BuilderItem>) => void;
  onToggleLink: (itemKey: string) => void;
  /** Otwiera pełną bibliotekę (drawer) — zamiast osobnego „+ Dodaj ćwiczenie". */
  onBrowse?: () => void;
}) {
  const { createExercise, requestNewExercise } = useExerciseLibraryActions();
  const { registerComposer, markFocused, helpOpen, setHelpOpen } = useComposerChrome();
  const [value, setValue] = useState("");
  const [recentIds, setRecentIds] = useState<number[]>(readRecentExerciseIds);
  const [highlighted, setHighlighted] = useState(0);
  const [focused, setFocused] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const lastGroupRef = useRef<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const anchorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    registerComposer(day.key, inputRef.current);
    return () => registerComposer(day.key, null);
  }, [day.key, registerComposer]);
  const [menuBox, setMenuBox] = useState<{
    left: number;
    width: number;
    top: number | null;
    bottom: number | null;
    maxHeight: number;
  } | null>(null);

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
  const active = !createActive ? (matches[activeIndex] ?? null) : null;
  const menuOpen = value.trim().length > 0 && optionCount > 0;

  // Portal + fixed: lista nie ucieka za ekran i nie jest przycinana przez overflow-x boardu.
  useLayoutEffect(() => {
    if (!menuOpen) return;
    const update = () => {
      const el = anchorRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const gap = 6;
      const spaceAbove = rect.top - gap - 8;
      const spaceBelow = window.innerHeight - rect.bottom - gap - 8;
      const openUp = spaceAbove >= 160 || spaceAbove >= spaceBelow;
      const maxHeight = Math.min(256, Math.max(120, openUp ? spaceAbove : spaceBelow));
      setMenuBox({
        left: rect.left,
        width: Math.max(rect.width, 240),
        maxHeight,
        top: openUp ? null : rect.bottom + gap,
        bottom: openUp ? window.innerHeight - rect.top + gap : null,
      });
    };
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [menuOpen, value, optionCount]);

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
    const overrides = itemOverridesFromParsed(parsed, exercise.type);
    const previousItem = day.items[day.items.length - 1];
    onAdd(exercise.id, overrides);
    setRecentIds(rememberExercise(exercise.id));

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

  const menuList = menuOpen && menuBox ? (
    <div
      role="listbox"
      className="fixed z-[60] rounded-[10px] border border-border-strong bg-surface"
      style={{
        left: menuBox.left,
        width: menuBox.width,
        top: menuBox.top ?? undefined,
        bottom: menuBox.bottom ?? undefined,
        maxHeight: menuBox.maxHeight,
      }}
    >
      <ul className="max-h-[inherit] overflow-y-auto py-1">
        {matches.map((exercise, idx) => (
          <li key={exercise.id}>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => placeExercise(exercise)}
              onMouseEnter={() => setHighlighted(idx)}
              className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm ${
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
              <span className="shrink-0 font-mono text-xs tabular-nums text-muted">
                {previewSummary(exercise, itemOverridesFromParsed(parsed, exercise.type))}
              </span>
            </button>
          </li>
        ))}
        {showCreate ? (
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
        ) : null}
      </ul>
    </div>
  ) : null;

  return (
    <div ref={anchorRef} className="relative">
      <div className="flex items-center gap-1">
        {parsed.supersetPrefix ? (
          <Badge tone="neutral">
            {parsed.supersetPrefix.group}
            {parsed.supersetPrefix.letter}
          </Badge>
        ) : null}
        <div className="relative min-w-0 flex-1">
          <input
            ref={inputRef}
            className={`${inputClass} w-full pr-14`}
            placeholder={COMPOSER_PLACEHOLDER}
            value={value}
            disabled={creating}
            onChange={(e) => {
              setValue(e.target.value);
              setHighlighted(0);
              setCreateError(null);
            }}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              setFocused(true);
              markFocused(day.key);
            }}
            onBlur={() => setFocused(false)}
          />
          {focused && value.trim() ? (
            <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 font-mono text-xs text-muted-faint">
              ↵
            </span>
          ) : null}
        </div>
        {onBrowse ? (
          <IconButton title="Przeglądaj bibliotekę" onClick={onBrowse} size="sm">
            <Icon name="search" size={16} decorative />
          </IconButton>
        ) : null}
      </div>
      {typeof document !== "undefined" && menuList
        ? createPortal(menuList, document.body)
        : null}
    </div>
  );
}
