import type { PlanDay, PortalHome, SessionDetail } from "@/lib/api";
import { todayIsoLocal } from "@/lib/dates";
import { saveLocalDraft } from "@/lib/sessionDraft";
import { enqueueSessionWrite } from "@/lib/sessionQueue";

export const LOCAL_SESSION_ID = -1;

export function cachePortalHome(token: string, home: PortalHome) {
  try {
    localStorage.setItem(`wa-portal-home:${token}`, JSON.stringify(home));
  } catch {
    /* quota */
  }
}

export function readCachedPortalHome(token: string): PortalHome | null {
  try {
    const raw = localStorage.getItem(`wa-portal-home:${token}`);
    return raw ? (JSON.parse(raw) as PortalHome) : null;
  } catch {
    return null;
  }
}

export function buildLocalSessionFromDay(
  clientId: number,
  today: NonNullable<PortalHome["today"]>,
  day: PlanDay,
  performedOn: string,
): SessionDetail {
  return {
    id: LOCAL_SESSION_ID,
    clientId,
    assignmentId: today.assignmentId,
    planDayId: day.id,
    planId: today.planId,
    planName: today.planName,
    dayLabel: day.label,
    performedOn,
    durationSeconds: null,
    note: null,
    feelingScore: null,
    sleepScore: null,
    energyScore: null,
    status: "in_progress",
    createdAt: new Date().toISOString(),
    totalSets: day.items.reduce(
      (n, item) => n + (item.prescribedSets.length > 0 ? item.prescribedSets.length : item.sets),
      0,
    ),
    totalVolumeKg: 0,
    exerciseCount: day.items.length,
    prs: [],
    exercises: day.items.map((item, idx) => {
      const prescribed = item.prescribedSets;
      const count = prescribed.length > 0 ? prescribed.length : item.sets;
      return {
        id: -(idx + 1),
        exerciseId: item.exerciseId,
        exerciseName: item.exerciseName,
        exerciseType: item.exerciseType,
        category: item.category ?? null,
        equipment: [],
        isUnilateral: false,
        media: [],
        substitutedFromExerciseId: null,
        substitutedFromName: null,
        order: item.order,
        supersetGroup: item.supersetGroup,
        supersetLabel: null,
        note: null,
        targetRir: item.targetRir,
        tempo: item.tempo,
        planNote: item.notes,
        restSeconds: item.restAfterExerciseSeconds,
        prevSets: [],
        sets: Array.from({ length: Math.max(1, count) }, (_, i) => {
          const p = prescribed[i];
          return {
            id: -(idx * 100 + i + 1),
            setNumber: p?.order ?? i + 1,
            weightKg: p?.computedLoadKg ?? p?.loadKg ?? item.computedLoadKg ?? item.loadKg,
            reps: p?.reps ?? item.reps,
            durationSeconds: p?.durationSeconds ?? item.repDurationSeconds,
            distanceMeters: p?.distanceMeters ?? item.distanceMeters,
            rir: p?.targetRir ?? item.targetRir,
            rpe: p?.targetRpe ?? item.targetRpe,
            isWarmup: p?.role === "warmup" || item.isWarmup,
            completed: false,
            note: null,
            side: null,
            estimated1Rm: null,
            isPr: false,
            targetWeightKg: p?.computedLoadKg ?? p?.loadKg ?? item.computedLoadKg,
            targetReps: p?.reps ?? item.reps,
            targetDurationSeconds: p?.durationSeconds ?? item.repDurationSeconds,
          };
        }),
      };
    }),
  };
}

export function beginOfflineSession(
  token: string,
  home: PortalHome,
  planDayId: number,
): SessionDetail | null {
  const today = home.today;
  if (!today) return null;
  const day = today.day.id === planDayId ? today.day : today.day;
  const session = buildLocalSessionFromDay(home.client.id, today, day, todayIsoLocal());
  saveLocalDraft(token, LOCAL_SESSION_ID, session);
  enqueueSessionWrite({
    scope: token,
    sessionId: LOCAL_SESSION_ID,
    body: {
      clientId: home.client.id,
      assignmentId: today.assignmentId,
      planId: today.planId,
      planDayId,
      performedOn: session.performedOn,
      pendingStart: true,
    },
  });
  return session;
}
