"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  api,
  LoggedExerciseInput,
  PrevLoggedSet,
  SessionDetail,
  WorkoutSessionInput,
} from "@/lib/api";
import { ExerciseThumb } from "@/components/ExerciseThumb";
import { YoutubeLite } from "@/components/YoutubeLite";
import { Badge, Button, ErrorBanner, formatRest, inputClass } from "@/components/ui";
import { demoMedia } from "@/lib/youtube";

type Props = {
  session: SessionDetail;
  /** Gdy podane — zapis przez api.portal.*; inaczej api.sessions.* */
  portalToken?: string;
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
  const [videoId, setVideoId] = useState<string | null>(null);
  const [videoTitle, setVideoTitle] = useState("");
  const [clock, setClock] = useState(() => elapsedLabel(Date.parse(session.createdAt)));
  const [prCelebrate, setPrCelebrate] = useState<string | null>(null);

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
        if (complete) setSummary(updated);
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
    [onPersistFailed, onUpdated, portalToken],
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
  };

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
          Wróć do home
        </Button>
      </div>
    );
  }

  if (draft.exercises.length === 0) {
    return (
      <div>
        <ErrorBanner message={error} />
        <p className="text-muted">Brak ćwiczeń w tej sesji.</p>
      </div>
    );
  }

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
            {completedEdit ? "Zapisz zmiany" : "Zakończ"}
          </Button>
        </div>
        {prCelebrate ? (
          <div
            className="mt-2 rounded-[10px] border border-pr/50 bg-pr-dim px-3 py-2 text-center text-sm font-semibold text-pr"
            role="status"
          >
            {prCelebrate}
          </div>
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
        return (
          <section key={exercise.id} className="overflow-hidden rounded-xl border border-border bg-surface">
            <div className="flex items-center gap-3 border-b border-border px-3 py-3">
              <button
                type="button"
                className="h-12 w-12 shrink-0"
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
                <h2 className="truncate font-display text-base font-bold">{exercise.exerciseName}</h2>
                <p className="font-mono text-xs tabular-nums text-muted">
                  przerwa {formatRest(exercise.restSeconds ?? 90)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-[2.25rem_minmax(0,1fr)_minmax(0,1.4fr)_2.25rem] gap-1 border-b border-border px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted">
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
                  className={`grid grid-cols-[2.25rem_minmax(0,1fr)_minmax(0,1.4fr)_2.25rem] items-center gap-1 border-b border-border px-3 py-2 last:border-b-0 ${
                    s.completed ? "bg-accent-dim/25" : ""
                  } ${s.completed && s.isPr ? "bg-pr-dim/40" : ""}`}
                >
                  <div className="font-mono text-sm tabular-nums text-muted">
                    {s.setNumber}
                    {s.isWarmup ? <span className="block text-[9px]">W</span> : null}
                    {s.completed && s.isPr ? (
                      <span className="mt-0.5 inline-block">
                        <Badge tone="pr">PR</Badge>
                      </span>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    className="truncate text-left font-mono text-xs tabular-nums text-muted hover:text-accent"
                    onClick={() => copyPrev(exIdx, setIdx)}
                    title="Skopiuj do Dziś"
                  >
                    {formatPrev(prev)}
                  </button>
                  <div className="flex min-w-0 items-center gap-1">
                    <input
                      className={`${inputClass} min-w-0 flex-1 px-1.5 py-1.5 text-center text-sm`}
                      value={s.weightKg ?? ""}
                      onChange={(e) => patchSet(exIdx, setIdx, { weightKg: parseNum(e.target.value) })}
                      inputMode="decimal"
                      aria-label="kg"
                      placeholder="kg"
                    />
                    <span className="text-muted-faint">×</span>
                    <input
                      className={`${inputClass} min-w-0 flex-1 px-1.5 py-1.5 text-center text-sm`}
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
                    className={`mx-auto flex h-8 w-8 items-center justify-center rounded-lg border text-sm font-bold ${
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
                className="font-mono text-lg font-bold text-pr hover:text-pr"
                onClick={() => addSet(exIdx)}
                aria-label="Dodaj serię"
              >
                +
              </button>
              {exercise.sets.length > 1 ? (
                <button
                  type="button"
                  className="text-xs text-muted hover:text-danger"
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
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-accent-border bg-accent-dim px-4 py-3 text-center font-mono text-lg font-semibold tabular-nums text-accent-strong">
          Przerwa {formatRest(restLeft)}
          <button
            type="button"
            className="ml-3 text-xs font-sans font-semibold uppercase tracking-[0.08em] text-muted-strong"
            onClick={() => {
              if (restInterval.current) clearInterval(restInterval.current);
              restInterval.current = null;
              setRestLeft(null);
            }}
          >
            Pomiń
          </button>
        </div>
      ) : null}
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
