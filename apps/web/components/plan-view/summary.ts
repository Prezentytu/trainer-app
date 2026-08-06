import { PlanDay, PlanItem, PlanSet, rirFromRpe } from "@/lib/api";
import { formatMeasureCore } from "@/lib/measure";
import { estimateDayMinutes, formatDurationApprox } from "@/lib/estimateDuration";
import { formatRest } from "@/components/ui";
import { polishExerciseCount, polishSetCount } from "@/lib/plural";

function setMeasure(s: PlanSet): string | null {
  if (s.durationSeconds != null) return `${s.durationSeconds}s`;
  if (s.reps != null && s.repsMax != null) return `${s.reps}–${s.repsMax}`;
  if (s.reps != null) return `${s.reps}`;
  if (s.distanceMeters != null) return `${s.distanceMeters} m`;
  return null;
}

function setLoadShort(s: PlanSet): string | null {
  if (s.computedLoadKg != null) return `${s.computedLoadKg} kg`;
  if (s.loadKg != null) return `${s.loadKg} kg`;
  if (s.loadPercent != null) return `${s.loadPercent}%`;
  return null;
}

export type SchemeParts = {
  /** Kluczowe liczby — mocny ton: `4 × 8–10 @ 70 kg` / `rampa do 2 @ 100 kg`. */
  primary: string;
  /** Kontekst — wyciszony: `RIR 2 · 2min` / `3 serie · 2min 30s`. */
  meta: string | null;
};

/**
 * Schemat na karcie boardu z hierarchią (Value > Label).
 * Rozpis serii (role, back-offy) zostaje w panelu — karta mówi tylko,
 * do czego zmierza ćwiczenie: top/rampa albo serie × powtórzenia @ ciężar.
 */
export function schemeParts(item: PlanItem): SchemeParts {
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

    const meta = [polishSetCount(sets.length), formatRest(item.restBetweenSetsSeconds)].join(" · ");
    return { primary, meta };
  }

  const load = item.computedLoadKg ?? item.loadKg;
  const loadText =
    load != null ? ` @ ${load} kg` : item.loadPercent != null ? ` @ ${item.loadPercent}%` : "";
  const primary = `${item.sets} × ${formatMeasureCore(item)}${loadText}`;

  const metaParts: string[] = [];
  if (item.targetRir != null) metaParts.push(`RIR ${item.targetRir}`);
  else if (item.targetRpe != null) metaParts.push(`RPE ${item.targetRpe}`);
  metaParts.push(formatRest(item.restBetweenSetsSeconds));
  return { primary, meta: metaParts.join(" · ") };
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
  if (item.targetRir != null) return `RIR ${item.targetRir}`;
  if (item.targetRpe != null) return `RPE ${item.targetRpe} (≈ RIR ${rirFromRpe(item.targetRpe)})`;
  return null;
}

/** Jedna linia wiersza serii w panelu: `1 · ramp · 2 · 50 kg · RIR 0`. */
export function prescribedSetLine(s: PlanSet): { primary: string; note: string | null } {
  const chunks: string[] = [`${s.order}`];
  if (s.role) chunks.push(s.role);

  if (s.durationSeconds != null) chunks.push(`${s.durationSeconds}s`);
  else if (s.repsMax) chunks.push(`${s.reps}–${s.repsMax}`);
  else if (s.reps != null) chunks.push(`${s.reps}`);
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

  if (s.targetRir != null) chunks.push(`RIR ${s.targetRir}`);
  else if (s.targetRpe != null) chunks.push(`RPE ${s.targetRpe}`);

  return { primary: chunks.join(" · "), note: s.note };
}
