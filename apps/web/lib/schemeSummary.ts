import { formatKg } from "@/lib/plates";
import type { Exercise } from "@/lib/api";
import { formatMeasureCore } from "@/lib/measure";
import { formatLoadDisplay, isDumbbellPair } from "@/lib/weight";

export type SchemeSetLike = {
  reps?: number | null;
  repsMax?: number | null;
  durationSeconds?: number | null;
  distanceMeters?: number | null;
  loadKg?: number | null;
  computedLoadKg?: number | null;
  loadPercent?: number | null;
  role?: string | null;
};

export type SchemeItemLike = {
  sets?: number | null;
  reps?: number | null;
  repsMax?: number | null;
  loadKg?: number | null;
  computedLoadKg?: number | null;
  loadPercent?: number | null;
  setScheme?: string | null;
  prescribedSets?: SchemeSetLike[];
  measureType?: "reps" | "time" | "distance" | null;
  repDurationSeconds?: number | null;
  repDurationSecondsMax?: number | null;
  distanceMeters?: number | null;
};

export type SchemeExerciseLike = {
  defaultSets?: number;
  defaultReps?: number;
  defaultRepDurationSeconds?: number | null;
  defaultDistanceMeters?: number | null;
  equipment?: string[] | null;
  isUnilateral?: boolean | null;
} | null;

function setMeasure(s: SchemeSetLike): string | null {
  if (s.durationSeconds != null) return `${s.durationSeconds} s`;
  if (s.distanceMeters != null) return `${s.distanceMeters} m`;
  if (s.reps != null && s.repsMax != null) return `${s.reps}–${s.repsMax}`;
  if (s.reps != null) return String(s.reps);
  return null;
}

function setLoadKg(s: SchemeSetLike): number | null {
  return s.computedLoadKg ?? s.loadKg ?? null;
}

function setLoadText(s: SchemeSetLike, ex?: SchemeExerciseLike): string | null {
  const kg = setLoadKg(s);
  if (kg != null) return formatLoadDisplay(kg, ex);
  if (s.loadPercent != null) return `${s.loadPercent}%`;
  return null;
}

function formatKgRange(min: number, max: number, ex?: SchemeExerciseLike): string {
  if (min === 0 && max === 0) return "BW";
  const a = formatKg(min);
  const b = formatKg(max);
  if (ex && isDumbbellPair(ex)) return `2×${a}–${b} kg`;
  return `${a}–${b} kg`;
}

function parseOpenRampRm(setScheme: string | null | undefined): number | null {
  if (!setScheme) return null;
  const m =
    setScheme.match(/rampa\s*[→\-]+\s*(\d+)\s*RM/i) ||
    setScheme.match(/rampa\s+(\d+)/i);
  if (!m) return null;
  const targetRm = Number(m[1]);
  return Number.isFinite(targetRm) && targetRm >= 1 ? targetRm : null;
}

/** Zwięzły zapis rozpisu: `4 × 8 @ 60 kg`, rampa `5 × 2 @ 25–55 kg`, różne powt. `8/8/6/6`. */
export function compactPrescribedScheme(
  sets: SchemeSetLike[],
  ex?: SchemeExerciseLike,
): string | null {
  if (sets.length === 0) return null;
  const measures = sets.map(setMeasure);
  const loads = sets.map((s) => setLoadText(s, ex));
  const kgs = sets.map(setLoadKg);
  const pcts = sets.map((s) => s.loadPercent ?? null);

  const allMeasureSame = measures.every((m) => m === measures[0]);
  const allLoadSame = loads.every((l) => l === loads[0]);
  const measure = measures[0];
  const load = loads[0];

  if (allMeasureSame && allLoadSame) {
    const core = [measure, load].filter(Boolean).join(" @ ");
    return core ? `${sets.length} × ${core}` : `${sets.length} serii`;
  }

  if (allMeasureSame && measure) {
    const numericKgs = kgs.filter((k): k is number => k != null);
    if (numericKgs.length === sets.length) {
      const min = Math.min(...numericKgs);
      const max = Math.max(...numericKgs);
      if (min !== max) return `${sets.length} × ${measure} @ ${formatKgRange(min, max, ex)}`;
    }
    const numericPcts = pcts.filter((p): p is number => p != null);
    if (numericPcts.length === sets.length && kgs.every((k) => k == null)) {
      const min = Math.min(...numericPcts);
      const max = Math.max(...numericPcts);
      if (min !== max) return `${sets.length} × ${measure} @ ${min}–${max}%`;
    }
    const presentLoads = loads.filter((l): l is string => l != null);
    if (presentLoads.length === sets.length) {
      return `${sets.length} × ${measure} @ ${presentLoads[0]}–${presentLoads[presentLoads.length - 1]}`;
    }
    return `${sets.length} × ${measure}`;
  }

  if (measures.every(Boolean) && allLoadSame && load) {
    return `${measures.join("/")} @ ${load}`;
  }
  if (measures.every(Boolean)) {
    return measures.join("/");
  }
  return `${sets.length} serii`;
}

/** Jedna linia schematu — prescribedSets wygrywa z agregatem. */
export function compactSchemeLine(item: SchemeItemLike, exercise?: SchemeExerciseLike): string {
  const sets = item.prescribedSets ?? [];
  if (sets.length > 0) {
    return compactPrescribedScheme(sets, exercise) ?? "—";
  }

  const rampRm = parseOpenRampRm(item.setScheme);
  if (rampRm != null) {
    const n = item.sets;
    return n != null ? `~${n} serii · rampa → ${rampRm}RM` : `rampa → ${rampRm}RM`;
  }
  if (item.setScheme) {
    const n = item.sets ?? exercise?.defaultSets ?? null;
    return n ? `${n} serii · ${item.setScheme}` : item.setScheme;
  }

  const core = formatMeasureCore(
    {
      measureType: item.measureType ?? "reps",
      reps: item.reps ?? null,
      repsMax: item.repsMax ?? null,
      repDurationSeconds: item.repDurationSeconds ?? null,
      repDurationSecondsMax: item.repDurationSecondsMax ?? null,
      distanceMeters: item.distanceMeters ?? null,
    },
    (exercise ?? undefined) as Exercise | undefined,
  );
  const kg = item.computedLoadKg ?? item.loadKg ?? null;
  const loadText =
    kg != null
      ? ` @ ${formatLoadDisplay(kg, exercise)}`
      : item.loadPercent != null
        ? ` @ ${item.loadPercent}%`
        : "";
  const n = item.sets ?? exercise?.defaultSets ?? null;
  return n != null ? `${n} × ${core}${loadText}` : `${core}${loadText}`;
}
