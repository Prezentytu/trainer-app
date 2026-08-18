import { Exercise } from "@/lib/api";
import { formatRest } from "@/components/ui";
import { polishExerciseCount, polishSetCount } from "@/lib/plural";
import { compactSchemeLine } from "@/lib/schemeSummary";
import { estimateItemsMinutes, formatDurationApprox } from "@/lib/estimateDuration";
import { computeGroupsFromLinks } from "@/lib/supersets";
import { OPEN_RAMP_SET_FALLBACK, parseRampSchemeInfo } from "./listGroups";
import { BuilderDay, BuilderItem } from "./types";

export { formatDurationApprox };

export type SchemeParts = {
  primary: string;
  meta: string | null;
};

/**
 * Kompaktowa linia na kafelku boardu: prescribedSets jest źródłem prawdy.
 */
export function cardLine(item: BuilderItem, exercise?: Exercise): string {
  return compactSchemeLine(item, exercise);
}

/**
 * Hierarchia jak w plan-view: cel ćwiczenia mocno, meta wyciszona.
 * Nazwa schematu (`setScheme`) nie trafia na kartę.
 */
export function schemeParts(item: BuilderItem, exercise?: Exercise): SchemeParts {
  const rest =
    item.restBetweenSetsSeconds ?? exercise?.defaultRestBetweenSetsSeconds ?? null;
  const primary = compactSchemeLine(item, exercise);
  const metaParts: string[] = [];
  if (item.targetRir != null && item.targetRir > 0) metaParts.push(`RIR ${item.targetRir}`);
  else if (item.targetRpe != null && item.targetRpe > 0) metaParts.push(`RPE ${item.targetRpe}`);
  if (rest != null && rest > 0) metaParts.push(formatRest(rest));
  if (item.tempo) metaParts.push(`tempo ${item.tempo}`);
  return { primary, meta: metaParts.length ? metaParts.join(" · ") : null };
}

/** Jedna linia mono (listy, starsze miejsca). */
export function summaryText(item: BuilderItem, exercise?: Exercise): string {
  const { primary, meta } = schemeParts(item, exercise);
  return meta ? `${primary} · ${meta}` : primary;
}

function itemSetCount(item: BuilderItem, exercise?: Exercise): number {
  const ramp = parseRampSchemeInfo(item.setScheme);
  if (ramp != null) {
    const boCount = item.prescribedSets.filter((s) => (s.role ?? "").toLowerCase() === "backoff").length;
    return (item.sets ?? OPEN_RAMP_SET_FALLBACK) + boCount;
  }
  if (item.prescribedSets.length > 0) return item.prescribedSets.length;
  return item.sets ?? exercise?.defaultSets ?? 0;
}

export function dayStatsLine(day: BuilderDay, exercises: Exercise[]): string {
  const exerciseCount = day.items.length;
  const setCount = day.items.reduce((sum, item) => {
    const ex = exercises.find((e) => e.id === item.exerciseId);
    return sum + itemSetCount(item, ex);
  }, 0);
  const minutes = estimateWeekMinutes(day.items, exercises);
  return [
    polishExerciseCount(exerciseCount),
    polishSetCount(setCount),
    formatDurationApprox(minutes),
  ].join(" · ");
}

/** Czas dnia — te same rundy co portal (`estimateDayMinutes`). */
export function estimateWeekMinutes(items: BuilderItem[], exercises: Exercise[]): number {
  const groups = computeGroupsFromLinks(items.map((item) => item.linkedToNext));
  return estimateItemsMinutes(
    items.map((item) => {
      const exercise = exercises.find((e) => e.id === item.exerciseId);
      return {
        setScheme: item.setScheme,
        prescribedSets: item.prescribedSets,
        sets: item.sets ?? exercise?.defaultSets ?? 3,
        restBetweenSetsSeconds:
          item.restBetweenSetsSeconds ?? exercise?.defaultRestBetweenSetsSeconds ?? 60,
        restAfterExerciseSeconds: item.restAfterExerciseSeconds ?? 0,
        repDurationSeconds: item.repDurationSeconds,
      };
    }),
    (_item, index) => groups[index] ?? null,
  );
}

/** Suma dni — nie spłaszcza tygodnia (klamra nie przechodzi przez granicę dnia). */
export function estimateDaysMinutes(days: BuilderDay[], exercises: Exercise[]): number {
  return days.reduce((sum, day) => sum + estimateWeekMinutes(day.items, exercises), 0);
}
