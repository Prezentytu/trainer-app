"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  api,
  Exercise,
  LoggedExerciseInput,
  LoggedSet,
  PrevLoggedSet,
  ProgressReport,
  SessionCheckinInput,
  SessionDetail,
  WorkoutSessionInput,
} from "@/lib/api";
import { ExerciseThumb } from "@/components/ExerciseThumb";
import { YoutubeLite } from "@/components/YoutubeLite";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorBanner,
  formatRest,
  IconButton,
  inputClass,
  useUndoToast,
} from "@/components/ui";
import { demoMedia } from "@/lib/youtube";
import { unlockAudio } from "@/lib/restAlarm";
import { clearLocalDraft, readLocalDraft, saveLocalDraft } from "@/lib/sessionDraft";
import { readAutoRest } from "@/lib/portalPrefs";
import { SetValueInput } from "@/components/session/SetValueInput";
import { SessionClock } from "@/components/session/SessionClock";
import { RestTimer } from "@/components/session/RestTimer";
import { SessionDock } from "@/components/session/SessionDock";
import { useRestTimer } from "@/components/session/useRestTimer";
import { useWakeLock } from "@/components/session/useWakeLock";
import { PlateCalculator } from "@/components/session/PlateCalculator";
import { formatKg } from "@/lib/plates";
import { polishSetCount } from "@/lib/plural";

const SET_GRID =
  "grid grid-cols-[2rem_minmax(3.5rem,1fr)_4.5rem_4rem_2.75rem_2.25rem] gap-1.5 items-center";

export type SessionLoggerMode = "client" | "behalf" | "completedEdit";

type Props = {
  session: SessionDetail;
  /** Gdy podane — zapis przez api.portal.*; inaczej api.sessions.* */
  portalToken?: string;
  /** Biblioteka ćwiczeń do podmiany w trakcie sesji. */
  libraryExercises?: Exercise[];
  /**
   * client — portal, live clock + wake lock;
   * behalf — trener wpisuje za klienta (bez zegara live);
   * completedEdit — poprawa ukończonej sesji.
   */
  mode?: SessionLoggerMode;
  /** @deprecated użyj mode="completedEdit" */
  completedEdit?: boolean;
  /** Imię klienta — banner w trybie behalf. */
  clientName?: string;
  onUpdated: (session: SessionDetail) => void;
  onCompleted?: (session: SessionDetail) => void;
  /** Wywołane przy nieudanym zapisie (np. offline queue). */
  onPersistFailed?: (input: WorkoutSessionInput, complete: boolean, error: Error) => void;
};

function MoreIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <circle cx="5" cy="12" r="2" />
      <circle cx="12" cy="12" r="2" />
      <circle cx="19" cy="12" r="2" />
    </svg>
  );
}

function formatPrevDate(iso: string | null | undefined): string {
  if (!iso) return "Poprz.";
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return "Poprz.";
  return d.toLocaleDateString("pl-PL", { day: "numeric", month: "short" });
}

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
        substitutedFromExerciseId: e.substitutedFromExerciseId ?? null,
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
        targetWeightKg: sSet.targetWeightKg ?? lSet.targetWeightKg,
        targetReps: sSet.targetReps ?? lSet.targetReps,
        targetDurationSeconds: sSet.targetDurationSeconds ?? lSet.targetDurationSeconds,
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
      targetRir: sEx.targetRir ?? lEx?.targetRir,
      tempo: sEx.tempo ?? lEx?.tempo,
      planNote: sEx.planNote ?? lEx?.planNote,
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
  if (p.weightKg != null && p.reps != null) return `${formatKg(p.weightKg)}×${p.reps}`;
  if (p.durationSeconds != null) return `${p.durationSeconds} s`;
  if (p.reps != null) return `${p.reps}`;
  return "—";
}

function formatTargetLabel(set: LocalSet, isTime: boolean): string {
  if (isTime && set.targetDurationSeconds != null) return `${set.targetDurationSeconds} s`;
  if (set.targetWeightKg != null && set.targetReps != null)
    return `${formatKg(set.targetWeightKg)}×${set.targetReps}`;
  if (set.targetReps != null) return `${set.targetReps}`;
  return "";
}

function isBelowTarget(set: LocalSet, isTime: boolean): boolean {
  if (!set.completed) return false;
  if (isTime) {
    const t = set.targetDurationSeconds;
    return t != null && (set.durationSeconds ?? set.reps ?? 0) < t;
  }
  const tw = set.targetWeightKg;
  const tr = set.targetReps;
  if (tr != null && (set.reps ?? 0) < tr) return true;
  if (tw != null && (set.weightKg ?? 0) < tw) return true;
  return false;
}

function restPillLabel(seconds: number): string {
  if (seconds >= 60) {
    const min = seconds / 60;
    const label = Number.isInteger(min) ? String(min) : String(min).replace(".", ",");
    return `${label} min`;
  }
  return `${seconds} s`;
}

