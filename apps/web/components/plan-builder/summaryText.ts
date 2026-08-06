import { Exercise, PlanSetInput } from "@/lib/api";
import { formatMeasureCore } from "@/lib/measure";
import { formatRest } from "@/components/ui";
import { polishExerciseCount, polishSetCount } from "@/lib/plural";
import { BuilderDay, BuilderItem } from "./types";

export type SchemeParts = {
  primary: string;
  meta: string | null;
};

function setMeasure(s: PlanSetInput): string | null {
  if (s.durationSeconds != null) return `${s.durationSeconds}s`;
  if (s.reps != null && s.repsMax != null) return `${s.reps}–${s.repsMax}`;
  if (s.reps != null) return `${s.reps}`;
  if (s.distanceMeters != null) return `${s.distanceMeters} m`;
  return null;
}

function setLoadShort(s: PlanSetInput): string | null {
  if (s.loadKg != null) return `${s.loadKg} kg`;
  if (s.loadPercent != null) return `${s.loadPercent}%`;
  return null;
}

/**
 * Hierarchia jak w plan-view: cel ćwiczenia mocno, meta wyciszona.
 * Nazwa schematu (`setScheme`) nie trafia na kartę.
 */
export function schemeParts(item: BuilderItem, exercise?: Exercise): SchemeParts {
  const rest =
    item.restBetweenSetsSeconds ?? exercise?.defaultRestBetweenSetsSeconds ?? null;

  if (item.prescribedSets.length > 0) {
    const sets = item.prescribedSets;
    const anchor =
      sets.find((s) => (s.role ?? "").toLowerCase() === "top") ??
      sets.find((s) => {
        const r = (s.role ?? "").toLowerCase();
        return r === "ramp" || r === "working";
      }) ??
      sets[0];
    const role = (anchor.role ?? "").toLowerCase();
    const measure = setMeasure(anchor);
    const load = setLoadShort(anchor);
    const target = [measure, load].filter(Boolean).join(" @ ");
    const primary =
      role === "ramp"
        ? target
          ? `rampa do ${target}`
          : "rampa"
        : target
          ? `top ${target}`
          : polishSetCount(sets.length);

    const metaParts = [polishSetCount(sets.length)];
    if (rest != null) metaParts.push(formatRest(rest));
    return { primary, meta: metaParts.join(" · ") };
  }

  const sets = item.sets ?? exercise?.defaultSets ?? null;
  const core = formatMeasureCore(item, exercise);
  const load = item.loadKg;
  const loadText =
    load != null ? ` @ ${load} kg` : item.loadPercent != null ? ` @ ${item.loadPercent}%` : "";
  const primary = sets != null ? `${sets} × ${core}${loadText}` : `${core}${loadText}`;

  const metaParts: string[] = [];
  if (item.targetRir != null) metaParts.push(`RIR ${item.targetRir}`);
  else if (item.targetRpe != null) metaParts.push(`RPE ${item.targetRpe}`);
  if (rest != null) metaParts.push(formatRest(rest));
  if (item.tempo) metaParts.push(`tempo ${item.tempo}`);
  return { primary, meta: metaParts.length ? metaParts.join(" · ") : null };
}

/** Jedna linia mono (listy, starsze miejsca). */
export function summaryText(item: BuilderItem, exercise?: Exercise): string {
  const { primary, meta } = schemeParts(item, exercise);
  return meta ? `${primary} · ${meta}` : primary;
}

export function dayStatsLine(day: BuilderDay, exercises: Exercise[]): string {
  const exerciseCount = day.items.length;
  const setCount = day.items.reduce((sum, item) => {
    if (item.prescribedSets.length > 0) return sum + item.prescribedSets.length;
    const ex = exercises.find((e) => e.id === item.exerciseId);
    return sum + (item.sets ?? ex?.defaultSets ?? 0);
  }, 0);
  const minutes = estimateWeekMinutes(day.items, exercises);
  return [
    polishExerciseCount(exerciseCount),
    polishSetCount(setCount),
    formatDurationApprox(minutes),
  ].join(" · ");
}

/** Heurystyka czasu: serie × (40s + przerwa). */
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
