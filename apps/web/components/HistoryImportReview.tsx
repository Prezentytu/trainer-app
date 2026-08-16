"use client";

import { KeyboardEvent, useState } from "react";
import { Exercise, HistoryImportSession } from "@/lib/api";
import { ExerciseInput } from "@/lib/exerciseDraft";
import { formatDayLong } from "@/lib/dates";
import { foldDiacritics } from "@/lib/exerciseSearch";
import {
  formatSetLine,
  resolvedExerciseId,
} from "@/lib/historyImportMap";
import { parseSetList } from "@/lib/setList";
import { ExerciseCombobox } from "@/components/ExerciseCombobox";
import { Button, Field, inputClass } from "@/components/ui";

function polishPlural(n: number, one: string, few: string, many: string): string {
  const abs = Math.abs(n) % 100;
  const last = abs % 10;
  if (abs === 1) return one;
  if (last >= 2 && last <= 4 && (abs < 12 || abs > 14)) return few;
  return many;
}

function namesDiffer(libraryName: string, photoName: string): boolean {
  return foldDiacritics(libraryName) !== foldDiacritics(photoName);
}

function SetLine({
  line,
  ariaLabel,
  onCommit,
}: {
  line: string;
  ariaLabel: string;
  onCommit: (raw: string) => boolean;
}) {
  const [editing, setEditing] = useState(false);

  if (!editing) {
    return (
      <button
        type="button"
        aria-label={ariaLabel}
        onClick={() => setEditing(true)}
        className="t-num min-h-11 w-full break-words rounded-[var(--r-field)] px-1 py-1.5 text-left text-foreground transition-[background-color,transform] duration-[var(--dur-fast)] hover:bg-surface focus-visible:outline-none focus-visible:shadow-[var(--focus-ring)] active:[transform:var(--press)]"
      >
        {line}
      </button>
    );
  }

  return (
    <input
      autoFocus
      aria-label={ariaLabel}
      className={`${inputClass} font-mono text-sm`}
      defaultValue={line}
      onBlur={(e) => {
        const raw = e.target.value.trim();
        if (!raw || raw === line) {
          setEditing(false);
          return;
        }
        if (onCommit(raw)) setEditing(false);
      }}
      onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") e.currentTarget.blur();
        if (e.key === "Escape") setEditing(false);
      }}
    />
  );
}

function ExerciseRow({
  session,
  sessionIdx,
  exerciseIdx,
  exercises,
  idMap,
  onMap,
  onCreate,
  onPatchSets,
}: {
  session: HistoryImportSession;
  sessionIdx: number;
  exerciseIdx: number;
  exercises: Exercise[];
  idMap: Record<string, number>;
  onMap: (sessionIdx: number, exerciseIdx: number, exercise: Exercise) => void;
  onCreate: (input: ExerciseInput) => Promise<Exercise>;
  onPatchSets: (si: number, ei: number, raw: string) => void;
}) {
  const ex = session.exercises[exerciseIdx];
  const mappedId = resolvedExerciseId(session, sessionIdx, exerciseIdx, idMap);
  const mapped = mappedId != null ? exercises.find((e) => e.id === mappedId) ?? null : null;
  const [changing, setChanging] = useState(false);
  const showCombobox = !mapped || changing;
  const line = formatSetLine(ex);

  return (
    <li className="min-w-0 border-b border-border py-3 last:border-b-0">
      {mapped && !changing ? (
        <div className="mb-1 flex min-w-0 items-start gap-2">
          <div className="min-w-0 flex-1">
            <p className="break-words text-[15px] font-medium text-foreground">{mapped.name}</p>
            {namesDiffer(mapped.name, ex.exerciseName) ? (
              <p className="t-small mt-0.5 text-muted">na zdjęciu: {ex.exerciseName}</p>
            ) : null}
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={() => setChanging(true)}>
            Zmień
          </Button>
        </div>
      ) : (
        <div className="mb-1">
          <ExerciseCombobox
            exercises={exercises}
            value={mappedId}
            suggestedName={ex.exerciseName}
            onSelect={(exercise) => {
              onMap(sessionIdx, exerciseIdx, exercise);
              setChanging(false);
            }}
            onCreate={async (input) => {
              const exercise = await onCreate(input);
              onMap(sessionIdx, exerciseIdx, exercise);
              setChanging(false);
              return exercise;
            }}
          />
        </div>
      )}
      {showCombobox && mapped && namesDiffer(mapped.name, ex.exerciseName) ? (
        <p className="t-small mb-1 text-muted">na zdjęciu: {ex.exerciseName}</p>
      ) : null}
      <SetLine
        line={line}
        ariaLabel={`Serie: ${mapped?.name ?? ex.exerciseName}`}
        onCommit={(raw) => {
          if (!parseSetList(raw)) return false;
          onPatchSets(sessionIdx, exerciseIdx, raw);
          return true;
        }}
      />
    </li>
  );
}

