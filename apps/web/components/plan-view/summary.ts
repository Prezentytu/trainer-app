import { PlanDay, PlanItem, PlanSet, SET_ROLE_LABELS, rirFromRpe } from "@/lib/api";
import { estimateDayMinutes, formatDurationApprox } from "@/lib/estimateDuration";
import { formatRest } from "@/components/ui";
import { polishExerciseCount, polishSetCount } from "@/lib/plural";
import { compactSchemeLine } from "@/lib/schemeSummary";

export type SchemeParts = {
  /** Kluczowe liczby — mocny ton: `4 × 8 @ 70 kg` / `5 × 2 @ 25–55 kg`. */
  primary: string;
  /** Kontekst — wyciszony: `RIR 2 · 2min`. */
  meta: string | null;
};

/**
 * Schemat na karcie: prescribedSets jest źródłem prawdy.
 */
export function schemeParts(item: PlanItem): SchemeParts {
  const primary = compactSchemeLine(item);
  const metaParts: string[] = [];
  if (item.targetRir != null && item.targetRir > 0) metaParts.push(`RIR ${item.targetRir}`);
  else if (item.targetRpe != null && item.targetRpe > 0) metaParts.push(`RPE ${item.targetRpe}`);
  if (item.restBetweenSetsSeconds > 0) metaParts.push(formatRest(item.restBetweenSetsSeconds));
  return { primary, meta: metaParts.filter(Boolean).join(" · ") || null };
}

/** Wersja jednolinijkowa (panel, nagłówki). */
export function schemeLine(item: PlanItem): string {
  const { primary, meta } = schemeParts(item);
  return meta ? `${primary} · ${meta}` : primary;
}

export type DayStats = {
  exerciseCount: number;
  setCount: number;
  minutes: number;
  /** np. `1 ćwiczenie · 3 serie · ~55 min` */
  line: string;
};

export function dayStats(day: PlanDay): DayStats {
  const exerciseCount = day.items.length;
  const setCount = day.items.reduce((sum, item) => {
    if (item.prescribedSets.length > 0) return sum + item.prescribedSets.length;
    return sum + (item.sets || 0);
  }, 0);
  const minutes = estimateDayMinutes(day.items);
  return {
    exerciseCount,
    setCount,
    minutes,
    line: [
      polishExerciseCount(exerciseCount),
      polishSetCount(setCount),
      formatDurationApprox(minutes),
    ].join(" · "),
  };
}

export function intensityText(item: PlanItem): string | null {
  if (item.targetRir != null && item.targetRir > 0) return `RIR ${item.targetRir}`;
  if (item.targetRpe != null && item.targetRpe > 0) return `RPE ${item.targetRpe} (≈ RIR ${rirFromRpe(item.targetRpe)})`;
  return null;
}

/** Jedna linia wiersza serii w panelu: `1 · ramp · 2 · 50 kg · RIR 0`. */
export function prescribedSetLine(s: PlanSet): { primary: string; note: string | null } {
  const chunks: string[] = [`${s.order}`];
  if (s.role) chunks.push(SET_ROLE_LABELS[s.role] ?? s.role);

  if (s.repsMax) chunks.push(`${s.reps}–${s.repsMax}`);
  else if (s.reps != null) chunks.push(`${s.reps}`);
  else if (s.durationSeconds != null) chunks.push(`${s.durationSeconds}s`);
  else if (s.distanceMeters != null) chunks.push(`${s.distanceMeters} m`);

  if (s.computedLoadKg != null) {
    chunks.push(
      s.loadPercent != null
        ? `${s.computedLoadKg} kg (${s.loadPercent}%)`
        : `${s.computedLoadKg} kg`,
    );
  } else if (s.loadKg != null) {
    chunks.push(`${s.loadKg} kg`);
  } else if (s.loadPercent != null) {
    const of =
      s.percentOf === "1rm" ? " 1RM" : s.percentOf === "top" ? " od topu" : "";
    chunks.push(`${s.loadPercent}%${of}`);
  }

  if (s.targetRir != null && s.targetRir > 0) chunks.push(`RIR ${s.targetRir}`);
  else if (s.targetRpe != null && s.targetRpe > 0) chunks.push(`RPE ${s.targetRpe}`);

  return { primary: chunks.join(" · "), note: s.note };
}
