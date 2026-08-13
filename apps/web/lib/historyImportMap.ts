import {
  HistoryImportExercise,
  HistoryImportSession,
  WorkoutSessionInput,
} from "@/lib/api";

export function sessionExKey(sessionIdx: number, exerciseIdx: number): string {
  return `${sessionIdx}:${exerciseIdx}`;
}

export function resolvedExerciseId(
  session: HistoryImportSession,
  sessionIdx: number,
  exerciseIdx: number,
  idMap: Record<string, number>,
): number | null {
  const ex = session.exercises[exerciseIdx];
  return idMap[sessionExKey(sessionIdx, exerciseIdx)] ?? ex?.matchedExerciseId ?? null;
}

export function countUnmappedSessions(
  sessions: HistoryImportSession[],
  idMap: Record<string, number>,
): number {
  let n = 0;
  sessions.forEach((s, si) => {
    s.exercises.forEach((_, ei) => {
      if (resolvedExerciseId(s, si, ei, idMap) == null) n += 1;
    });
  });
  return n;
}

export function toWorkoutSessions(
  clientId: number,
  sessions: HistoryImportSession[],
  idMap: Record<string, number>,
): WorkoutSessionInput[] {
  return sessions
    .filter((s) => Boolean(s.performedOn))
    .map((s, si) => ({
      clientId,
      performedOn: s.performedOn as string,
      durationSeconds: s.durationSeconds ?? null,
      note: s.label,
      status: "completed",
      exercises: s.exercises.map((e, ei) => ({
        exerciseId: resolvedExerciseId(s, si, ei, idMap) ?? 0,
        order: e.order || ei + 1,
        note: null,
        sets: e.sets.map((set, n) => ({
          setNumber: n + 1,
          weightKg: set.isBodyweight ? 0 : set.weightKg,
          reps: set.reps,
          durationSeconds: null,
          distanceMeters: null,
          rir: null,
          rpe: null,
          isWarmup: false,
          completed: true,
          note: set.isBodyweight ? "BW" : null,
        })),
      })),
    }));
}

export function formatSetLine(ex: HistoryImportExercise): string {
  return ex.sets
    .map((s) => {
      if (s.isBodyweight || s.weightKg === 0) return `${s.reps} × masa ciała`;
      const kg = s.weightKg != null ? String(s.weightKg).replace(".", ",") : "—";
      return `${s.reps} × ${kg} kg`;
    })
    .join(" · ");
}
