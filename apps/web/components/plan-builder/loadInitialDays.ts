import { Plan } from "@/lib/api";
import { deriveLinkedToNext } from "@/lib/supersets";
import { BuilderDay, newKey } from "./types";

export function loadInitialDays(plan?: Plan, initialDayCount = 1, initialWeekCount = 1): BuilderDay[] {
  if (!plan || plan.days.length === 0) {
    const weekCount = Math.max(initialWeekCount, 1);
    const dayCount = Math.max(initialDayCount, 1);
    return Array.from({ length: weekCount }, (_, w) =>
      Array.from({ length: dayCount }, (_, idx) => ({
        key: newKey(),
        weekNumber: w + 1,
        order: idx + 1,
        label: `Dzień ${idx + 1}`,
        notes: null,
        items: [],
      }))
    ).flat();
  }
  return plan.days.map((d) => {
    const linked = deriveLinkedToNext(d.items.map((i) => i.supersetGroup));
    return {
      key: newKey(),
      weekNumber: d.weekNumber,
      order: d.order,
      label: d.label,
      notes: d.notes,
      items: d.items.map((i, idx) => ({
        key: newKey(),
        exerciseId: i.exerciseId,
        exerciseName: i.exerciseName,
        exerciseType: i.exerciseType,
        measureType: i.measureType,
        order: i.order,
        linkedToNext: linked[idx],
        isWarmup: i.isWarmup,
        sets: i.overrides.sets,
        reps: i.overrides.reps,
        repsMax: i.overrides.repsMax,
        repDurationSeconds: i.overrides.repDurationSeconds,
        repDurationSecondsMax: i.overrides.repDurationSecondsMax,
        distanceMeters: i.overrides.distanceMeters,
        tempo: i.tempo,
        targetRpe: i.targetRpe,
        targetRir: i.targetRir,
        setScheme: i.setScheme,
        restBetweenSetsSeconds: i.overrides.restBetweenSetsSeconds,
        restAfterExerciseSeconds: i.restAfterExerciseSeconds,
        loadKg: i.overrides.loadKg,
        loadPercent: i.overrides.loadPercent ?? i.loadPercent ?? null,
        notes: i.notes,
        prescribedSets: i.prescribedSets.map((s) => ({
          key: newKey(),
          order: s.order,
          reps: s.reps,
          repsMax: s.repsMax,
          durationSeconds: s.durationSeconds,
          distanceMeters: s.distanceMeters,
          loadKg: s.loadKg,
          loadPercent: s.loadPercent,
          percentOf: s.percentOf,
          targetRpe: s.targetRpe,
          targetRir: s.targetRir,
          tempo: s.tempo,
          role: s.role,
          note: s.note,
        })),
      })),
    };
  });
}
