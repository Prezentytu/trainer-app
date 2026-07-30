import { Exercise } from "@/lib/api";
import { formatMeasureCore } from "@/lib/measure";
import { formatRest } from "@/components/ui";
import { BuilderItem } from "./types";

/** Jedna linia mono: `3 × 8–12 · 45s` (przerwa na końcu). */
export function summaryText(item: BuilderItem, exercise?: Exercise): string {
  const sets = item.sets ?? exercise?.defaultSets ?? null;
  const core = formatMeasureCore(item, exercise);
  const rest = item.restBetweenSetsSeconds ?? exercise?.defaultRestBetweenSetsSeconds ?? null;
  const parts: string[] = [];
  if (item.setScheme) {
    parts.push(sets ? `${sets} serii` : "serie");
    parts.push(item.setScheme);
  } else {
    parts.push(sets ? `${sets} × ${core}` : core);
  }
  if (item.loadKg != null) parts.push(`@ ${item.loadKg} kg`);
  if (rest != null) parts.push(formatRest(rest));
  if (item.tempo) parts.push(`tempo ${item.tempo}`);
  return parts.join(" · ");
}

/** Heurystyka czasu tygodnia: serie × (40s + przerwa). */
export function estimateWeekMinutes(items: BuilderItem[], exercises: Exercise[]): number {
  let seconds = 0;
  for (const item of items) {
    const exercise = exercises.find((e) => e.id === item.exerciseId);
    const sets = item.prescribedSets.length || item.sets || exercise?.defaultSets || 3;
    const rest = item.restBetweenSetsSeconds ?? exercise?.defaultRestBetweenSetsSeconds ?? 60;
    seconds += sets * (40 + rest);
  }
  return Math.round(seconds / 60);
}

export function formatDurationApprox(minutes: number): string {
  if (minutes < 60) return `~${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `~${h} h` : `~${h} h ${m} min`;
}
