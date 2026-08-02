"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  api,
  Exercise,
  LoggedExerciseInput,
  LoggedSet,
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
  useUndoToast,
} from "@/components/ui";
import { demoMedia } from "@/lib/youtube";
import { unlockAudio } from "@/lib/restAlarm";
import { clearLocalDraft, readLocalDraft, saveLocalDraft } from "@/lib/sessionDraft";
import { SetValueInput } from "@/components/session/SetValueInput";
import { SessionClock } from "@/components/session/SessionClock";
import { RestTimer } from "@/components/session/RestTimer";
import { useRestTimer } from "@/components/session/useRestTimer";
import { useWakeLock } from "@/components/session/useWakeLock";
import { PlateCalculator } from "@/components/session/PlateCalculator";
import { formatKg } from "@/lib/plates";

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

type LocalSet = LoggedSet & { uid: string };
type LocalExercise = Omit<SessionDetail["exercises"][number], "sets"> & { sets: LocalSet[] };
type LocalSession = Omit<SessionDetail, "exercises"> & { exercises: LocalExercise[] };

type ActiveCell = { exIdx: number; setIdx: number; field: "weight" | "reps" };

function newUid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `u-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function withUids(session: SessionDetail, prevUids?: Map<string, string>): LocalSession {
  return {
    ...session,
    exercises: session.exercises.map((ex, exIdx) => ({
      ...ex,
      sets: ex.sets.map((s, setIdx) => {
        const stableKey = s.id > 0 ? `id:${s.id}` : `tmp:${exIdx}:${setIdx}:${s.setNumber}`;
        const uid =
          prevUids?.get(stableKey) ??
          (s.id > 0 ? `s-${s.id}` : newUid());
        return { ...s, uid };
      }),
    })),
  };
}

function collectUids(session: LocalSession): Map<string, string> {
  const map = new Map<string, string>();
  session.exercises.forEach((ex, exIdx) => {
    ex.sets.forEach((s, setIdx) => {
      const stableKey = s.id > 0 ? `id:${s.id}` : `tmp:${exIdx}:${setIdx}:${s.setNumber}`;
      map.set(stableKey, s.uid);
    });
  });
  return map;
}

function stripUids(session: LocalSession): SessionDetail {
  return {
    ...session,
    exercises: session.exercises.map((ex) => ({
      ...ex,
      sets: ex.sets.map(({ uid: _uid, ...s }) => s),
    })),
  };
}

function toInput(session: LocalSession): WorkoutSessionInput {
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
        id: e.id > 0 ? e.id : null,
        exerciseId: e.exerciseId,
        order: e.order,
        note: e.note,
        sets: e.sets.map((s) => ({
          id: s.id > 0 ? s.id : null,
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

/** Z serwera: id, isPr, estimated1Rm, agregaty. Z lokalnego: wartości wpisane przez użytkownika. */
function reconcile(local: LocalSession, server: SessionDetail): LocalSession {
  const uidMap = collectUids(local);
  const serverLocal = withUids(server, uidMap);

  const localExById = new Map(local.exercises.filter((e) => e.id > 0).map((e) => [e.id, e]));
  const localExByOrder = new Map(local.exercises.map((e) => [e.order, e]));

  const exercises: LocalExercise[] = serverLocal.exercises.map((sEx) => {
    const lEx =
      (sEx.id > 0 ? localExById.get(sEx.id) : undefined) ?? localExByOrder.get(sEx.order);

    const localSets = lEx?.sets ?? [];
    const sets: LocalSet[] = sEx.sets.map((sSet, idx) => {
      const lSet =
        (sSet.id > 0 ? localSets.find((s) => s.id === sSet.id) : undefined) ??
        localSets.find((s) => s.uid === sSet.uid) ??
        localSets[idx];

      if (!lSet) {
        return { ...sSet, uid: sSet.id > 0 ? `s-${sSet.id}` : sSet.uid || newUid() };
      }
      return {
        ...lSet,
        id: sSet.id > 0 ? sSet.id : lSet.id,
        uid: lSet.uid,
        isPr: sSet.isPr,
        estimated1Rm: sSet.estimated1Rm,
      };
    });

    // Lokalne serie jeszcze bez id, których nie ma na serwerze (race) — dołącz.
    for (const lSet of localSets) {
      if (lSet.id > 0) continue;
      if (sets.some((s) => s.uid === lSet.uid)) continue;
      sets.push(lSet);
    }

    return {
      ...sEx,
      note: lEx?.note ?? sEx.note,
      sets: sets.map((s, i) => ({ ...s, setNumber: i + 1 })),
    };
  });

  return {
    ...serverLocal,
    note: local.note,
    exercises,
    // agregaty i PR z serwera
    totalSets: server.totalSets,
    totalVolumeKg: server.totalVolumeKg,
    prs: server.prs,
    feelingScore: server.feelingScore,
    sleepScore: server.sleepScore,
    energyScore: server.energyScore,
    status: server.status,
    durationSeconds: server.durationSeconds,
  };
}

function formatPrev(p: PrevLoggedSet | undefined): string {
  if (!p) return "—";
  if (p.weightKg != null && p.reps != null) return `${formatKg(p.weightKg)} × ${p.reps}`;
  if (p.reps != null) return `${p.reps} powt.`;
  if (p.durationSeconds != null) return formatRest(p.durationSeconds);
  return "—";
}

function prevPlaceholder(p: PrevLoggedSet | undefined, field: "weight" | "reps"): string | undefined {
  if (!p) return undefined;
  if (field === "weight") return p.weightKg != null ? formatKg(p.weightKg) : undefined;
  return p.reps != null ? String(p.reps) : undefined;
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
  const draftScope = portalToken ?? "trainer";
  const [initial] = useState(() => {
    if (typeof window !== "undefined" && session.status === "in_progress") {
      const local = readLocalDraft(draftScope, session.id);
      if (local && local.status === "in_progress") {
        return { draft: withUids(local), restored: true };
      }
    }
    return { draft: withUids(session), restored: false };
  });
  const [draft, setDraft] = useState<LocalSession>(initial.draft);
  const [restoredBanner, setRestoredBanner] = useState(initial.restored);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [summary, setSummary] = useState<SessionDetail | null>(null);
  const [checkinSession, setCheckinSession] = useState<SessionDetail | null>(null);
  const [feelingScore, setFeelingScore] = useState<number | null>(null);
  const [sleepScore, setSleepScore] = useState<number | null>(null);
  const [energyScore, setEnergyScore] = useState<number | null>(null);
  const [swapExIdx, setSwapExIdx] = useState<number | null>(null);
  const [swapSearch, setSwapSearch] = useState("");
  const [videoId, setVideoId] = useState<string | null>(null);
  const [videoTitle, setVideoTitle] = useState("");
  const [prCelebrate, setPrCelebrate] = useState<string | null>(null);
  const [activeCell, setActiveCell] = useState<ActiveCell | null>(null);
  const [platesOpen, setPlatesOpen] = useState(false);
  const { showUndoToast, toastNode } = useUndoToast();

  const draftRef = useRef(draft);
  const dirtyRef = useRef(initial.restored);
  const pendingRestoreSync = useRef(initial.restored);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const draftSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveChain = useRef(Promise.resolve());
  const prFlashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [startedAt] = useState(() => Date.parse(session.createdAt));
  const statusRef = useRef(session.status);

  const { rest, startRest, adjustRest, dismissRest, setExpanded } = useRestTimer(session.id);
  useWakeLock(!completedEdit && draft.status === "in_progress");

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      if (draftSaveTimer.current) clearTimeout(draftSaveTimer.current);
      if (prFlashTimer.current) clearTimeout(prFlashTimer.current);
    };
  }, []);

  const flashPr = useCallback((label: string) => {
    if (prFlashTimer.current) clearTimeout(prFlashTimer.current);
    setPrCelebrate(label);
    prFlashTimer.current = setTimeout(() => setPrCelebrate(null), 2800);
  }, []);

  const persistLocalDraft = useCallback(
    (next: LocalSession) => {
      if (completedEdit || next.status !== "in_progress") return;
      if (draftSaveTimer.current) clearTimeout(draftSaveTimer.current);
      draftSaveTimer.current = setTimeout(() => {
        saveLocalDraft(draftScope, next.id, stripUids(next));
      }, 250);
    },
    [completedEdit, draftScope],
  );

  const persist = useCallback(
    async (next: LocalSession, complete = false, opts?: { keepalive?: boolean }) => {
      setSaving(true);
      setError(null);
      const input = toInput(next);
      try {
        let updated: SessionDetail;
        if (portalToken) {
          updated = await api.portal.updateSession(portalToken, next.id, input, {
            keepalive: opts?.keepalive,
          });
          if (complete) updated = await api.portal.completeSession(portalToken, next.id);
        } else {
          updated = await api.sessions.update(next.id, input, { keepalive: opts?.keepalive });
          if (complete) updated = await api.sessions.complete(next.id);
        }

        // keepalive często nie zwraca czytelnego body — nie nadpisuj lokalnego stanu.
        if (opts?.keepalive && (!updated || typeof updated !== "object" || !("exercises" in updated))) {
          dirtyRef.current = false;
          return next;
        }

        const merged = reconcile(draftRef.current, updated);
        draftRef.current = merged;
        setDraft(merged);
        dirtyRef.current = false;
        clearLocalDraft(draftScope, next.id);

        // Rodzic: re-render tylko przy zmianie statusu (unikamy migania).
        if (updated.status !== statusRef.current || complete) {
          statusRef.current = updated.status;
          onUpdated(stripUids(merged));
        } else {
          onUpdated(stripUids(merged));
        }

        if (complete) {
          if (completedEdit || updated.feelingScore != null) setSummary(updated);
          else setCheckinSession(updated);
        }
        return merged;
      } catch (e) {
        const err = e as Error;
        setError(err.message);
        onPersistFailed?.(input, complete, err);
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [completedEdit, draftScope, onPersistFailed, onUpdated, portalToken],
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

  const flushNow = useCallback(
    (keepalive = false) => {
      if (saveTimer.current) {
        clearTimeout(saveTimer.current);
        saveTimer.current = null;
      }
      if (!dirtyRef.current && !keepalive) return;
      // synchroniczny lokalny backup przed ukryciem
      if (draftRef.current.status === "in_progress") {
        saveLocalDraft(draftScope, draftRef.current.id, stripUids(draftRef.current));
      }
      saveChain.current = saveChain.current
        .then(() => {
          void persist(draftRef.current, false, { keepalive });
        })
        .catch(() => {
          /* queue */
        });
    },
    [draftScope, persist],
  );

  // Flush przy minimalizacji / ukryciu karty
  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === "hidden") flushNow(true);
    };
    const onPageHide = () => flushNow(true);
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("pagehide", onPageHide);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("pagehide", onPageHide);
    };
  }, [flushNow]);

  // Po przywróceniu lokalnego draftu — od razu wyślij na serwer
  useEffect(() => {
    if (!pendingRestoreSync.current) return;
    pendingRestoreSync.current = false;
    dirtyRef.current = true;
    scheduleSave();
    const t = setTimeout(() => setRestoredBanner(false), 4000);
    return () => clearTimeout(t);
  }, [scheduleSave]);

  const updateDraft = (updater: (prev: LocalSession) => LocalSession) => {
    setDraft((prev) => {
      const next = updater(prev);
      draftRef.current = next;
      dirtyRef.current = true;
      persistLocalDraft(next);
      return next;
    });
    scheduleSave();
  };

  const patchSet = (
    exIdx: number,
    setIdx: number,
    patch: Partial<LocalSet>,
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
    unlockAudio();
    const exercise = draft.exercises[exIdx];
    const set = exercise?.sets[setIdx];
    if (!set) return;
    const nextCompleted = !set.completed;
    const exerciseId = exercise.exerciseId;
    const setNumber = set.setNumber;
    const setUid = set.uid;

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
      dirtyRef.current = true;
      persistLocalDraft(next);
      return next;
    });

    if (nextCompleted) startRest(exercise.restSeconds ?? 90);

    saveChain.current = saveChain.current
      .then(async () => {
        const updated = await persist(draftRef.current);
        if (!nextCompleted || !updated) return;
        const logged = updated.exercises
          .flatMap((ex) => ex.sets.map((s) => ({ ex, s })))
          .find(({ ex, s }) => {
            const localMatch = draftRef.current.exercises
              .flatMap((e) => e.sets)
              .find((ls) => ls.uid === setUid);
            return (
              ex.exerciseId === exerciseId &&
              (localMatch ? s.id === localMatch.id || s.setNumber === setNumber : s.setNumber === setNumber)
            );
          });
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

  const copyPrevSet = (exIdx: number, setIdx: number) => {
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

  const copyPrevExercise = (exIdx: number) => {
    const exercise = draft.exercises[exIdx];
    if (!exercise || exercise.prevSets.length === 0) return;
    updateDraft((prev) => ({
      ...prev,
      exercises: prev.exercises.map((ex, i) => {
        if (i !== exIdx) return ex;
        return {
          ...ex,
          sets: ex.sets.map((s, j) => {
            const p = ex.prevSets[j];
            if (!p) return s;
            return {
              ...s,
              weightKg: p.weightKg,
              reps: p.reps,
              durationSeconds: p.durationSeconds,
              distanceMeters: p.distanceMeters,
              rir: p.rir,
              rpe: p.rpe,
            };
          }),
        };
      }),
    }));
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
              uid: newUid(),
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
      clearLocalDraft(draftScope, draft.id);
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

  const nextRestLabel = useMemo(() => {
    const idx = currentExerciseIdx >= 0 ? currentExerciseIdx : 0;
    const ex = draft.exercises[idx];
    if (!ex) return null;
    const nextSet = ex.sets.find((s) => !s.completed);
    return nextSet ? `${ex.exerciseName} · seria ${nextSet.setNumber}` : ex.exerciseName;
  }, [currentExerciseIdx, draft.exercises]);

  const stepActive = (field: "weight" | "reps", delta: number) => {
    if (!activeCell) return;
    const { exIdx, setIdx } = activeCell;
    const set = draft.exercises[exIdx]?.sets[setIdx];
    if (!set) return;
    if (field === "weight") {
      const base = set.weightKg ?? 0;
      const next = Math.round((base + delta) * 100) / 100;
      patchSet(exIdx, setIdx, { weightKg: next < 0 ? 0 : next });
    } else {
      const base = set.reps ?? 0;
      const next = Math.max(0, Math.min(999, base + delta));
      patchSet(exIdx, setIdx, { reps: next });
    }
    setActiveCell({ exIdx, setIdx, field });
  };

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
      {restoredBanner ? (
        <div
          role="status"
          className="rounded-md border border-accent-border bg-accent-dim/40 px-3 py-2 text-sm text-accent-strong"
        >
          Przywrócono niezapisane zmiany
        </div>
      ) : null}

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
              {completedEdit ? (
                <span className="font-mono text-sm tabular-nums text-muted">
                  {formatRest(draft.durationSeconds ?? 0)}
                </span>
              ) : (
                <SessionClock startedAt={startedAt} />
              )}
              <span
                className={`text-xs text-muted transition-opacity duration-[var(--dur-fast)] ${
                  saving ? "opacity-100" : "opacity-0"
                }`}
                aria-live="polite"
              >
                Zapis…
              </span>
            </div>
          </div>
          <Button disabled={saving} onClick={() => void finish()}>
            {completedEdit ? "Zapisz zmiany" : "Zakończ trening"}
          </Button>
        </div>
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
            key={exercise.id > 0 ? exercise.id : `ex-${exIdx}`}
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
              <div className="flex shrink-0 items-center gap-1">
                {exercise.prevSets.length > 0 ? (
                  <Button
                    type="button"
                    variant="ghost"
                    className="text-xs"
                    onClick={() => copyPrevExercise(exIdx)}
                    title="Skopiuj poprzednie wartości"
                  >
                    Poprz.
                  </Button>
                ) : null}
                {libraryExercises.length > 0 ? (
                  <Button
                    type="button"
                    variant="ghost"
                    className="text-xs"
                    onClick={() => {
                      setSwapExIdx(swapExIdx === exIdx ? null : exIdx);
                      setSwapSearch("");
                    }}
                  >
                    Podmień
                  </Button>
                ) : null}
              </div>
            </div>

            {swapExIdx === exIdx ? (
              <div className="border-b border-border px-3 py-3">
                <input
                  className={`${inputClass} mb-2 w-full px-2 py-1.5`}
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

            <div className="grid grid-cols-[2.25rem_minmax(0,1fr)_2.75rem] gap-1 border-b border-border px-3 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-muted">
              <span>Seria</span>
              <span>Dziś</span>
              <span className="text-center">OK</span>
            </div>

            {exercise.sets.map((s, setIdx) => {
              const prev = exercise.prevSets[setIdx];
              const isActiveRow =
                activeCell?.exIdx === exIdx && activeCell?.setIdx === setIdx;
              return (
                <div key={s.uid}>
                  <SetRow
                    set={s}
                    prev={prev}
                    completed={s.completed}
                    isPr={s.isPr}
                    onWeight={(v) => patchSet(exIdx, setIdx, { weightKg: v })}
                    onReps={(v) => patchSet(exIdx, setIdx, { reps: v })}
                    onFocusWeight={() => setActiveCell({ exIdx, setIdx, field: "weight" })}
                    onFocusReps={() => setActiveCell({ exIdx, setIdx, field: "reps" })}
                    onToggle={() => toggleComplete(exIdx, setIdx)}
                    onCopyPrev={() => copyPrevSet(exIdx, setIdx)}
                  />
                  {isActiveRow ? (
                    <div className="flex flex-wrap items-center gap-1 border-b border-border bg-surface-sunken px-2 py-1.5">
                      <ToolbarBtn onClick={() => stepActive("weight", -2.5)}>−2,5</ToolbarBtn>
                      <ToolbarBtn onClick={() => stepActive("weight", 2.5)}>+2,5</ToolbarBtn>
                      <ToolbarBtn onClick={() => stepActive("reps", -1)}>−1</ToolbarBtn>
                      <ToolbarBtn onClick={() => stepActive("reps", 1)}>+1</ToolbarBtn>
                      <ToolbarBtn onClick={() => setPlatesOpen(true)}>Talerze</ToolbarBtn>
                      <ToolbarBtn
                        onClick={() => {
                          setActiveCell(null);
                          (document.activeElement as HTMLElement | null)?.blur?.();
                        }}
                      >
                        Gotowe
                      </ToolbarBtn>
                    </div>
                  ) : null}
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
                className={`${inputClass} px-2 py-1.5`}
                placeholder="Notatka do ćwiczenia…"
                value={exercise.note ?? ""}
                onChange={(e) => patchNote(exIdx, e.target.value)}
              />
            </div>
          </section>
        );
      })}

      {rest ? (
        <RestTimer
          rest={rest}
          nextLabel={nextRestLabel}
          onAdjust={adjustRest}
          onDismiss={dismissRest}
          onExpand={setExpanded}
        />
      ) : null}

      {platesOpen && activeCell ? (
        <PlateCalculator
          targetKg={draft.exercises[activeCell.exIdx]?.sets[activeCell.setIdx]?.weightKg}
          onApply={(kg) => {
            patchSet(activeCell.exIdx, activeCell.setIdx, { weightKg: kg });
          }}
          onClose={() => setPlatesOpen(false)}
        />
      ) : null}

      {prCelebrate ? (
        <div
          className="pr-celebrate-in fixed bottom-20 left-1/2 z-[55] w-[min(100%-2rem,24rem)] -translate-x-1/2 rounded-md border border-pr/50 bg-pr-dim px-3 py-2.5 text-center shadow-[var(--glow-pr)]"
          role="status"
        >
          <div className="text-xs font-semibold uppercase tracking-caps text-pr">Nowy rekord</div>
          <div className="mt-0.5 font-display text-sm font-semibold text-pr">{prCelebrate}</div>
        </div>
      ) : null}
      {toastNode}
    </div>
  );
}

const SetRow = memo(function SetRow({
  set,
  prev,
  completed,
  isPr,
  onWeight,
  onReps,
  onFocusWeight,
  onFocusReps,
  onToggle,
  onCopyPrev,
}: {
  set: LocalSet;
  prev: PrevLoggedSet | undefined;
  completed: boolean;
  isPr: boolean;
  onWeight: (v: number | null) => void;
  onReps: (v: number | null) => void;
  onFocusWeight: () => void;
  onFocusReps: () => void;
  onToggle: () => void;
  onCopyPrev: () => void;
}) {
  return (
    <div
      className={`grid grid-cols-[2.25rem_minmax(0,1fr)_2.75rem] items-center gap-1 border-b border-border px-3 py-2 ${
        completed ? "bg-accent-dim/25" : ""
      } ${completed && isPr ? "bg-pr-dim/40" : ""}`}
    >
      <button
        type="button"
        className="font-mono text-sm tabular-nums text-muted hover:text-accent focus-visible:outline-none focus-visible:text-accent"
        onClick={onCopyPrev}
        title={prev ? `Poprzednio: ${formatPrev(prev)}` : "Brak poprzedniej serii"}
      >
        {set.setNumber}
        {set.isWarmup ? <span className="block text-xs">W</span> : null}
        {completed && isPr ? (
          <span className="mt-0.5 inline-block">
            <Badge tone="pr">PR</Badge>
          </span>
        ) : null}
      </button>
      <div className="flex min-w-0 items-center gap-1">
        <SetValueInput
          kind="weight"
          value={set.weightKg}
          placeholder={prevPlaceholder(prev, "weight") ?? "kg"}
          ariaLabel="kg"
          onCommit={onWeight}
          onFocusField={onFocusWeight}
        />
        <span className="text-muted-faint">×</span>
        <SetValueInput
          kind="reps"
          value={set.reps}
          placeholder={prevPlaceholder(prev, "reps") ?? "powt"}
          ariaLabel="powtórzenia"
          onCommit={onReps}
          onFocusField={onFocusReps}
        />
      </div>
      <button
        type="button"
        onClick={onToggle}
        className={`mx-auto flex h-11 w-11 items-center justify-center rounded-lg border text-base font-bold transition-colors duration-[var(--dur-fast)] focus-visible:outline-none focus-visible:shadow-[var(--glow-accent)] ${
          completed
            ? "border-accent-border bg-accent text-accent-foreground"
            : "border-border-strong text-muted hover:border-accent-border"
        }`}
        aria-label={completed ? "Cofnij ukończenie" : "Oznacz serię jako ukończoną"}
      >
        {completed ? "✓" : ""}
      </button>
    </div>
  );
});

function ToolbarBtn({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      className="inline-flex h-11 min-w-11 items-center justify-center rounded-md border border-border-strong bg-surface px-2.5 font-mono text-xs font-semibold tabular-nums text-foreground-secondary hover:border-accent-border hover:text-accent-strong focus-visible:outline-none focus-visible:shadow-[var(--glow-accent)]"
      onClick={onClick}
    >
      {children}
    </button>
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
