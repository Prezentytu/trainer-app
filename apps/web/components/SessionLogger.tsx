"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  api,
  LoggedExerciseInput,
  SessionDetail,
  WorkoutSessionInput,
} from "@/lib/api";
import { ExerciseThumb } from "@/components/ExerciseThumb";
import { Badge, Button, ErrorBanner, formatRest, inputClass } from "@/components/ui";
import { demoMedia } from "@/lib/youtube";

type Props = {
  session: SessionDetail;
  /** Gdy podane — zapis przez api.portal.*; inaczej api.sessions.* */
  portalToken?: string;
  onUpdated: (session: SessionDetail) => void;
  onCompleted?: (session: SessionDetail) => void;
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
        exerciseId: e.exerciseId,
        order: e.order,
        note: e.note,
        sets: e.sets.map((s) => ({
          setNumber: s.setNumber,
          weightKg: s.weightKg,
          reps: s.reps,
          durationSeconds: s.durationSeconds,
          distanceMeters: s.distanceMeters,
          rir: s.rir,
          rpe: s.rpe,
          isWarmup: s.isWarmup,
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

export function SessionLogger({ session, portalToken, onUpdated, onCompleted }: Props) {
  const [draft, setDraft] = useState(session);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [restLeft, setRestLeft] = useState<number | null>(null);
  const [activeEx, setActiveEx] = useState(0);

  // Synchronizacja gdy rodzic podmieni sesję (np. po reloadzie z API).
  if (session.id !== draft.id || session.status !== draft.status) {
    setDraft(session);
  }

  useEffect(() => {
    if (restLeft == null || restLeft <= 0) return;
    const t = setInterval(() => setRestLeft((s) => (s == null || s <= 1 ? null : s - 1)), 1000);
    return () => clearInterval(t);
  }, [restLeft]);

  const exercise = draft.exercises[activeEx];
  const prFlash = useMemo(
    () => draft.prs.some((p) => p.exerciseId === exercise?.exerciseId),
    [draft.prs, exercise?.exerciseId],
  );

  const persist = useCallback(
    async (next: SessionDetail, complete = false) => {
      setSaving(true);
      setError(null);
      try {
        const input = toInput(next);
        let updated: SessionDetail;
        if (portalToken) {
          updated = await api.portal.updateSession(portalToken, next.id, input);
          if (complete) updated = await api.portal.completeSession(portalToken, next.id);
        } else {
          updated = await api.sessions.update(next.id, input);
          if (complete) updated = await api.sessions.complete(next.id);
        }
        setDraft(updated);
        onUpdated(updated);
        if (complete) onCompleted?.(updated);
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setSaving(false);
      }
    },
    [onCompleted, onUpdated, portalToken],
  );

  const patchSet = (exIdx: number, setIdx: number, field: "weightKg" | "reps" | "rir", value: number | null) => {
    setDraft((prev) => {
      const exercises = prev.exercises.map((ex, i) => {
        if (i !== exIdx) return ex;
        const sets = ex.sets.map((s, j) => (j === setIdx ? { ...s, [field]: value } : s));
        return { ...ex, sets };
      });
      return { ...prev, exercises };
    });
  };

  const bump = (exIdx: number, setIdx: number, field: "weightKg" | "reps", delta: number) => {
    const s = draft.exercises[exIdx]?.sets[setIdx];
    if (!s) return;
    const cur = s[field] ?? (field === "reps" ? 0 : 0);
    const next = Math.max(0, cur + delta);
    patchSet(exIdx, setIdx, field, next);
  };

  if (!exercise) {
    return (
      <div>
        <ErrorBanner message={error} />
        <p className="text-muted">Brak ćwiczeń w tej sesji.</p>
      </div>
    );
  }

  const thumb = demoMedia({ media: exercise.media, category: exercise.category });

  return (
    <div className="space-y-4">
      <ErrorBanner message={error} />

      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">
            {draft.dayLabel ?? "Trening"} · {draft.performedOn}
          </p>
          <h1 className="font-display text-xl font-bold">
            {activeEx + 1}/{draft.exercises.length}: {exercise.exerciseName}
          </h1>
        </div>
        <div className="h-14 w-14 shrink-0">
          <ExerciseThumb
            variant="square"
            youtubeId={thumb.youtubeId}
            category={exercise.category}
            alt={exercise.exerciseName}
          />
        </div>
      </div>

      {prFlash ? (
        <div className="rounded-[10px] border border-pr/40 bg-pr-dim px-3 py-2 text-sm font-semibold text-pr">
          Nowy rekord! 🎉
        </div>
      ) : null}

      {restLeft != null ? (
        <div className="rounded-[10px] border border-accent-border bg-accent-dim px-3 py-2 text-center font-mono text-lg font-semibold tabular-nums text-accent-strong">
          Przerwa {formatRest(restLeft)}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        <div className="grid grid-cols-[2.5rem_1fr_1fr_4rem] gap-2 border-b border-border px-3 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-muted">
          <span>#</span>
          <span>Powt.</span>
          <span>Kg</span>
          <span>RIR</span>
        </div>
        {exercise.sets.map((s, setIdx) => (
          <div
            key={s.id || setIdx}
            className={`grid grid-cols-[2.5rem_1fr_1fr_4rem] items-center gap-2 border-b border-border px-3 py-2 last:border-b-0 ${
              s.isPr ? "bg-pr-dim/40" : ""
            }`}
          >
            <span className="font-mono text-sm tabular-nums text-muted">
              {s.setNumber}
              {s.isWarmup ? <span className="block text-[10px]">W</span> : null}
              {s.isPr ? <Badge tone="pr">PR</Badge> : null}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                className="h-9 w-9 shrink-0 rounded-lg bg-surface-hover text-lg text-muted-strong"
                onClick={() => bump(activeEx, setIdx, "reps", -1)}
              >
                −
              </button>
              <input
                className={`${inputClass} px-2 py-1.5 text-center`}
                value={s.reps ?? ""}
                onChange={(e) => patchSet(activeEx, setIdx, "reps", parseNum(e.target.value))}
                inputMode="numeric"
              />
              <button
                type="button"
                className="h-9 w-9 shrink-0 rounded-lg bg-surface-hover text-lg text-muted-strong"
                onClick={() => bump(activeEx, setIdx, "reps", 1)}
              >
                +
              </button>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                className="h-9 w-9 shrink-0 rounded-lg bg-surface-hover text-lg text-muted-strong"
                onClick={() => bump(activeEx, setIdx, "weightKg", -2.5)}
              >
                −
              </button>
              <input
                className={`${inputClass} px-2 py-1.5 text-center`}
                value={s.weightKg ?? ""}
                onChange={(e) => patchSet(activeEx, setIdx, "weightKg", parseNum(e.target.value))}
                inputMode="decimal"
              />
              <button
                type="button"
                className="h-9 w-9 shrink-0 rounded-lg bg-surface-hover text-lg text-muted-strong"
                onClick={() => bump(activeEx, setIdx, "weightKg", 2.5)}
              >
                +
              </button>
            </div>
            <input
              className={`${inputClass} px-2 py-1.5 text-center`}
              value={s.rir ?? ""}
              onChange={(e) => patchSet(activeEx, setIdx, "rir", parseNum(e.target.value))}
              inputMode="decimal"
            />
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant="ghost" onClick={() => setRestLeft(90)} disabled={restLeft != null}>
          Przerwa 90s
        </Button>
        <Button
          variant="ghost"
          disabled={activeEx <= 0}
          onClick={() => setActiveEx((i) => Math.max(0, i - 1))}
        >
          ← Poprzednie
        </Button>
        {activeEx < draft.exercises.length - 1 ? (
          <Button
            onClick={() => {
              void persist(draft);
              setActiveEx((i) => i + 1);
              setRestLeft(90);
            }}
          >
            Następne →
          </Button>
        ) : (
          <Button
            disabled={saving}
            onClick={() => void persist(draft, true)}
          >
            {saving ? "Zapisywanie…" : "Zakończ trening"}
          </Button>
        )}
        <Button variant="ghost" disabled={saving} onClick={() => void persist(draft)}>
          Zapisz
        </Button>
      </div>
    </div>
  );
}