function SessionChapter({
  session,
  sessionIdx,
  exercises,
  idMap,
  onMap,
  onCreate,
  onPatchSession,
  onPatchSets,
  onRemoveSession,
}: {
  session: HistoryImportSession;
  sessionIdx: number;
  exercises: Exercise[];
  idMap: Record<string, number>;
  onMap: (sessionIdx: number, exerciseIdx: number, exercise: Exercise) => void;
  onCreate: (input: ExerciseInput) => Promise<Exercise>;
  onPatchSession: (idx: number, patch: Partial<HistoryImportSession>) => void;
  onPatchSets: (si: number, ei: number, raw: string) => void;
  onRemoveSession: (idx: number) => void;
}) {
  const [editingDate, setEditingDate] = useState(false);
  const counted = session.exercises.reduce((n, e) => n + e.sets.length, 0);
  const mismatch =
    session.summarySets != null && session.summarySets > 0 && session.summarySets !== counted;

  return (
    <article className="border-t border-border pt-5 first:border-t-0 first:pt-0">
      <header className="mb-2 flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="min-w-0 flex-1">
          {editingDate ? (
            <Field label="Data">
              <input
                autoFocus
                className={inputClass}
                type="date"
                value={session.performedOn ?? ""}
                onChange={(e) => onPatchSession(sessionIdx, { performedOn: e.target.value || null })}
                onBlur={() => setEditingDate(false)}
              />
            </Field>
          ) : (
            <button
              type="button"
              onClick={() => setEditingDate(true)}
              className="t-heading min-h-11 break-words rounded-[var(--r-field)] px-1 py-1 text-left text-foreground transition-[background-color,transform] duration-[var(--dur-fast)] hover:bg-surface focus-visible:outline-none focus-visible:shadow-[var(--focus-ring)] active:[transform:var(--press)]"
            >
              {formatDayLong(session.performedOn)}
            </button>
          )}
        </div>
        <div className="flex flex-col gap-2 sm:w-52">
          <Field label="Nazwa">
            <input
              className={inputClass}
              value={session.label ?? ""}
              placeholder="np. nogi, klatka"
              onChange={(e) => onPatchSession(sessionIdx, { label: e.target.value || null })}
            />
          </Field>
          <Button type="button" variant="ghost" size="sm" onClick={() => onRemoveSession(sessionIdx)}>
            Usuń ten trening z importu
          </Button>
        </div>
      </header>
      {mismatch ? (
        <p className="t-small mb-2 text-muted">
          <span className="mr-1 font-mono text-loss" aria-hidden>
            ▼
          </span>
          Na zdjęciu {session.summarySets} {polishPlural(session.summarySets ?? 0, "seria", "serie", "serii")}, tu{" "}
          {counted} — sprawdź.
        </p>
      ) : null}
      <ul>
        {session.exercises.map((ex, ei) => (
          <ExerciseRow
            key={`${ex.exerciseName}-${ei}`}
            session={session}
            sessionIdx={sessionIdx}
            exerciseIdx={ei}
            exercises={exercises}
            idMap={idMap}
            onMap={onMap}
            onCreate={onCreate}
            onPatchSets={onPatchSets}
          />
        ))}
      </ul>
    </article>
  );
}

export function HistoryImportReview({
  sessions,
  exercises,
  idMap,
  warnings,
  unmapped,
  busy,
  onMapExercise,
  onCreateExercise,
  onCreateMissing,
  onPatchSession,
  onPatchSets,
  onRemoveSession,
  onBack,
  onContinue,
}: {
  sessions: HistoryImportSession[];
  exercises: Exercise[];
  idMap: Record<string, number>;
  warnings: string[];
  unmapped: number;
  busy: boolean;
  onMapExercise: (sessionIdx: number, exerciseIdx: number, exercise: Exercise) => void;
  onCreateExercise: (input: ExerciseInput) => Promise<Exercise>;
  onCreateMissing: () => void;
  onPatchSession: (idx: number, patch: Partial<HistoryImportSession>) => void;
  onPatchSets: (si: number, ei: number, raw: string) => void;
  onRemoveSession: (idx: number) => void;
  onBack: () => void;
  onContinue: () => void;
}) {
  const extraWarnings = warnings.filter((w) => !w.includes("na zdjęciu"));

  return (
    <div>
      {extraWarnings.length > 0 ? (
        <ul className="mb-5 list-disc space-y-1 pl-5 text-sm text-muted">
          {extraWarnings.map((w) => (
            <li key={w}>{w}</li>
          ))}
        </ul>
      ) : null}

      {unmapped > 0 ? (
        <div className="mb-5 flex flex-col gap-2 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="t-small text-muted">
            {unmapped} {polishPlural(unmapped, "ćwiczenie", "ćwiczenia", "ćwiczeń")} nie ma w bibliotece.
          </p>
          <Button variant="ghost" onClick={onCreateMissing} disabled={busy}>
            {busy ? "Dodaję…" : "Dodaj brakujące do biblioteki"}
          </Button>
        </div>
      ) : null}

      <div className="grid gap-6 pb-28 md:pb-8">
        {sessions.length === 0 ? (
          <p className="text-sm text-muted-strong">
            Nie ma już treningów w tym imporcie. Wróć i wczytaj je jeszcze raz.
          </p>
        ) : (
          sessions.map((s, si) => (
            <SessionChapter
              key={`${s.performedOn}-${si}`}
              session={s}
              sessionIdx={si}
              exercises={exercises}
              idMap={idMap}
              onMap={onMapExercise}
              onCreate={onCreateExercise}
              onPatchSession={onPatchSession}
              onPatchSets={onPatchSets}
              onRemoveSession={onRemoveSession}
            />
          ))
        )}
      </div>

      <div className="sticky bottom-20 z-20 -mx-4 border-t border-border bg-background px-4 py-3 md:bottom-0 md:-mx-8 md:px-8">
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="ghost" onClick={onBack} disabled={busy}>
            Wróć
          </Button>
          <Button
            className="min-w-[12rem] flex-1 sm:flex-none"
            onClick={onContinue}
            disabled={busy || sessions.length === 0}
            loading={busy}
          >
            Zapisz te treningi
          </Button>
        </div>
      </div>
    </div>
  );
}
