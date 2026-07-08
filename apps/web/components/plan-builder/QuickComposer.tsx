"use client";

import Link from "next/link";
import { KeyboardEvent, useMemo, useRef, useState } from "react";
import { Exercise } from "@/lib/api";
import { matchExercises, parseQuickEntry } from "@/lib/quickEntry";
import { Badge, IconButton, inputClass } from "@/components/ui";
import { ExercisePicker } from "./ExercisePicker";
import { BuilderDay, BuilderItem } from "./types";

function previewSummary(exercise: Exercise, sets: number | null, reps: number | null, repsMax: number | null): string {
  const effectiveSets = sets ?? exercise.defaultSets;
  let core: string;
  if (exercise.type === "time") {
    core = exercise.defaultRepDurationSeconds ? `${exercise.defaultRepDurationSeconds}s` : "—";
  } else if (exercise.type === "distance") {
    core = exercise.defaultDistanceMeters ? `${exercise.defaultDistanceMeters} m` : "—";
  } else {
    const effectiveReps = reps ?? exercise.defaultReps;
    core = repsMax ? `${effectiveReps}–${repsMax}` : `${effectiveReps}`;
  }
  return `${effectiveSets}×${core}`;
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
  const [value, setValue] = useState("");
  const [highlighted, setHighlighted] = useState(0);
  const [browsing, setBrowsing] = useState(false);
  const [focused, setFocused] = useState(false);
  const lastGroupRef = useRef<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const parsed = useMemo(() => parseQuickEntry(value), [value]);
  const matches = useMemo(() => matchExercises(parsed.query, exercises), [parsed.query, exercises]);
  const activeIndex = Math.min(highlighted, Math.max(matches.length - 1, 0));
  const active = matches[activeIndex] ?? null;
  const notFound = parsed.query.trim().length > 0 && matches.length === 0;

  const reset = () => {
    setValue("");
    setHighlighted(0);
  };

  const commit = (exercise: Exercise) => {
    const overrides: Partial<BuilderItem> = {};
    if (parsed.sets != null) overrides.sets = parsed.sets;
    if (exercise.type === "reps") {
      if (parsed.reps != null) overrides.reps = parsed.reps;
      if (parsed.repsMax != null) overrides.repsMax = parsed.repsMax;
    }
    if (parsed.tempo != null) overrides.tempo = parsed.tempo;
    if (parsed.targetRir != null) overrides.targetRir = parsed.targetRir;

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
    inputRef.current?.focus();
  };

  const handleTab = () => {
    if (!active) return;
    const prefixRaw = parsed.supersetPrefix ? `${parsed.supersetPrefix.group}${parsed.supersetPrefix.letter} ` : "";
    const paramParts: string[] = [];
    if (parsed.sets != null || parsed.reps != null || parsed.repsMax != null) {
      paramParts.push(`${parsed.sets ?? ""}x${parsed.reps ?? ""}${parsed.repsMax ? `-${parsed.repsMax}` : ""}`);
    }
    if (parsed.tempo) paramParts.push(parsed.tempo);
    if (parsed.targetRir != null) paramParts.push(`rir${parsed.targetRir}`);
    const suffix = paramParts.length ? ` ${paramParts.join(" ")} ` : " ";
    setValue(`${prefixRaw}${active.name}${suffix}`);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlighted((h) => Math.min(h + 1, Math.max(matches.length - 1, 0)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted((h) => Math.max(h - 1, 0));
    } else if (e.key === "Tab") {
      if (active) {
        e.preventDefault();
        handleTab();
      }
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (active) commit(active);
    } else if (e.key === "Escape") {
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
          <Badge tone="yellow">
            {parsed.supersetPrefix.group}
            {parsed.supersetPrefix.letter}
          </Badge>
        )}
        <div className="relative flex-1">
          <input
            ref={inputRef}
            className={`${inputClass} w-full pr-16`}
            placeholder='np. "romanian 3x8-10 3010 rir2"'
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setHighlighted(0);
            }}
            onKeyDown={handleKeyDown}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
          />
          {focused && value.trim() && (
            <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[11px] text-muted">
              ↵ dodaj
            </span>
          )}
        </div>
        <IconButton title="Przeglądaj listę ćwiczeń" onClick={() => setBrowsing(true)}>
          🔍
        </IconButton>
      </div>

      {value.trim() && (
        <div className="absolute z-10 mt-1 w-full rounded-lg border border-border bg-surface shadow-xl">
          {matches.length === 0 ? (
            notFound ? (
              <p className="px-3 py-3 text-center text-xs text-muted">
                Nie znaleziono „{parsed.query}” —{" "}
                <Link href="/exercises" className="text-accent-strong hover:underline">
                  dodaj ćwiczenie w bibliotece
                </Link>
              </p>
            ) : null
          ) : (
            <ul className="max-h-64 overflow-y-auto py-1">
              {matches.map((exercise, idx) => (
                <li key={exercise.id}>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => commit(exercise)}
                    onMouseEnter={() => setHighlighted(idx)}
                    className={`flex w-full items-center justify-between gap-3 px-3 py-1.5 text-left text-sm ${
                      idx === activeIndex ? "bg-surface-hover text-foreground" : "text-foreground-secondary"
                    }`}
                  >
                    <span className="min-w-0 truncate">{exercise.name}</span>
                    <span className="shrink-0 text-xs text-muted">
                      {previewSummary(exercise, parsed.sets, parsed.reps, parsed.repsMax)} ·{" "}
                      {parsed.tempo ?? "—"} · RIR {parsed.targetRir ?? "—"}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
