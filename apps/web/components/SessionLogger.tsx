"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  api,
  Exercise,
  LoggedExerciseInput,
  PrevLoggedSet,
  SessionCheckinInput,
  SessionDetail,
  WorkoutSessionInput,
} from "@/lib/api";
import { ExerciseThumb } from "@/components/ExerciseThumb";
import { YoutubeLite } from "@/components/YoutubeLite";
import {
  Badge,
  Button,
  EmptyState,
  ErrorBanner,
  formatRest,
  inputClass,
  inputNumericClass,
  useUndoToast,
} from "@/components/ui";
import { demoMedia } from "@/lib/youtube";

type Props = {
  session: SessionDetail;
  /** Gdy podane — zapis przez api.portal.*; inaczej api.sessions.* */
  portalToken?: string;
  /** Biblioteka ćwiczeń do podmiany w trakcie sesji. */
  libraryExercises?: Exercise[];
  /** Edycja już ukończonej sesji — statyczny czas, CTA „Zapisz zmiany”. */
  completedEdit?: boolean;
  onUpdated: (session: SessionDetail) => void;
  onCompleted?: (session: SessionDetail) => void;
  /** Wywołane przy nieudanym zapisie (np. offline queue). */
  onPersistFailed?: (input: WorkoutSessionInput, complete: boolean, error: Error) => void;
};

function toInput(session: SessionDetail): WorkoutSessionInput {
  return {
    clientId: session.clientId,
    performedOn: session.performedOn,
    assignmentId: session.assignmentId,
    planDayId: session.planDayId,
    planId: session.planId,
    durationSeconds: session.durationSeconds,
    note: session.note,
    status: session.status,
    exercises: session.exercises.map(
      (e): LoggedExerciseInput => ({
        id: e.id,
        exerciseId: e.exerciseId,
        order: e.order,
        note: e.note,
        sets: e.sets.map((s) => ({
          id: s.id,
          setNumber: s.setNumber,
          weightKg: s.weightKg,
          reps: s.reps,
          durationSeconds: s.durationSeconds,
          distanceMeters: s.distanceMeters,
          rir: s.rir,
          rpe: s.rpe,
          isWarmup: s.isWarmup,
          completed: s.completed,
        })),
      }),
    ),
  };
}