export function SessionLogger({
  session,
  portalToken,
  libraryExercises = [],
  mode,
  completedEdit = false,
  clientName,
  onUpdated,
  onCompleted,
  onPersistFailed,
}: Props) {
  const resolvedMode: SessionLoggerMode =
    mode ?? (completedEdit ? "completedEdit" : "client");
  const isCompletedEdit = resolvedMode === "completedEdit";
  const isBehalf = resolvedMode === "behalf";
  const liveClock = resolvedMode === "client";

  const draftScope = portalToken ?? "trainer";
  const [initial] = useState(() => {
    if (typeof window !== "undefined" && session.status === "in_progress" && !isBehalf) {
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
  const [feelingScore, setFeelingScore] = useState<number | null>(null);
  const [sleepScore, setSleepScore] = useState<number | null>(null);
  const [energyScore, setEnergyScore] = useState<number | null>(null);
  const [swapExIdx, setSwapExIdx] = useState<number | null>(null);
  const [swapSearch, setSwapSearch] = useState("");
  const [menuExIdx, setMenuExIdx] = useState<number | null>(null);
  const [setTypeMenu, setSetTypeMenu] = useState<{ exIdx: number; setIdx: number } | null>(null);
  const [videoId, setVideoId] = useState<string | null>(null);
  const [videoTitle, setVideoTitle] = useState("");
  const [prCelebrate, setPrCelebrate] = useState<string | null>(null);
  const [activeCell, setActiveCell] = useState<ActiveCell | null>(null);
  const [platesOpen, setPlatesOpen] = useState(false);
  const [sessionNote, setSessionNote] = useState("");
  const [progressReport, setProgressReport] = useState<ProgressReport | null>(null);
  const [trainerComment, setTrainerComment] = useState("");
  const [clientReply, setClientReply] = useState("");
  const [collapsedEx, setCollapsedEx] = useState<Set<number>>(() => new Set());
  const [noteOpenEx, setNoteOpenEx] = useState<Set<number>>(() => new Set());
  const [restOverrideByEx, setRestOverrideByEx] = useState<Record<number, number>>({});
  const { showUndoToast, toastNode } = useUndoToast();

  const draftRef = useRef(draft);
  const dirtyRef = useRef(initial.restored);
  const pendingRestoreSync = useRef(initial.restored);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const draftSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveChain = useRef(Promise.resolve());
  const prFlashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const setRowRefs = useRef<Map<string, HTMLDivElement | null>>(new Map());
  const [startedAt] = useState(() => Date.parse(session.createdAt));
  const statusRef = useRef(session.status);

  const { rest, startRest, adjustRest, dismissRest, setExpanded } = useRestTimer(session.id);
  useWakeLock(liveClock && draft.status === "in_progress");

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      if (draftSaveTimer.current) clearTimeout(draftSaveTimer.current);
      if (prFlashTimer.current) clearTimeout(prFlashTimer.current);
    };
  }, []);

  useEffect(() => {
    if (!summary || !portalToken) return;
    api.portal.progressReport(portalToken).then(setProgressReport).catch(() => setProgressReport(null));
  }, [portalToken, summary]);

  const flashPr = useCallback((label: string) => {
    if (prFlashTimer.current) clearTimeout(prFlashTimer.current);
    setPrCelebrate(label);
    prFlashTimer.current = setTimeout(() => setPrCelebrate(null), 2800);
  }, []);

  const persistLocalDraft = useCallback(
    (next: LocalSession) => {
      if (isCompletedEdit || isBehalf || next.status !== "in_progress") return;
      if (draftSaveTimer.current) clearTimeout(draftSaveTimer.current);
      draftSaveTimer.current = setTimeout(() => {
        saveLocalDraft(draftScope, next.id, stripUids(next));
      }, 250);
    },
    [isBehalf, isCompletedEdit, draftScope],
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
          setSummary(updated);
          setFeelingScore(updated.feelingScore);
          setSleepScore(updated.sleepScore);
          setEnergyScore(updated.energyScore);
          setSessionNote(updated.note ?? "");
          if (portalToken && typeof window !== "undefined") {
            localStorage.setItem(`wa-completed-session-${portalToken}`, "1");
          }
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
    [draftScope, onPersistFailed, onUpdated, portalToken],
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

    if (nextCompleted && liveClock && readAutoRest()) {
      const seconds = restOverrideByEx[exIdx] ?? exercise.restSeconds ?? 90;
      startRest(seconds);
    }

    if (nextCompleted) {
      queueMicrotask(() => {
        const next = draftRef.current;
        const exDone = next.exercises[exIdx]?.sets.every((s) => s.completed);
        if (exDone) {
          setCollapsedEx((prev) => new Set(prev).add(exIdx));
        }
        outer: for (let i = 0; i < next.exercises.length; i++) {
          for (let j = 0; j < next.exercises[i].sets.length; j++) {
            if (!next.exercises[i].sets[j].completed) {
              const uid = next.exercises[i].sets[j].uid;
              setRowRefs.current.get(uid)?.scrollIntoView({ block: "center", behavior: "smooth" });
              break outer;
            }
          }
        }
      });
    }

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
              targetWeightKg: last?.targetWeightKg ?? null,
              targetReps: last?.targetReps ?? null,
              targetDurationSeconds: last?.targetDurationSeconds ?? null,
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
      const elapsedSec = liveClock
        ? Math.max(60, Math.floor((Date.now() - startedAt) / 1000))
        : draftRef.current.durationSeconds;
      const withDuration: LocalSession = {
        ...draftRef.current,
        durationSeconds: elapsedSec ?? draftRef.current.durationSeconds,
      };
      draftRef.current = withDuration;
      await persist(withDuration, true);
      clearLocalDraft(draftScope, draft.id);
    } catch {
      /* error state */
    }
  };

  const focusCell = (exIdx: number, setIdx: number, field: "weight" | "reps") => {
    setActiveCell({ exIdx, setIdx, field });
    const uid = draft.exercises[exIdx]?.sets[setIdx]?.uid;
    if (uid) {
      const el = setRowRefs.current.get(uid);
      el?.scrollIntoView({ block: "center", behavior: "smooth" });
    }
    // Fokus na input — po re-renderze
    queueMicrotask(() => {
      const row = uid ? setRowRefs.current.get(uid) : null;
      const input = row?.querySelector<HTMLInputElement>(
        field === "weight" ? 'input[aria-label="kg"]' : 'input[aria-label="powtórzenia"], input[aria-label="sekundy"]',
      );
      input?.focus();
    });
  };

  const navigateCell = (dir: -1 | 1) => {
    if (!activeCell) return;
    const { exIdx, setIdx, field } = activeCell;
    const ex = draft.exercises[exIdx];
    if (!ex) return;
    const isTime = ex.exerciseType === "time";

    if (dir === 1) {
      if (field === "weight" && !isTime) {
        focusCell(exIdx, setIdx, "reps");
        return;
      }
      // następna seria
      if (setIdx + 1 < ex.sets.length) {
        focusCell(exIdx, setIdx + 1, isTime ? "reps" : "weight");
        return;
      }
      // następne ćwiczenie
      for (let i = exIdx + 1; i < draft.exercises.length; i++) {
        if (draft.exercises[i].sets.length > 0) {
          const nextTime = draft.exercises[i].exerciseType === "time";
          focusCell(i, 0, nextTime ? "reps" : "weight");
          return;
        }
      }
      setActiveCell(null);
      (document.activeElement as HTMLElement | null)?.blur?.();
      return;
    }

    // dir === -1
    if (field === "reps" && !isTime) {
      focusCell(exIdx, setIdx, "weight");
      return;
    }
    if (setIdx > 0) {
      focusCell(exIdx, setIdx - 1, isTime ? "reps" : "reps");
      return;
    }
    for (let i = exIdx - 1; i >= 0; i--) {
      const prev = draft.exercises[i];
      if (prev.sets.length > 0) {
        const prevTime = prev.exerciseType === "time";
        focusCell(i, prev.sets.length - 1, prevTime ? "reps" : "reps");
        return;
      }
    }
  };

  const sendSummaryAndClose = async () => {
    if (!summary) return;
    setSaving(true);
    setError(null);
    try {
      let updated = summary;
      const input: SessionCheckinInput = {
        feelingScore,
        sleepScore,
        energyScore,
      };
      if (feelingScore != null || sleepScore != null || energyScore != null) {
        updated = portalToken
          ? await api.portal.checkinSession(portalToken, summary.id, input)
          : await api.sessions.checkin(summary.id, input);
      }
      if (sessionNote !== (summary.note ?? "")) {
        const base = withUids(updated);
        const withNote: LocalSession = { ...base, note: sessionNote || null, status: "completed" };
        const saved = portalToken
          ? await api.portal.updateSession(portalToken, summary.id, toInput(withNote))
          : await api.sessions.update(summary.id, toInput(withNote));
        updated = { ...updated, note: saved.note };
      }
      onUpdated(updated);
      onCompleted?.(updated);
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
              substitutedFromExerciseId: ex.substitutedFromExerciseId ?? ex.exerciseId,
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

  const saveTrainerComment = async () => {
    if (!summary || !trainerComment.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await api.sessions.comment(summary.id, trainerComment.trim());
      setSummary(updated);
      setTrainerComment("");
      onUpdated(updated);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const sendClientReply = async () => {
    if (!summary || !portalToken || !clientReply.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await api.portal.replySession(portalToken, summary.id, clientReply.trim());
      setSummary(updated);
      setClientReply("");
      onUpdated(updated);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
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

  if (summary) {
    const celebrationFacts = progressReport?.facts.slice(0, 5) ?? [];
    const doneTotal = summary.exercises.reduce(
      (acc, ex) => {
        const done = ex.sets.filter((s) => s.completed).length;
        return { done: acc.done + done, total: acc.total + ex.sets.length };
      },
      { done: 0, total: 0 },
    );
    const durSec = summary.durationSeconds ?? 0;
    const durH = Math.floor(durSec / 3600);
    const durM = Math.floor((durSec % 3600) / 60);
    const durS = durSec % 60;
    const durationFmt =
      durH > 0
        ? `${durH}:${String(durM).padStart(2, "0")}:${String(durS).padStart(2, "0")}`
        : `${durM}:${String(durS).padStart(2, "0")}`;

    return (
      <div className="space-y-4 pb-28">
        <ErrorBanner message={error} />
        <div>
          <p className="text-xs font-semibold uppercase tracking-caps text-muted-faint">
            {isCompletedEdit || isBehalf ? "Zmiany zapisane" : "Trening ukończony"}
          </p>
          <h1 className="mt-1 font-display text-3xl font-bold">
            {isCompletedEdit || isBehalf ? "Gotowe" : "Dobra robota"}
          </h1>
          <p className="mt-0.5 text-[13px] text-muted">
            {summary.dayLabel ?? "Trening"}
            {summary.planName ? ` · ${summary.planName}` : ""}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Czas" value={durationFmt} />
          <StatCard
            label="Objętość"
            value={`${Math.round(summary.totalVolumeKg).toLocaleString("pl-PL")} kg`}
          />
          <StatCard label="Serie" value={`${doneTotal.done}/${doneTotal.total}`} />
          <StatCard
            label="Rekordy"
            value={String(summary.prs.length)}
            highlight={summary.prs.length > 0}
          />
        </div>

        {portalToken && celebrationFacts.length > 0 ? (
          <Card title="Twój progres">
            <p className="mb-3 text-sm text-muted">Każdy zapis przybliża Cię do celu.</p>
            <ul className="space-y-2">
              {celebrationFacts.map((fact, index) => (
                <li
                  key={`${fact.kind}-${index}`}
                  className={`text-sm ${fact.kind === "pr" ? "font-medium text-pr" : "text-foreground-secondary"}`}
                >
                  {fact.text}
                </li>
              ))}
            </ul>
          </Card>
        ) : null}

        <div className="rounded-2xl border border-border bg-surface px-4 py-1 shadow-card">
          {summary.exercises.map((ex) => {
            const done = ex.sets.filter((s) => s.completed).length;
            const isTime = ex.exerciseType === "time";
            const below = ex.sets.some((s) => isBelowTarget(s as LocalSet, isTime));
            const hasPr =
              ex.sets.some((s) => s.isPr && s.completed) ||
              summary.prs.some((p) => p.exerciseId === ex.exerciseId);
            return (
              <div
                key={ex.id}
                className="flex min-h-12 items-center gap-2.5 border-b border-border last:border-0"
              >
                <div className="min-w-0 flex-1 text-[15px] font-semibold text-foreground-secondary">
                  {ex.exerciseName}
                  {ex.substitutedFromName ? (
                    <p className="mt-0.5 text-xs font-normal text-muted">
                      zamieniono z {ex.substitutedFromName}
                    </p>
                  ) : null}
                </div>
                {hasPr ? <Badge tone="pr">PR</Badge> : null}
                <div
                  className={`shrink-0 font-mono text-[13px] tabular-nums ${
                    done < ex.sets.length || below ? "text-muted" : "text-positive"
                  }`}
                >
                  {done}/{ex.sets.length}
                  {below ? " · poniżej celu" : ""}
                </div>
              </div>
            );
          })}
        </div>

        {summary.trainerComment ? (
          <Card title="Komentarz trenera">
            <p className="whitespace-pre-wrap text-sm text-foreground-secondary">{summary.trainerComment}</p>
          </Card>
        ) : null}
        {summary.clientReply ? (
          <Card title="Odpowiedź klienta">
            <p className="whitespace-pre-wrap text-sm text-foreground-secondary">{summary.clientReply}</p>
          </Card>
        ) : null}
        {!portalToken ? (
          <Card title="Komentarz dla klienta" meta="Klient zobaczy go przy podsumowaniu treningu.">
            <textarea
              className={`${inputClass} min-h-[88px] resize-none py-3`}
              value={trainerComment}
              onChange={(e) => setTrainerComment(e.target.value)}
              placeholder="Krótka wskazówka do kolejnego treningu…"
              rows={3}
            />
            <div className="mt-3">
              <Button disabled={saving || !trainerComment.trim()} onClick={() => void saveTrainerComment()}>
                Dodaj komentarz
              </Button>
            </div>
          </Card>
        ) : summary.trainerComment ? (
          <Card title="Odpowiedz trenerowi">
            <textarea
              className={`${inputClass} min-h-[88px] resize-none py-3`}
              value={clientReply}
              onChange={(e) => setClientReply(e.target.value)}
              placeholder="Napisz, jak poszedł trening…"
              rows={3}
            />
            <div className="mt-3">
              <Button disabled={saving || !clientReply.trim()} onClick={() => void sendClientReply()}>
                Odpowiedz trenerowi
              </Button>
            </div>
          </Card>
        ) : null}

        <div className="space-y-3">
          <ScorePicker label="Samopoczucie" value={feelingScore} onChange={setFeelingScore} />
          <ScorePicker label="Sen (ostatnia noc)" value={sleepScore} onChange={setSleepScore} />
          <ScorePicker label="Energia" value={energyScore} onChange={setEnergyScore} />
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-caps text-muted">
            Wiadomość do trenera
          </p>
          <textarea
            className={`${inputClass} min-h-[88px] resize-none py-3`}
            placeholder="Np. biodra ciasne przy przysiadzie — trzecia seria lżejsza."
            value={sessionNote}
            onChange={(e) => setSessionNote(e.target.value)}
            rows={3}
          />
        </div>

        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/80 px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-md">
          <div className="mx-auto max-w-lg">
            <Button className="w-full" size="lg" disabled={saving} onClick={() => void sendSummaryAndClose()}>
              {saving ? "Wysyłanie…" : "Wyślij do trenera i zakończ"}
            </Button>
          </div>
        </div>
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

  const allSetsFlat = draft.exercises.flatMap((ex) => ex.sets);
  const doneSetsCount = allSetsFlat.filter((s) => s.completed).length;
  const totalSetsCount = allSetsFlat.length;
  const progressPct =
    totalSetsCount > 0 ? Math.round((doneSetsCount / totalSetsCount) * 100) : 0;

  // Pierwsza nieukończona seria — do podświetlenia wiersza
  let nextExIdx = -1;
  let nextSetIdx = -1;
  outer: for (let i = 0; i < draft.exercises.length; i++) {
    for (let j = 0; j < draft.exercises[i].sets.length; j++) {
      if (!draft.exercises[i].sets[j].completed) {
        nextExIdx = i;
        nextSetIdx = j;
        break outer;
      }
    }
  }

  const volumeKg = Math.round(
    draft.exercises.reduce(
      (acc, ex) =>
        acc +
        ex.sets
          .filter((s) => s.completed && s.weightKg != null && s.reps != null)
          .reduce((a, s) => a + (s.weightKg ?? 0) * (s.reps ?? 0), 0),
      0,
    ),
  );

  const activeIsTime =
    activeCell != null
      ? draft.exercises[activeCell.exIdx]?.exerciseType === "time"
      : false;

  return (
    <div className={`space-y-4 ${activeCell || (rest && !rest.expanded) ? "pb-40" : "pb-24"}`}>
      <ErrorBanner message={error} />
      {isBehalf ? (
        <div
          role="status"
          className="rounded-[10px] border border-border-strong bg-surface-raised px-3 py-2.5 text-sm text-foreground-secondary"
        >
          Wpisujesz wynik za klienta
          {clientName ? ` — ${clientName}` : ""}
        </div>
      ) : null}
      {restoredBanner ? (
        <div
          role="status"
          className="rounded-md border border-accent-border bg-accent-dim/40 px-3 py-2 text-sm text-accent-strong"
        >
          Przywrócono niezapisane zmiany
        </div>
      ) : null}

      <div className="sticky top-0 z-20 -mx-4 border-b border-border bg-background/80 px-4 pb-2.5 pt-[max(0.5rem,env(safe-area-inset-top))] backdrop-blur-md">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="break-words font-display text-lg font-semibold">
              {draft.dayLabel ?? draft.planName ?? (isCompletedEdit || isBehalf ? "Poprawa" : "Trening")}
            </h1>
            <p className="mt-0.5 font-mono text-[13px] tabular-nums text-muted">
              {doneSetsCount}/{totalSetsCount}
              {" · "}
              {liveClock ? (
                <SessionClock startedAt={startedAt} className="font-mono text-[13px] tabular-nums text-muted" />
              ) : (
                formatRest(draft.durationSeconds ?? 0)
              )}
              {volumeKg > 0 ? ` · ${volumeKg.toLocaleString("pl-PL")} kg` : null}
              <span
                className={`ml-2 inline-block w-12 text-xs transition-opacity duration-[var(--dur-fast)] ${
                  saving ? "opacity-100" : "opacity-0"
                }`}
                aria-live="polite"
              >
                Zapis…
              </span>
            </p>
          </div>
          <Button variant="secondary" disabled={saving} onClick={() => void finish()}>
            {isBehalf || isCompletedEdit ? "Zapisz wynik" : "Zakończ"}
          </Button>
        </div>
        <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-surface-active">
          <div
            className="h-full rounded-full bg-accent transition-[width] duration-[var(--dur-med)] ease-[var(--ease-out)]"
            style={{ width: `${progressPct}%` }}
          />
        </div>
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
        const allDone = exercise.sets.every((s) => s.completed);
        const isTime = exercise.exerciseType === "time";
        const trainerNote = exercise.planNote || null;
        const menuOpen = menuExIdx === exIdx;
        const doneCount = exercise.sets.filter((s) => s.completed).length;
        const isCollapsed = allDone && collapsedEx.has(exIdx);
        const restSec = restOverrideByEx[exIdx] ?? exercise.restSeconds ?? 90;
        const noteOpen = noteOpenEx.has(exIdx) || Boolean(exercise.note);
        const prevHeader = formatPrevDate(exercise.prevPerformedOn);

        if (isCollapsed) {
          return (
            <button
              key={exercise.id > 0 ? exercise.id : `ex-${exIdx}`}
              type="button"
              className="flex w-full items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-3 text-left shadow-card opacity-80 hover:opacity-100"
              onClick={() =>
                setCollapsedEx((prev) => {
                  const next = new Set(prev);
                  next.delete(exIdx);
                  return next;
                })
              }
            >
              <h2 className="display-caps min-w-0 flex-1 break-words text-base text-foreground">
                {exercise.exerciseName}
              </h2>
              <span className="shrink-0 font-mono text-[13px] tabular-nums text-positive">
                {doneCount}/{exercise.sets.length}
              </span>
            </button>
          );
        }

        return (
          <section
            key={exercise.id > 0 ? exercise.id : `ex-${exIdx}`}
            className={`space-y-3 overflow-hidden rounded-2xl border border-border bg-surface p-4 shadow-card ${
              allDone ? "opacity-80" : ""
            }`}
          >
            <div className="flex items-start gap-2">
              <button
                type="button"
                className="h-10 w-10 shrink-0 rounded-[10px] focus-visible:outline-none focus-visible:shadow-[var(--glow-accent)]"
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
              <h2 className="display-caps min-w-0 flex-1 break-words text-lg leading-snug text-foreground">
                {exercise.exerciseName}
                {exercise.substitutedFromName ? (
                  <span className="mt-0.5 block font-sans text-xs font-normal normal-case tracking-normal text-muted">
                    zamieniono z {exercise.substitutedFromName}
                  </span>
                ) : null}
              </h2>
              <div className="relative shrink-0">
                <IconButton
                  title="Więcej"
                  size="md"
                  onClick={() => setMenuExIdx(menuOpen ? null : exIdx)}
                >
                  <MoreIcon />
                </IconButton>
                {menuOpen ? (
                  <div className="absolute right-0 top-full z-10 mt-1 min-w-[10rem] rounded-[10px] border border-border bg-surface-raised py-1 shadow-[var(--shadow-raised)]">
                    {allDone ? (
                      <button
                        type="button"
                        className="block w-full px-3 py-2.5 text-left text-[13px] hover:bg-surface-hover"
                        onClick={() => {
                          setCollapsedEx((prev) => new Set(prev).add(exIdx));
                          setMenuExIdx(null);
                        }}
                      >
                        Zwiń ćwiczenie
                      </button>
                    ) : null}
                    {exercise.prevSets.length > 0 ? (
                      <button
                        type="button"
                        className="block w-full px-3 py-2.5 text-left text-[13px] hover:bg-surface-hover"
                        onClick={() => {
                          copyPrevExercise(exIdx);
                          setMenuExIdx(null);
                        }}
                      >
                        Skopiuj poprzednie
                      </button>
                    ) : null}
                    {libraryExercises.length > 0 ? (
                      <button
                        type="button"
                        className="block w-full px-3 py-2.5 text-left text-[13px] hover:bg-surface-hover"
                        onClick={() => {
                          setSwapExIdx(exIdx);
                          setSwapSearch("");
                          setMenuExIdx(null);
                        }}
                      >
                        Podmień ćwiczenie
                      </button>
                    ) : null}
                    {thumb.youtubeId ? (
                      <button
                        type="button"
                        className="block w-full px-3 py-2.5 text-left text-[13px] hover:bg-surface-hover"
                        onClick={() => {
                          setVideoId(thumb.youtubeId!);
                          setVideoTitle(exercise.exerciseName);
                          setMenuExIdx(null);
                        }}
                      >
                        Pokaż film
                      </button>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>

            <p className="flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[12px] tabular-nums text-muted">
              <span>{polishSetCount(exercise.sets.length)}</span>
              {exercise.targetRir != null ? (
                <>
                  <span aria-hidden>·</span>
                  <span>RIR {exercise.targetRir}</span>
                </>
              ) : null}
              <span aria-hidden>·</span>
              <button
                type="button"
                className="inline-flex min-h-9 items-center rounded-[8px] px-1.5 hover:bg-surface-hover hover:text-foreground focus-visible:outline-none focus-visible:shadow-[var(--glow-accent)]"
                title="Ustaw przerwę dla tego ćwiczenia"
                onClick={() => {
                  const next = restSec === 90 ? 120 : restSec === 120 ? 60 : 90;
                  setRestOverrideByEx((prev) => ({ ...prev, [exIdx]: next }));
                }}
              >
                ⏱ {restPillLabel(restSec)}
              </button>
            </p>

            {trainerNote ? (
              <p className="text-[13px] text-muted">Trener: {trainerNote}</p>
            ) : null}

            {swapExIdx === exIdx ? (
              <div className="border-t border-border pt-3">
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

            <div className="border-t border-border pt-2">
              <div
                className={`${SET_GRID} px-0.5 pb-1.5 font-mono text-[10px] font-medium uppercase tracking-caps text-muted`}
              >
                <div>#</div>
                <div>{prevHeader}</div>
                <div>{isTime ? "" : "kg"}</div>
                <div>{isTime ? "sek." : "powt."}</div>
                <div className="text-center">✓</div>
                <div />
              </div>

              {exercise.sets.map((s, setIdx) => {
                const prev = exercise.prevSets[setIdx];
                const isNext = exIdx === nextExIdx && setIdx === nextSetIdx;
                const typeMenuOpen =
                  setTypeMenu?.exIdx === exIdx && setTypeMenu?.setIdx === setIdx;
                return (
                  <div
                    key={s.uid}
                    ref={(el) => {
                      setRowRefs.current.set(s.uid, el);
                    }}
                    className="relative"
                  >
                    <SetRow
                      set={s}
                      prev={prev}
                      isTime={isTime}
                      isNext={isNext}
                      onWeight={(v) => patchSet(exIdx, setIdx, { weightKg: v })}
                      onReps={(v) =>
                        patchSet(
                          exIdx,
                          setIdx,
                          isTime ? { durationSeconds: v, reps: v } : { reps: v },
                        )
                      }
                      onFocusWeight={() => setActiveCell({ exIdx, setIdx, field: "weight" })}
                      onFocusReps={() => setActiveCell({ exIdx, setIdx, field: "reps" })}
                      onToggle={() => toggleComplete(exIdx, setIdx)}
                      onCopyPrev={() => copyPrevSet(exIdx, setIdx)}
                      onSetType={() =>
                        setSetTypeMenu(typeMenuOpen ? null : { exIdx, setIdx })
                      }
                      onRowMenu={() => {
                        if (exercise.sets.length <= 1) return;
                        removeSet(exIdx, setIdx);
                      }}
                      canRemove={exercise.sets.length > 1}
                    />
                    {typeMenuOpen ? (
                      <div className="absolute left-0 top-full z-10 mt-0.5 min-w-[9rem] rounded-[10px] border border-border bg-surface-raised py-1 shadow-[var(--shadow-raised)]">
                        <button
                          type="button"
                          className="block w-full px-3 py-2.5 text-left text-[13px] hover:bg-surface-hover"
                          onClick={() => {
                            patchSet(exIdx, setIdx, { isWarmup: false });
                            setSetTypeMenu(null);
                          }}
                        >
                          Robocza
                        </button>
                        <button
                          type="button"
                          className="block w-full px-3 py-2.5 text-left text-[13px] hover:bg-surface-hover"
                          onClick={() => {
                            patchSet(exIdx, setIdx, { isWarmup: true });
                            setSetTypeMenu(null);
                          }}
                        >
                          Rozgrzewkowa
                        </button>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              className="flex min-h-11 w-full items-center justify-center rounded-[10px] text-[15px] font-semibold text-muted hover:bg-surface-hover hover:text-foreground-secondary focus-visible:outline-none focus-visible:shadow-[var(--glow-accent)]"
              onClick={() => addSet(exIdx)}
            >
              + Dodaj serię
            </button>

            {noteOpen ? (
              <input
                className={`${inputClass} bg-surface-raised px-2 py-1.5`}
                placeholder="Notatka do ćwiczenia…"
                value={exercise.note ?? ""}
                onChange={(e) => patchNote(exIdx, e.target.value)}
              />
            ) : (
              <button
                type="button"
                className="text-[13px] font-medium text-muted hover:text-foreground-secondary"
                onClick={() => setNoteOpenEx((prev) => new Set(prev).add(exIdx))}
              >
                + Notatka
              </button>
            )}
          </section>
        );
      })}

      <p className="px-1 pb-3 text-center text-[13px] text-muted-faint">
        Wpisz faktyczny ciężar i powtórzenia — nawet jeśli inne niż plan. Trener widzi różnicę.
      </p>

      {rest?.expanded ? (
        <RestTimer
          rest={rest}
          nextLabel={nextRestLabel}
          onAdjust={adjustRest}
          onDismiss={dismissRest}
          onExpand={setExpanded}
        />
      ) : null}

      <SessionDock
        activeField={activeCell?.field ?? null}
        isTime={activeIsTime}
        onStepWeight={(d) => stepActive("weight", d)}
        onStepReps={(d) => stepActive("reps", d)}
        onPlates={() => setPlatesOpen(true)}
        onPrev={() => navigateCell(-1)}
        onNext={() => navigateCell(1)}
        onDone={() => {
          setActiveCell(null);
          (document.activeElement as HTMLElement | null)?.blur?.();
        }}
        rest={rest}
        nextLabel={nextRestLabel}
        onAdjustRest={adjustRest}
        onDismissRest={dismissRest}
        onExpandRest={() => setExpanded(true)}
      />

      {platesOpen && activeCell && activeCell.field === "weight" ? (
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
          className="pr-celebrate-in fixed bottom-28 left-1/2 z-[55] w-[min(100%-2rem,24rem)] -translate-x-1/2 rounded-[10px] border border-pr-border bg-pr-dim px-4 py-3 text-center"
          role="status"
        >
          <div className="font-mono text-xs font-medium uppercase tracking-caps text-pr">
            ★ Personal best
          </div>
          <div className="mt-1 font-display text-sm font-bold text-foreground">{prCelebrate}</div>
        </div>
      ) : null}
      {toastNode}
    </div>
  );
}

const SetRow = memo(function SetRow({
  set,
  prev,
  isTime,
  isNext,
  canRemove,
  onWeight,
  onReps,
  onFocusWeight,
  onFocusReps,
  onToggle,
  onCopyPrev,
  onSetType,
  onRowMenu,
}: {
  set: LocalSet;
  prev: PrevLoggedSet | undefined;
  isTime: boolean;
  isNext: boolean;
  canRemove: boolean;
  onWeight: (v: number | null) => void;
  onReps: (v: number | null) => void;
  onFocusWeight: () => void;
  onFocusReps: () => void;
  onToggle: () => void;
  onCopyPrev: () => void;
  onSetType: () => void;
  onRowMenu: () => void;
}) {
  const completed = set.completed;
  const below = isBelowTarget(set, isTime);
  const targetLabel = formatTargetLabel(set, isTime);
  const valColor = completed ? "text-foreground" : "text-foreground-secondary";
  const rowBg = completed
    ? "bg-surface-active"
    : isNext
      ? "rounded-[var(--radius-well)] border border-dashed border-border-strong bg-surface-sunken"
      : "bg-transparent";
  const checkBg = completed ? "bg-accent border-accent" : "bg-transparent";
  const checkBorder = "border-border-strong";
  const checkColor = completed
    ? "text-accent-foreground"
    : isNext
      ? "text-foreground"
      : "text-muted-faint";
  const prevLabel = formatPrev(prev);

  return (
    <div className={`${SET_GRID} h-12 rounded-[var(--radius-well)] px-0.5 ${rowBg}`}>
      <button
        type="button"
        className={`flex h-11 w-full items-center justify-center font-mono text-[13px] tabular-nums focus-visible:outline-none ${
          completed ? "text-foreground" : "text-muted"
        }`}
        onClick={onSetType}
        title="Typ serii"
        aria-label={`Seria ${set.setNumber}, typ: ${set.isWarmup ? "rozgrzewkowa" : "robocza"}`}
      >
        {String(set.setNumber).padStart(2, "0")}
        {set.isWarmup ? <span className="ml-0.5 text-[10px]">W</span> : null}
      </button>

      <div className="flex min-w-0 items-center gap-1">
        {prev ? (
          <button
            type="button"
            className="min-w-0 truncate font-mono text-[13px] italic tabular-nums text-muted-faint hover:text-foreground-secondary focus-visible:outline-none focus-visible:shadow-[var(--glow-accent)]"
            onClick={onCopyPrev}
            aria-label={`Wpisz ${prevLabel} z poprzedniego treningu`}
            title={`Wpisz ${prevLabel}`}
          >
            {prevLabel}
          </button>
        ) : (
          <span className="font-mono text-[13px] tabular-nums text-muted-faint">—</span>
        )}
        {completed && set.isPr ? <Badge tone="pr">PR</Badge> : null}
        {below && targetLabel ? (
          <span
            className="shrink-0 whitespace-nowrap text-xs font-semibold text-danger-hover"
            title="Poniżej celu — trener to zobaczy"
          >
            ▾
          </span>
        ) : null}
      </div>

      {isTime ? (
        <div className="flex h-11 items-center justify-center rounded-[10px] border border-border bg-surface-raised font-mono text-[13px] text-muted">
          —
        </div>
      ) : (
        <SetValueInput
          kind="weight"
          value={set.weightKg}
          placeholder="kg"
          ariaLabel="kg"
          className={`h-11 ${valColor}`}
          onCommit={onWeight}
          onFocusField={onFocusWeight}
        />
      )}

      <SetValueInput
        kind="reps"
        value={isTime ? (set.durationSeconds ?? set.reps) : set.reps}
        placeholder={isTime ? "sek" : "powt"}
        ariaLabel={isTime ? "sekundy" : "powtórzenia"}
        className={`h-11 ${valColor}`}
        onCommit={onReps}
        onFocusField={onFocusReps}
      />

      <button
        type="button"
        onClick={onToggle}
        className={`mx-auto flex h-11 w-11 items-center justify-center rounded-[10px] border transition-colors duration-[var(--dur-fast)] focus-visible:outline-none focus-visible:shadow-[var(--glow-accent)] active:scale-[0.94] ${checkBg} ${checkBorder} ${checkColor}`}
        aria-label={completed ? "Cofnij ukończenie" : "Zalicz serię"}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M20 6L9 17l-5-5" />
        </svg>
      </button>

      <button
        type="button"
        onClick={onRowMenu}
        disabled={!canRemove}
        className="flex h-11 w-9 items-center justify-center rounded-[10px] text-muted-faint hover:bg-surface-hover hover:text-danger disabled:opacity-30 focus-visible:outline-none focus-visible:shadow-[var(--glow-accent)]"
        aria-label="Usuń serię"
        title="Usuń serię"
      >
        <MoreIcon />
      </button>
    </div>
  );
});

function StatCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border bg-surface px-4 py-4 shadow-card ${
        highlight ? "border-pr" : "border-border"
      }`}
    >
      <p
        className={`font-mono text-3xl font-semibold tabular-nums ${
          highlight ? "text-pr" : "text-foreground"
        }`}
      >
        {value}
      </p>
      <p className="mt-1.5 text-xs font-semibold uppercase tracking-caps text-muted">{label}</p>
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
