"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  api,
  CATEGORY_LABELS,
  Exercise,
  ExerciseCategory,
  LoggedExerciseInput,
  LoggedSet,
  PrevLoggedSet,
  ProgressReport,
  SessionCheckinInput,
  SessionDetail,
  WorkoutSessionInput,
} from "@/lib/api";
import { YoutubeLite } from "@/components/YoutubeLite";
import {
  Badge,
  Button,
  Card,
  Dialog,
  EmptyState,
  ErrorBanner,
  formatRest,
  IconButton,
  inputClass,
  useUndoToast,
} from "@/components/ui";
import { demoMedia } from "@/lib/youtube";
import { lightHaptic, unlockAudio } from "@/lib/restAlarm";
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
import { Icon } from "@/components/Icon";

/** SERIA | POPRZ | KG | POWT | ✓ | ⋯ — czytelna siatka (Styrka+, zachowana kolumna prev). */
const SET_GRID =
  "grid grid-cols-[2rem_minmax(3.25rem,0.85fr)_minmax(4.5rem,1fr)_minmax(3.75rem,0.85fr)_2.75rem_2rem] gap-x-2 items-center";

const REST_OPTIONS_SEC = [60, 90, 120, 180] as const;

const iconBtn =
  "inline-flex min-h-11 items-center gap-1.5 text-[15px] font-medium text-muted hover:text-foreground focus-visible:outline-none focus-visible:shadow-[var(--focus-ring)]";

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

function formatPrevDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return "";
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

function formatPrev(p: PrevLoggedSet | undefined, category?: string | null): string {
  if (!p) return "—";
  const isBw = category === "bodyweight";
  if (p.weightKg != null && p.reps != null) {
    if (isBw && p.weightKg === 0) return `BW×${p.reps}`;
    return `${formatKg(p.weightKg)}×${p.reps}`;
  }
  if (p.durationSeconds != null) return `${p.durationSeconds} s`;
  if (p.reps != null) return isBw ? `BW×${p.reps}` : `${p.reps}`;
  return "—";
}

/** Literówka na siłowni: wartość >2× referencji (prev lub cel) albo absurdy absolutne. */
function isUnusualSetValue(
  set: LocalSet,
  prev: PrevLoggedSet | undefined,
  isTime: boolean,
): boolean {
  if (isTime) {
    const ref = prev?.durationSeconds ?? set.targetDurationSeconds;
    if (ref != null && ref > 0 && set.durationSeconds != null && set.durationSeconds > ref * 2) {
      return true;
    }
    return set.durationSeconds != null && set.durationSeconds > 3600;
  }
  const refW = prev?.weightKg ?? set.targetWeightKg;
  const refR = prev?.reps ?? set.targetReps;
  if (refW != null && refW > 0 && set.weightKg != null && set.weightKg > refW * 2) return true;
  if (refR != null && refR > 0 && set.reps != null && set.reps > Math.max(refR * 2, refR + 15)) {
    return true;
  }
  if (set.reps != null && set.reps > 100) return true;
  if (set.weightKg != null && set.weightKg > 500) return true;
  return false;
}

function hasEmptyCompletedSets(exercises: LocalExercise[]): boolean {
  return exercises.some((ex) => {
    const isTime = ex.exerciseType === "time";
    return ex.sets.some((s) => {
      if (!s.completed) return false;
      if (isTime) return s.durationSeconds == null;
      if (ex.exerciseType === "distance") return s.distanceMeters == null;
      // reps: brak powtórzeń = puste; 0 kg przy bodyweight OK
      return s.reps == null;
    });
  });
}