function parseNum(v: string): number | null {
  if (v.trim() === "") return null;
  const n = Number(v.replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

function formatPrev(p: PrevLoggedSet | undefined): string {
  if (!p) return "—";
  if (p.weightKg != null && p.reps != null) return `${p.weightKg} × ${p.reps}`;
  if (p.reps != null) return `${p.reps} powt.`;
  if (p.durationSeconds != null) return formatRest(p.durationSeconds);
  return "—";
}

function elapsedLabel(startedAt: number): string {
  const sec = Math.max(0, Math.floor((Date.now() - startedAt) / 1000));
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function SessionLogger({
  session,
  portalToken,
  libraryExercises = [],
  completedEdit = false,
  onUpdated,
  onCompleted,
  onPersistFailed,
}: Props) {
  const [draft, setDraft] = useState(session);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [restLeft, setRestLeft] = useState<number | null>(null);
  const [summary, setSummary] = useState<SessionDetail | null>(null);
  const [checkinSession, setCheckinSession] = useState<SessionDetail | null>(null);
  const [feelingScore, setFeelingScore] = useState<number | null>(null);
  const [sleepScore, setSleepScore] = useState<number | null>(null);
  const [energyScore, setEnergyScore] = useState<number | null>(null);
  const [swapExIdx, setSwapExIdx] = useState<number | null>(null);
  const [swapSearch, setSwapSearch] = useState("");
  const [videoId, setVideoId] = useState<string | null>(null);
  const [videoTitle, setVideoTitle] = useState("");
  const [clock, setClock] = useState(() => elapsedLabel(Date.parse(session.createdAt)));
  const [prCelebrate, setPrCelebrate] = useState<string | null>(null);
  const { showUndoToast, toastNode } = useUndoToast();

  const draftRef = useRef(session);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveChain = useRef(Promise.resolve());
  const restInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const prFlashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startedAt = useRef(Date.parse(session.createdAt));

  useEffect(() => {
    if (completedEdit) return;
    const t = setInterval(() => setClock(elapsedLabel(startedAt.current)), 1000);
    return () => clearInterval(t);
  }, [completedEdit]);

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      if (restInterval.current) clearInterval(restInterval.current);
      if (prFlashTimer.current) clearTimeout(prFlashTimer.current);
    };
  }, []);

  const flashPr = useCallback((label: string) => {
    if (prFlashTimer.current) clearTimeout(prFlashTimer.current);
    setPrCelebrate(label);
    prFlashTimer.current = setTimeout(() => setPrCelebrate(null), 2800);
  }, []);

  const startRest = useCallback((seconds: number) => {
    if (restInterval.current) clearInterval(restInterval.current);
    setRestLeft(seconds);
    restInterval.current = setInterval(() => {
      setRestLeft((prev) => {
        if (prev == null || prev <= 1) {
          if (restInterval.current) clearInterval(restInterval.current);
          restInterval.current = null;
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const persist = useCallback(
    async (next: SessionDetail, complete = false) => {
      setSaving(true);
      setError(null);
      const input = toInput(next);
      try {
        let updated: SessionDetail;
        if (portalToken) {
          updated = await api.portal.updateSession(portalToken, next.id, input);
          if (complete) updated = await api.portal.completeSession(portalToken, next.id);
        } else {
          updated = await api.sessions.update(next.id, input);
          if (complete) updated = await api.sessions.complete(next.id);
        }
        draftRef.current = updated;
        setDraft(updated);
        onUpdated(updated);
        if (complete) {
          if (completedEdit || updated.feelingScore != null) setSummary(updated);
          else setCheckinSession(updated);
        }
        return updated;
      } catch (e) {
        const err = e as Error;
        setError(err.message);
        onPersistFailed?.(input, complete, err);
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [completedEdit, onPersistFailed, onUpdated, portalToken],
  );

  const scheduleSave = useCallback(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveChain.current = saveChain.current
        .then(() => {
          void persist(draftRef.current);
        })
        .catch(() => {
          /* błąd już w state / queue */
        });
    }, 400);
  }, [persist]);

  const updateDraft = (updater: (prev: SessionDetail) => SessionDetail) => {
    setDraft((prev) => {
      const next = updater(prev);
      draftRef.current = next;
      return next;
    });
    scheduleSave();
  };

  const patchSet = (
    exIdx: number,
    setIdx: number,
    patch: Partial<SessionDetail["exercises"][0]["sets"][0]>,
  ) => {
    updateDraft((prev) => ({
      ...prev,
      exercises: prev.exercises.map((ex, i) => {
        if (i !== exIdx) return ex;
        return {
          ...ex,
          sets: ex.sets.map((s, j) => (j === setIdx ? { ...s, ...patch } : s)),
        };
      }),
    }));
  };

  const toggleComplete = (exIdx: number, setIdx: number) => {
    const exercise = draft.exercises[exIdx];
    const set = exercise?.sets[setIdx];
    if (!set) return;
    const nextCompleted = !set.completed;
    const exerciseId = exercise.exerciseId;
    const setNumber = set.setNumber;

    // Natychmiastowy zapis (bez debounce) — PR wraca z API zaraz po checkmarku.
    if (saveTimer.current) clearTimeout(saveTimer.current);
    setDraft((prev) => {
      const next = {
        ...prev,
        exercises: prev.exercises.map((ex, i) => {
          if (i !== exIdx) return ex;
          return {
            ...ex,
            sets: ex.sets.map((s, j) =>
              j === setIdx
                ? { ...s, completed: nextCompleted, isPr: nextCompleted ? s.isPr : false }
                : s,
            ),
          };
        }),
      };
      draftRef.current = next;
      return next;
    });

    if (nextCompleted) startRest(exercise.restSeconds ?? 90);

    saveChain.current = saveChain.current
      .then(async () => {
        const updated = await persist(draftRef.current);
        if (!nextCompleted || !updated) return;
        const logged = updated.exercises
          .flatMap((ex) => ex.sets.map((s) => ({ ex, s })))
          .find(({ ex, s }) => ex.exerciseId === exerciseId && s.setNumber === setNumber);
        if (logged?.s.isPr && logged.s.completed) {
          const e1 = logged.s.estimated1Rm;
          flashPr(
            e1 != null
              ? `PR! ${logged.ex.exerciseName} · max ${e1} kg`
              : `PR! ${logged.ex.exerciseName}`,
          );
        }
      })
      .catch(() => {
        /* błąd w state / queue */
      });
  };

  const copyPrev = (exIdx: number, setIdx: number) => {
    const prev = draft.exercises[exIdx]?.prevSets[setIdx];
    if (!prev) return;
    patchSet(exIdx, setIdx, {
      weightKg: prev.weightKg,
      reps: prev.reps,
      durationSeconds: prev.durationSeconds,
      distanceMeters: prev.distanceMeters,
      rir: prev.rir,
      rpe: prev.rpe,
    });
  };

  const addSet = (exIdx: number) => {
    updateDraft((prev) => ({
      ...prev,
      exercises: prev.exercises.map((ex, i) => {
        if (i !== exIdx) return ex;
        const last = ex.sets[ex.sets.length - 1];
        const nextNum = (last?.setNumber ?? 0) + 1;
        return {
          ...ex,
          sets: [
            ...ex.sets,
            {
              id: -Date.now(),
              setNumber: nextNum,
              weightKg: last?.weightKg ?? null,
              reps: last?.reps ?? null,
              durationSeconds: last?.durationSeconds ?? null,
              distanceMeters: last?.distanceMeters ?? null,
              rir: last?.rir ?? null,
              rpe: last?.rpe ?? null,
              isWarmup: false,
              completed: false,
              estimated1Rm: null,
              isPr: false,
            },
          ],
        };
      }),
    }));
  };

  const removeSet = (exIdx: number, setIdx: number) => {
    const exercise = draft.exercises[exIdx];
    const removed = exercise?.sets[setIdx];
    if (!exercise || !removed || exercise.sets.length <= 1) return;

    updateDraft((prev) => ({
      ...prev,
      exercises: prev.exercises.map((ex, i) => {
        if (i !== exIdx) return ex;
        if (ex.sets.length <= 1) return ex;
        return {
          ...ex,
          sets: ex.sets
            .filter((_, j) => j !== setIdx)
            .map((s, j) => ({ ...s, setNumber: j + 1 })),
        };
      }),
    }));

    showUndoToast("Usunięto serię", () => {
      updateDraft((prev) => ({
        ...prev,
        exercises: prev.exercises.map((ex, i) => {
          if (i !== exIdx) return ex;
          const next = [...ex.sets];
          next.splice(setIdx, 0, removed);
          return {
            ...ex,
            sets: next.map((s, j) => ({ ...s, setNumber: j + 1 })),
          };
        }),
      }));
    });
  };

  const currentExerciseIdx = draft.exercises.findIndex((ex) =>
    ex.sets.some((s) => !s.completed),
  );

  const patchNote = (exIdx: number, note: string) => {
    updateDraft((prev) => ({
      ...prev,
      exercises: prev.exercises.map((ex, i) => (i === exIdx ? { ...ex, note: note || null } : ex)),
    }));
  };

  const finish = async () => {
    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
      saveTimer.current = null;
    }
    try {
      await saveChain.current;
      await persist(draftRef.current, true);
    } catch {
      /* error state */
    }
  };

  const saveCheckin = async (skip = false) => {
    if (!checkinSession) return;
    setSaving(true);
    setError(null);
    try {
      let updated = checkinSession;
      if (!skip) {
        const input: SessionCheckinInput = {
          feelingScore,
          sleepScore,
          energyScore,
        };
        updated = portalToken
          ? await api.portal.checkinSession(portalToken, checkinSession.id, input)
          : await api.sessions.checkin(checkinSession.id, input);
      }
      setCheckinSession(null);
      setSummary(updated);
      onUpdated(updated);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const swapExercise = (exIdx: number, picked: Exercise) => {
    updateDraft((prev) => ({
      ...prev,
      exercises: prev.exercises.map((ex, i) =>
        i === exIdx
          ? {
              ...ex,
              exerciseId: picked.id,
              exerciseName: picked.name,
              exerciseType: picked.type,
              category: picked.category,
              media: picked.media,
            }
          : ex,
      ),
    }));
    setSwapExIdx(null);
    setSwapSearch("");
  };

  const filteredSwapExercises = libraryExercises.filter((ex) =>
    ex.name.toLowerCase().includes(swapSearch.trim().toLowerCase()),
  );

  if (checkinSession) {
    return (
      <div className="space-y-4">
        <ErrorBanner message={error} />
        <div className="rounded-xl border border-border bg-surface px-4 py-5">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">Check-in</p>
          <h2 className="mt-1 font-display text-xl font-bold">Jak się czujesz po treningu?</h2>
          <p className="mt-1 text-sm text-muted">Oceń w skali 1–5 — pomoże to dostosować kolejne sesje.</p>
        </div>
        <ScorePicker label="Samopoczucie" value={feelingScore} onChange={setFeelingScore} />
        <ScorePicker label="Sen (ostatnia noc)" value={sleepScore} onChange={setSleepScore} />
        <ScorePicker label="Energia" value={energyScore} onChange={setEnergyScore} />
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button className="flex-1" disabled={saving} onClick={() => void saveCheckin(false)}>
            {saving ? "Zapis…" : "Zakończ i zobacz podsumowanie"}
          </Button>
          <Button className="flex-1" variant="ghost" disabled={saving} onClick={() => void saveCheckin(true)}>
            Pomiń
          </Button>
        </div>
      </div>
    );
  }

  if (summary) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-accent-border bg-accent-dim/40 px-4 py-5 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-accent">
            {completedEdit ? "Zmiany zapisane" : "Trening zakończony"}
          </p>
          <h1 className="mt-1 font-display text-2xl font-bold">{summary.dayLabel ?? "Sesja"}</h1>
          <p className="mt-1 font-mono text-sm tabular-nums text-muted">{summary.performedOn}</p>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Stat label="Czas" value={formatRest(summary.durationSeconds ?? 0)} />
          <Stat label="Serie" value={String(summary.totalSets)} />
          <Stat label="Tonaż" value={`${Math.round(summary.totalVolumeKg)} kg`} />
        </div>
        {summary.prs.length > 0 ? (
          <div className="rounded-xl border border-pr/40 bg-pr-dim px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-pr">Nowe rekordy</p>
            <ul className="mt-2 space-y-1">
              {summary.prs.map((p) => (
                <li key={`${p.exerciseId}-${p.setNumber}`} className="text-sm">
                  <Badge tone="pr">PR</Badge>{" "}
                  <span className="font-semibold">{p.exerciseName}</span>{" "}
                  <span className="font-mono tabular-nums text-muted">
                    {p.weightKg} × {p.reps}
                    {p.estimated1Rm != null ? ` · max ${p.estimated1Rm}` : ""}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-sm text-muted">Brak nowych PR w tej sesji — dobra robota i tak.</p>
        )}
        <Button
          className="w-full"
          onClick={() => {
            onCompleted?.(summary);
          }}
        >
          Wróć do panelu
        </Button>
      </div>
    );
  }

  if (draft.exercises.length === 0) {
    return (
      <div>
        <ErrorBanner message={error} />
        <EmptyState title="Brak ćwiczeń w tej sesji">
          Sesja nie ma pozycji do zalogowania — wróć i wybierz dzień z planu.
        </EmptyState>
      </div>
    );
  }

  const nextExercise =
    currentExerciseIdx >= 0 ? draft.exercises[currentExerciseIdx] : null;

  return (
    <div className="space-y-4 pb-24">
      <ErrorBanner message={error} />

      <div className="sticky top-0 z-20 -mx-1 border-b border-border bg-background/95 px-1 py-3 backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">
              {draft.dayLabel ?? "Trening"}
            </p>
            <div className="flex items-baseline gap-2">
              <h1 className="truncate font-display text-lg font-bold">
                {completedEdit ? "Poprawa" : "Sesja"}
              </h1>
              <span className="font-mono text-sm tabular-nums text-muted">
                {completedEdit
                  ? formatRest(draft.durationSeconds ?? 0)
                  : clock}
              </span>
              {saving ? <span className="text-xs text-muted">Zapis…</span> : null}
            </div>
          </div>
          <Button disabled={saving} onClick={() => void finish()}>
            {completedEdit ? "Zapisz zmiany" : "Zakończ trening"}
          </Button>
        </div>
        {prCelebrate ? (
          <div
            className="pr-celebrate-in mt-2 rounded-md border border-pr/50 bg-pr-dim px-3 py-2.5 text-center shadow-[var(--glow-pr)]"
            role="status"
          >
            <div className="text-xs font-semibold uppercase tracking-caps text-pr">Nowy rekord</div>
            <div className="mt-0.5 font-display text-sm font-semibold text-pr">{prCelebrate}</div>
          </div>
        ) : null}
        {nextExercise && !completedEdit ? (
          <p className="mt-2 text-xs text-muted">
            Teraz:{" "}
            <span className="font-medium text-accent-strong">{nextExercise.exerciseName}</span>
          </p>
        ) : null}
      </div>

      {videoId ? (
        <div className="rounded-xl border border-border bg-surface p-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-semibold">{videoTitle}</p>
            <button
              type="button"
              className="text-xs text-muted hover:text-foreground"
              onClick={() => setVideoId(null)}
            >
              Zamknij
            </button>
          </div>
          <YoutubeLite youtubeId={videoId} title={videoTitle} autoplay />
        </div>
      ) : null}

      {draft.exercises.map((exercise, exIdx) => {
        const thumb = demoMedia({ media: exercise.media, category: exercise.category });
        const isCurrent = exIdx === currentExerciseIdx;
        const allDone = exercise.sets.every((s) => s.completed);
        return (
          <section
            key={exercise.id}
            className={`overflow-hidden rounded-xl border bg-surface ${
              isCurrent
                ? "border-accent-border ring-1 ring-accent-border/60"
                : allDone
                  ? "border-border opacity-70"
                  : "border-border"
            }`}
          >
            <div className="flex items-center gap-3 border-b border-border px-3 py-3">
              <button
                type="button"
                className="h-12 w-12 shrink-0 rounded-md focus-visible:outline-none focus-visible:shadow-[var(--glow-accent)]"
                onClick={() => {
                  if (!thumb.youtubeId) return;
                  setVideoId(thumb.youtubeId);
                  setVideoTitle(exercise.exerciseName);
                }}
                aria-label={`Film: ${exercise.exerciseName}`}
              >
                <ExerciseThumb
                  variant="square"
                  youtubeId={thumb.youtubeId}
                  category={exercise.category}
                  alt={exercise.exerciseName}
                />
              </button>
              <div className="min-w-0 flex-1">
                <h2 className="break-words font-display text-base font-bold">{exercise.exerciseName}</h2>
                <p className="font-mono text-xs tabular-nums text-muted">
                  {isCurrent ? "Teraz · " : allDone ? "Gotowe · " : ""}
                  przerwa {formatRest(exercise.restSeconds ?? 90)}
                </p>
              </div>
              {libraryExercises.length > 0 ? (
                <Button
                  type="button"
                  variant="ghost"
                  className="shrink-0 text-xs"
                  onClick={() => {
                    setSwapExIdx(swapExIdx === exIdx ? null : exIdx);
                    setSwapSearch("");
                  }}
                >
                  Podmień
                </Button>
              ) : null}
            </div>

            {swapExIdx === exIdx ? (
              <div className="border-b border-border px-3 py-3">
                <input
                  className={`${inputClass} mb-2 w-full px-2 py-1.5 text-sm`}
                  placeholder="Szukaj ćwiczenia…"
                  value={swapSearch}
                  onChange={(e) => setSwapSearch(e.target.value)}
                  autoFocus
                />
                <ul className="max-h-48 space-y-1 overflow-y-auto">
                  {filteredSwapExercises.length === 0 ? (
                    <li className="px-2 py-2 text-xs text-muted">Brak wyników.</li>
                  ) : (
                    filteredSwapExercises.slice(0, 20).map((ex) => (
                      <li key={ex.id}>
                        <button
                          type="button"
                          className="w-full rounded-[8px] px-2 py-2 text-left text-sm hover:bg-surface-hover"
                          onClick={() => swapExercise(exIdx, ex)}
                        >
                          {ex.name}
                        </button>
                      </li>
                    ))
                  )}
                </ul>
              </div>
            ) : null}

            <div className="grid grid-cols-[2.25rem_minmax(0,1fr)_minmax(0,1.4fr)_2.75rem] gap-1 border-b border-border px-3 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-muted">
              <span>Seria</span>
              <span>Poprz.</span>
              <span>Dziś</span>
              <span className="text-center">OK</span>
            </div>

            {exercise.sets.map((s, setIdx) => {
              const prev = exercise.prevSets[setIdx];
              return (
                <div
                  key={s.id || setIdx}
                  className={`grid grid-cols-[2.25rem_minmax(0,1fr)_minmax(0,1.4fr)_2.75rem] items-center gap-1 border-b border-border px-3 py-2 last:border-b-0 ${
                    s.completed ? "bg-accent-dim/25" : ""
                  } ${s.completed && s.isPr ? "bg-pr-dim/40" : ""}`}
                >
                  <div className="font-mono text-sm tabular-nums text-muted">
                    {s.setNumber}
                    {s.isWarmup ? <span className="block text-xs">W</span> : null}
                    {s.completed && s.isPr ? (
                      <span className="mt-0.5 inline-block">
                        <Badge tone="pr">PR</Badge>
                      </span>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    className="min-h-11 truncate text-left font-mono text-xs tabular-nums text-muted hover:text-accent focus-visible:outline-none focus-visible:text-accent"
                    onClick={() => copyPrev(exIdx, setIdx)}
                    title="Skopiuj do Dziś"
                  >
                    {formatPrev(prev)}
                  </button>
                  <div className="flex min-w-0 items-center gap-1">
                    <input
                      className={`${inputNumericClass} h-11 min-w-0 flex-1 px-1.5 text-center text-base`}
                      value={s.weightKg ?? ""}
                      onChange={(e) => patchSet(exIdx, setIdx, { weightKg: parseNum(e.target.value) })}
                      inputMode="decimal"
                      aria-label="kg"
                      placeholder="kg"
                    />
                    <span className="text-muted-faint">×</span>
                    <input
                      className={`${inputNumericClass} h-11 min-w-0 flex-1 px-1.5 text-center text-base`}
                      value={s.reps ?? ""}
                      onChange={(e) => patchSet(exIdx, setIdx, { reps: parseNum(e.target.value) })}
                      inputMode="numeric"
                      aria-label="powtórzenia"
                      placeholder="powt"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleComplete(exIdx, setIdx)}
                    className={`mx-auto flex h-11 w-11 items-center justify-center rounded-lg border text-base font-bold transition-colors duration-[var(--dur-fast)] focus-visible:outline-none focus-visible:shadow-[var(--glow-accent)] ${
                      s.completed
                        ? "border-accent-border bg-accent text-accent-foreground"
                        : "border-border-strong text-muted hover:border-accent-border"
                    }`}
                    aria-label={s.completed ? "Cofnij ukończenie" : "Oznacz serię jako ukończoną"}
                  >
                    {s.completed ? "✓" : ""}
                  </button>
                </div>
              );
            })}

            <div className="flex flex-wrap items-center gap-2 px-3 py-2">
              <button
                type="button"
                className="inline-flex min-h-11 min-w-11 items-center justify-center font-mono text-xl font-bold text-accent hover:text-accent-strong focus-visible:outline-none focus-visible:shadow-[var(--glow-accent)]"
                onClick={() => addSet(exIdx)}
                aria-label="Dodaj serię"
              >
                +
              </button>
              {exercise.sets.length > 1 ? (
                <button
                  type="button"
                  className="inline-flex min-h-11 items-center px-2 text-sm text-muted hover:text-danger focus-visible:outline-none focus-visible:text-danger"
                  onClick={() => removeSet(exIdx, exercise.sets.length - 1)}
                >
                  Usuń ostatnią
                </button>
              ) : null}
            </div>

            <div className="border-t border-border px-3 py-2">
              <input
                className={`${inputClass} px-2 py-1.5 text-sm`}
                placeholder="Notatka do ćwiczenia…"
                value={exercise.note ?? ""}
                onChange={(e) => patchNote(exIdx, e.target.value)}
              />
            </div>
          </section>
        );
      })}

      {restLeft != null ? (
        <div className="fixed inset-x-0 bottom-0 z-50 border-t border-accent-border bg-accent-dim px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] text-center">
          <p className="font-mono text-2xl font-semibold tabular-nums text-accent-strong">
            Przerwa {formatRest(restLeft)}
          </p>
          <div className="mt-2 flex items-center justify-center gap-3">
            <button
              type="button"
              className="min-h-11 rounded-md px-3 text-sm font-semibold text-accent-strong hover:text-accent focus-visible:outline-none focus-visible:shadow-[var(--glow-accent)]"
              onClick={() => setRestLeft((prev) => (prev == null ? 30 : prev + 30))}
            >
              +30 s
            </button>
            <button
              type="button"
              className="min-h-11 rounded-md px-3 text-xs font-semibold uppercase tracking-[0.08em] text-muted-strong hover:text-foreground focus-visible:outline-none focus-visible:shadow-[var(--glow-accent)]"
              onClick={() => {
                if (restInterval.current) clearInterval(restInterval.current);
                restInterval.current = null;
                setRestLeft(null);
              }}
            >
              Pomiń
            </button>
          </div>
        </div>
      ) : null}
      {toastNode}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface px-3 py-3 text-center">
      <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted">{label}</p>
      <p className="mt-1 font-mono text-base font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function ScorePicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number | null;
  onChange: (v: number) => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface px-3 py-3">
      <p className="mb-2 text-sm font-medium">{label}</p>
      <div className="grid grid-cols-5 gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`rounded-[8px] border py-2 font-mono text-sm font-semibold tabular-nums transition-colors ${
              value === n
                ? "border-accent-border bg-accent text-accent-foreground"
                : "border-border-strong text-muted hover:border-accent-border"
            }`}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}
