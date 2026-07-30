import { PlanItem } from "@/lib/api";

/** Heurystyka czasu dnia: serie × (praca + przerwa). Praca = duration serii lub 40s. */
export function estimateDayMinutes(items: PlanItem[]): number {
  let seconds = 0;
  for (const item of items) {
    const rest = item.restBetweenSetsSeconds ?? 60;
    if (item.prescribedSets.length > 0) {
      for (const s of item.prescribedSets) {
        const work =
          s.durationSeconds ??
          item.repDurationSeconds ??
          40;
        seconds += work + rest;
      }
    } else {
      const sets = item.sets || 3;
      const work = item.repDurationSeconds ?? 40;
      seconds += sets * (work + rest);
    }
    seconds += item.restAfterExerciseSeconds ?? 0;
  }
  const minutes = Math.round(seconds / 60);
  if (minutes <= 0) return 5;
  return Math.max(5, Math.round(minutes / 5) * 5);
}

export function formatDurationApprox(minutes: number): string {
  if (minutes < 60) return `~${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `~${h} h` : `~${h} h ${m} min`;
}

/** Realny czas sesji → „42 min" / „1 h 5 min". */
export function formatDurationMinutes(seconds: number | null | undefined): string | null {
  if (seconds == null || seconds <= 0) return null;
  const minutes = Math.max(1, Math.round(seconds / 60));
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}