/** Auto-nazwa sesji po kategoriach mięśniowych (gdy brak dayLabel). */
function sessionTitleFromMuscles(exercises: LocalExercise[]): string | null {
  const counts = new Map<string, number>();
  for (const ex of exercises) {
    const cat = ex.category;
    if (!cat || cat === "fullbody") continue;
    const label =
      cat in CATEGORY_LABELS ? CATEGORY_LABELS[cat as ExerciseCategory] : cat;
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  if (counts.size === 0) {
    if (exercises.some((ex) => ex.category === "fullbody")) return "Całe ciało";
    return null;
  }
  const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  const top = ranked.slice(0, 2).map(([label]) => label);
  return top.join(" · ");
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
  const [setRowMenu, setSetRowMenu] = useState<{ exIdx: number; setIdx: number } | null>(null);
  const [restPickerEx, setRestPickerEx] = useState<number | null>(null);
  const [finishConfirmOpen, setFinishConfirmOpen] = useState(false);
  const [finishConfirmReason, setFinishConfirmReason] = useState<"incomplete" | "empty">("incomplete");
  const [typoConfirm, setTypoConfirm] = useState<{
    exIdx: number;
    setIdx: number;
    message: string;
  } | null>(null);
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
  /** Timestamp ostatniej zaliczonej serii — dock pokazuje count-up. */
  const [lastSetAt, setLastSetAt] = useState<number | null>(() => {
    if (resolvedMode !== "client") return null;
    const hasDone = initial.draft.exercises.some((ex) =>
      ex.sets.some((s) => s.completed),
    );
    if (!hasDone) return null;
     
    return Date.now();
  });
  const { showUndoToast, toastNode } = useUndoToast();
  const menusOpen = menuExIdx != null || setRowMenu != null || restPickerEx != null;

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
    if (!menusOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest("[data-session-menu]")) return;
      setMenuExIdx(null);
      setSetRowMenu(null);
      setRestPickerEx(null);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [menusOpen]);

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

  const toggleComplete = (exIdx: number, setIdx: number, opts?: { skipTypoGuard?: boolean }) => {
    const exercise = draft.exercises[exIdx];
    const set = exercise?.sets[setIdx];
    if (!set) return;
    const nextCompleted = !set.completed;

    if (nextCompleted && !opts?.skipTypoGuard) {
      const isTime = exercise.exerciseType === "time";
      const prev = exercise.prevSets[setIdx] ?? exercise.prevSets[exercise.prevSets.length - 1];
      if (isUnusualSetValue(set, prev, isTime)) {
        const label = isTime
          ? `${set.durationSeconds ?? "—"} s`
          : set.weightKg != null && set.reps != null
            ? `${formatKg(set.weightKg)}×${set.reps}`
            : set.reps != null
              ? `${set.reps} powt.`
              : "puste wartości";
        setTypoConfirm({
          exIdx,
          setIdx,
          message: `Wartość wygląda nietypowo (${label}). Zaliczyć mimo to?`,
        });
        return;
      }
    }

    unlockAudio();
    if (nextCompleted) lightHaptic();
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

    if (nextCompleted) {
      if (liveClock) {
        // Event handler — znacznik czasu startu count-upu „od serii”.
         
        setLastSetAt(Date.now());
      }
      if (liveClock && readAutoRest()) {
        const seconds = restOverrideByEx[exIdx] ?? exercise.restSeconds ?? 90;
        setActiveCell(null);
        (document.activeElement as HTMLElement | null)?.blur?.();
        startRest(seconds);
      }
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
    } else {
      // Przypadkowe zaliczenie — wyłącz przerwę; zegar znika tylko gdy nie ma już zaliczonych.
      dismissRest();
      const stillDone = draftRef.current.exercises.some((ex) =>
        ex.sets.some((s) => s.completed),
      );
      if (!stillDone) setLastSetAt(null);
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
    setFinishConfirmOpen(false);
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

  const requestFinish = () => {
    const done = draft.exercises.flatMap((ex) => ex.sets).filter((s) => s.completed).length;
    const total = draft.exercises.flatMap((ex) => ex.sets).length;
    if (!isBehalf && !isCompletedEdit) {
      if (hasEmptyCompletedSets(draft.exercises)) {
        setFinishConfirmReason("empty");
        setFinishConfirmOpen(true);
        return;
      }
      if (done < total) {
        setFinishConfirmReason("incomplete");
        setFinishConfirmOpen(true);
        return;
      }
    }
    void finish();
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
    return nextSet ? `${ex.exerciseName} · ${nextSet.setNumber}` : ex.exerciseName;
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
    const hasPrs = summary.prs.length > 0;

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

        <div className={`grid gap-3 ${hasPrs ? "grid-cols-2" : "grid-cols-3"}`}>
          <StatCard label="Czas" value={durationFmt} />
          <StatCard
            label="Objętość"
            value={`${Math.round(summary.totalVolumeKg).toLocaleString("pl-PL")} kg`}
          />
          <StatCard label="Serie" value={`${doneTotal.done}/${doneTotal.total}`} />
          {hasPrs ? (
            <StatCard label="Rekordy" value={String(summary.prs.length)} highlight />
          ) : null}
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

        <div className="space-y-3">
          <ScorePicker label="Samopoczucie" value={feelingScore} onChange={setFeelingScore} />
          <ScorePicker label="Sen (ostatnia noc)" value={sleepScore} onChange={setSleepScore} />
          <ScorePicker label="Energia" value={energyScore} onChange={setEnergyScore} />
        </div>

        <div className="rounded-2xl border border-border bg-surface px-4 py-1">
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
                    done < ex.sets.length || below ? "text-muted" : "text-gain"
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

        <div className="session-chrome fixed inset-x-0 bottom-0 z-30 border-t border-border px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-3">
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
    <div
      className={`space-y-4 ${
        activeCell || (rest && !rest.expanded) || (liveClock && lastSetAt != null)
          ? "pb-40"
          : "pb-24"
      }`}
    >
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
          className="rounded-md border border-border bg-surface-raised px-3 py-2 text-sm text-foreground-secondary"
        >
          Przywrócono niezapisane zmiany
        </div>
      ) : null}

      <div className="session-chrome session-chrome-edge relative sticky top-0 z-20 -mx-4 px-4 pb-3 pt-[max(0.5rem,env(safe-area-inset-top))]">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="break-words text-[17px] font-semibold leading-snug tracking-tight text-foreground">
              {draft.dayLabel ??
                sessionTitleFromMuscles(draft.exercises) ??
                draft.planName ??
                (isCompletedEdit || isBehalf ? "Poprawa" : "Trening")}
            </h1>
            <p className="mt-1 font-mono text-sm tabular-nums text-muted">
              {doneSetsCount}/{totalSetsCount}
              {" · "}
              {liveClock ? (
                <SessionClock startedAt={startedAt} className="font-mono text-sm tabular-nums text-muted" />
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
          <Button
            size="sm"
            variant={isBehalf || isCompletedEdit ? "secondary" : "primary"}
            onClick={requestFinish}
          >
            {isBehalf || isCompletedEdit ? "Zapisz" : "Zakończ"}
          </Button>
        </div>
        <div className="mt-3 h-1 overflow-hidden rounded-full bg-surface-active">
          <div
            className="h-full rounded-full bg-invert-bg transition-[width] duration-[var(--dur-med)] ease-[var(--ease-out)]"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      <Dialog
        open={finishConfirmOpen}
        title="Zakończyć trening?"
        description={
          finishConfirmReason === "empty"
            ? "Niektóre zaliczone serie nie mają wartości (kg/powtórzeń). Zakończyć mimo to?"
            : `${doneSetsCount} z ${totalSetsCount} serii ukończone — zakończyć?`
        }
        confirmLabel="Zakończ trening"
        cancelLabel="Wróć"
        onConfirm={() => void finish()}
        onCancel={() => setFinishConfirmOpen(false)}
        busy={saving}
      />

      <Dialog
        open={typoConfirm != null}
        title="Sprawdź wartość"
        description={typoConfirm?.message ?? ""}
        confirmLabel="Zaliczyć"
        cancelLabel="Popraw"
        onConfirm={() => {
          if (!typoConfirm) return;
          const { exIdx, setIdx } = typoConfirm;
          setTypoConfirm(null);
          toggleComplete(exIdx, setIdx, { skipTypoGuard: true });
        }}
        onCancel={() => setTypoConfirm(null)}
      />

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
              className="flex w-full items-center gap-3 border-t border-border py-4 text-left opacity-70 hover:opacity-100 first:border-t-0"
              onClick={() =>
                setCollapsedEx((prev) => {
                  const next = new Set(prev);
                  next.delete(exIdx);
                  return next;
                })
              }
            >
              <h2 className="min-w-0 flex-1 break-words text-[15px] font-semibold leading-snug text-foreground">
                {exercise.exerciseName}
              </h2>
              <span className="shrink-0 font-mono text-sm tabular-nums text-muted">
                {doneCount}/{exercise.sets.length}
              </span>
            </button>
          );
        }

        const hasVideo = Boolean(thumb.youtubeId);
        const restPickerOpen = restPickerEx === exIdx;
        const metaBits = [
          exercise.targetRir != null ? `RIR ${exercise.targetRir}` : null,
          `Przerwa ${restPillLabel(restSec)}`,
        ].filter(Boolean);

        return (
          <section
            key={exercise.id > 0 ? exercise.id : `ex-${exIdx}`}
            className={`relative space-y-4 border-t border-border pt-6 first:border-t-0 first:pt-2 ${
              allDone ? "opacity-70" : ""
            }`}
          >
            <div className="flex items-start gap-2">
              <div className="min-w-0 flex-1">
                <h2 className="break-words text-[15px] font-semibold leading-snug tracking-tight text-foreground">
                  {exercise.exerciseName}
                </h2>
                {exercise.substitutedFromName ? (
                  <p className="mt-0.5 text-[13px] text-muted">
                    zamieniono z {exercise.substitutedFromName}
                  </p>
                ) : null}
                {metaBits.length > 0 || trainerNote ? (
                  <p className="mt-1 text-[13px] leading-snug text-muted">
                    {metaBits.join(" · ")}
                    {trainerNote ? (
                      <>
                        {metaBits.length > 0 ? " · " : null}
                        {trainerNote}
                      </>
                    ) : null}
                  </p>
                ) : null}
              </div>
              <div className="relative shrink-0" data-session-menu>
                <IconButton
                  title="Więcej"
                  size="sm"
                  onClick={() => {
                    setSetRowMenu(null);
                    setRestPickerEx(null);
                    setMenuExIdx(menuOpen ? null : exIdx);
                  }}
                >
                  <Icon name="more" size={20} decorative />
                </IconButton>
                {menuOpen ? (
                  <div className="absolute right-0 top-full z-10 mt-1 min-w-[11rem] origin-top-right rounded-[10px] border border-border bg-surface-raised py-1 shadow-[var(--shadow-raised)]">
                    {allDone ? (
                      <button
                        type="button"
                        className="block w-full px-3 py-2.5 text-left text-[15px] hover:bg-surface-hover"
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
                        className="block w-full px-3 py-2.5 text-left text-[15px] hover:bg-surface-hover"
                        onClick={() => {
                          copyPrevExercise(exIdx);
                          setMenuExIdx(null);
                        }}
                      >
                        Skopiuj poprzednie
                      </button>
                    ) : null}
                    <button
                      type="button"
                      className="block w-full px-3 py-2.5 text-left text-[15px] hover:bg-surface-hover"
                      onClick={() => {
                        setMenuExIdx(null);
                        setSetRowMenu(null);
                        setRestPickerEx(exIdx);
                      }}
                    >
                      Przerwa: {restPillLabel(restSec)}
                    </button>
                    {libraryExercises.length > 0 ? (
                      <button
                        type="button"
                        className="block w-full px-3 py-2.5 text-left text-[15px] hover:bg-surface-hover"
                        onClick={() => {
                          setSwapExIdx(exIdx);
                          setSwapSearch("");
                          setMenuExIdx(null);
                        }}
                      >
                        Podmień ćwiczenie
                      </button>
                    ) : null}
                    {hasVideo ? (
                      <button
                        type="button"
                        className="block w-full px-3 py-2.5 text-left text-[15px] hover:bg-surface-hover"
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
                {restPickerOpen ? (
                  <div className="absolute right-0 top-full z-10 mt-1 min-w-[8rem] origin-top-right rounded-[10px] border border-border bg-surface-raised py-1 shadow-[var(--shadow-raised)]">
                    {REST_OPTIONS_SEC.map((sec) => (
                      <button
                        key={sec}
                        type="button"
                        className={`block w-full px-3 py-2.5 text-left font-mono text-[15px] tabular-nums hover:bg-surface-hover ${
                          restSec === sec ? "text-foreground" : "text-foreground-secondary"
                        }`}
                        onClick={() => {
                          setRestOverrideByEx((prev) => ({ ...prev, [exIdx]: sec }));
                          setRestPickerEx(null);
                        }}
                      >
                        {restPillLabel(sec)}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>

            {swapExIdx === exIdx ? (
              <div>
                <input
                  className={`${inputClass} mb-2 w-full px-2 py-1.5`}
                  placeholder="Szukaj ćwiczenia…"
                  value={swapSearch}
                  onChange={(e) => setSwapSearch(e.target.value)}
                  autoFocus
                />
                <ul className="max-h-48 space-y-1 overflow-y-auto">
                  {filteredSwapExercises.length === 0 ? (
                    <li className="px-2 py-2 text-sm text-muted">Brak wyników.</li>
                  ) : (
                    filteredSwapExercises.slice(0, 20).map((ex) => (
                      <li key={ex.id}>
                        <button
                          type="button"
                          className="w-full rounded-[8px] px-2 py-2.5 text-left text-[15px] hover:bg-surface-hover"
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

            <div>
              <div
                className={`${SET_GRID} pb-2 text-[11px] font-medium uppercase tracking-caps text-muted`}
              >
                <div>Seria</div>
                <div className="truncate" title={prevHeader || "Poprzedni trening"}>
                  {prevHeader || "Poprz."}
                </div>
                <div className="text-center">{isTime ? "Sek" : "Kg"}</div>
                <div className="text-center">{isTime ? "" : "Powt"}</div>
                <div />
                <div />
              </div>

              <div className="space-y-1.5">
                {exercise.sets.map((s, setIdx) => {
                  const prev = exercise.prevSets[setIdx];
                  const isNext = exIdx === nextExIdx && setIdx === nextSetIdx;
                  const rowMenuOpen =
                    setRowMenu?.exIdx === exIdx && setRowMenu?.setIdx === setIdx;
                  const menuOpensUp = setIdx >= exercise.sets.length - 2;
                  return (
                    <div
                      key={s.uid}
                      ref={(el) => {
                        setRowRefs.current.set(s.uid, el);
                      }}
                      className="relative"
                      data-session-menu
                    >
                      <SetRow
                        set={s}
                        prev={prev}
                        category={exercise.category}
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
                        onRowMenu={() => {
                          setMenuExIdx(null);
                          setRestPickerEx(null);
                          setSetRowMenu(rowMenuOpen ? null : { exIdx, setIdx });
                        }}
                      />
                      {rowMenuOpen ? (
                        <div
                          className={`absolute right-0 z-30 min-w-[10.5rem] rounded-[10px] border border-border bg-surface-raised py-1 shadow-[var(--shadow-raised)] ${
                            menuOpensUp
                              ? "bottom-full mb-1 origin-bottom-right"
                              : "top-full mt-1 origin-top-right"
                          }`}
                        >
                          {s.completed ? (
                            <button
                              type="button"
                              className="block w-full px-3 py-2.5 text-left text-[15px] hover:bg-surface-hover"
                              onClick={() => {
                                toggleComplete(exIdx, setIdx);
                                setSetRowMenu(null);
                              }}
                            >
                              Cofnij zaliczenie
                            </button>
                          ) : null}
                          <button
                            type="button"
                            className="block w-full px-3 py-2.5 text-left text-[15px] hover:bg-surface-hover"
                            onClick={() => {
                              patchSet(exIdx, setIdx, { isWarmup: false });
                              setSetRowMenu(null);
                            }}
                          >
                            Robocza
                          </button>
                          <button
                            type="button"
                            className="block w-full px-3 py-2.5 text-left text-[15px] hover:bg-surface-hover"
                            onClick={() => {
                              patchSet(exIdx, setIdx, { isWarmup: true });
                              setSetRowMenu(null);
                            }}
                          >
                            Rozgrzewkowa
                          </button>
                          {exercise.sets.length > 1 ? (
                            <button
                              type="button"
                              className="block w-full px-3 py-2.5 text-left text-[15px] text-danger hover:bg-surface-hover"
                              onClick={() => {
                                removeSet(exIdx, setIdx);
                                setSetRowMenu(null);
                              }}
                            >
                              Usuń serię
                            </button>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-6">
              <button
                type="button"
                className={iconBtn}
                onClick={() => addSet(exIdx)}
                aria-label="Dodaj serię"
              >
                <Icon name="plus" size={16} decorative />
                Dodaj serię
              </button>
              {noteOpen ? null : (
                <button
                  type="button"
                  className={iconBtn}
                  onClick={() => setNoteOpenEx((prev) => new Set(prev).add(exIdx))}
                  aria-label="Dodaj notatkę"
                >
                  Notatka
                </button>
              )}
            </div>

            {noteOpen ? (
              <input
                className="w-full rounded-lg border border-border bg-surface-active px-3 py-3 text-[15px] text-foreground outline-none placeholder:text-muted-faint focus:border-border-strong"
                placeholder="Notatka…"
                value={exercise.note ?? ""}
                onChange={(e) => patchNote(exIdx, e.target.value)}
              />
            ) : null}
          </section>
        );
      })}

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
        sinceLastSetAt={liveClock ? lastSetAt : null}
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
  category,
  isTime,
  isNext,
  onWeight,
  onReps,
  onFocusWeight,
  onFocusReps,
  onToggle,
  onCopyPrev,
  onRowMenu,
}: {
  set: LocalSet;
  prev: PrevLoggedSet | undefined;
  category?: string | null;
  isTime: boolean;
  isNext: boolean;
  onWeight: (v: number | null) => void;
  onReps: (v: number | null) => void;
  onFocusWeight: () => void;
  onFocusReps: () => void;
  onToggle: () => void;
  onCopyPrev: () => void;
  onRowMenu: () => void;
}) {
  const completed = set.completed;
  const below = isBelowTarget(set, isTime);
  const targetLabel = formatTargetLabel(set, isTime);
  const valTone = completed
    ? "text-foreground"
    : isNext
      ? "text-foreground"
      : "text-foreground-secondary";
  const checkColor = completed
    ? "text-foreground"
    : isNext
      ? "text-accent-text"
      : "text-muted-faint";
  const prevLabel = formatPrev(prev, category);

  return (
    <div className={`relative ${SET_GRID}`}>
      <div
        className={`flex min-h-12 items-center font-mono text-sm tabular-nums ${
          completed || isNext ? "text-foreground-secondary" : "text-muted"
        }`}
        aria-label={`Seria ${set.setNumber}${set.isWarmup ? ", rozgrzewkowa" : ""}`}
      >
        {set.setNumber}
        {set.isWarmup ? <span className="ml-0.5 text-[11px] text-muted">W</span> : null}
      </div>

      <div className="flex min-w-0 items-center gap-1.5">
        {prev ? (
          <button
            type="button"
            className={`min-h-12 min-w-0 truncate text-left font-mono text-sm tabular-nums hover:text-foreground focus-visible:outline-none focus-visible:shadow-[var(--focus-ring)] ${
              completed ? "text-muted-faint" : "text-muted"
            }`}
            onClick={onCopyPrev}
            aria-label={`Wpisz ${prevLabel} z poprzedniego treningu`}
            title={`Wpisz ${prevLabel}`}
          >
            {prevLabel}
          </button>
        ) : (
          <span className="font-mono text-sm tabular-nums text-muted-faint">—</span>
        )}
        {completed && set.isPr ? <Badge tone="pr">PR</Badge> : null}
        {below && targetLabel ? (
          <span
            className="shrink-0 text-xs font-semibold text-danger-hover"
            title="Poniżej celu — trener to zobaczy"
          >
            ▾
          </span>
        ) : null}
      </div>

      {isTime ? (
        <div className="col-span-2">
          <SetValueInput
            kind="reps"
            value={set.durationSeconds ?? set.reps}
            placeholder="sek"
            ariaLabel="sekundy"
            className={valTone}
            emphasizeEmpty={isNext && !completed}
            onCommit={onReps}
            onFocusField={onFocusReps}
          />
        </div>
      ) : (
        <>
          <SetValueInput
            kind="weight"
            value={set.weightKg}
            placeholder="—"
            ariaLabel="kg"
            className={valTone}
            emphasizeEmpty={isNext && !completed}
            onCommit={onWeight}
            onFocusField={onFocusWeight}
          />
          <SetValueInput
            kind="reps"
            value={set.reps}
            placeholder="—"
            ariaLabel="powtórzenia"
            className={valTone}
            emphasizeEmpty={isNext && !completed}
            onCommit={onReps}
            onFocusField={onFocusReps}
          />
        </>
      )}

      <button
        type="button"
        onClick={onToggle}
        className={`flex min-h-12 min-w-11 items-center justify-center rounded-lg transition-colors duration-[var(--dur-fast)] focus-visible:outline-none focus-visible:shadow-[var(--focus-ring)] active:scale-[0.94] ${checkColor}`}
        aria-label={completed ? "Cofnij zaliczenie" : "Zalicz serię"}
      >
        <Icon name="check" size={24} decorative />
      </button>

      <button
        type="button"
        onClick={onRowMenu}
        className="flex min-h-12 min-w-8 items-center justify-center text-muted hover:text-foreground focus-visible:outline-none focus-visible:shadow-[var(--focus-ring)]"
        aria-label="Więcej opcji serii"
        title="Więcej"
      >
        <Icon name="more" size={16} decorative />
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
      className={`rounded-2xl border bg-surface px-4 py-4 ${
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
            className={`min-h-11 rounded-[8px] border py-2 font-mono text-sm font-semibold tabular-nums transition-colors ${
              value === n
                ? "border-accent-border bg-accent-dim text-foreground"
                : "border-border-strong text-muted hover:border-border-strong hover:bg-surface-hover"
            }`}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}
