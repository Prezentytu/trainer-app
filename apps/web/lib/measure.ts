import { Exercise, ExerciseType } from "@/lib/api";
import type { BuilderItem } from "@/components/plan-builder/types";

export const MEASURE_LABELS: Record<ExerciseType, string> = {
  reps: "powtórzenia",
  time: "czas",
  distance: "dystans",
};

export const MEASURE_SHORT: Record<ExerciseType, string> = {
  reps: "powt.",
  time: "czas",
  distance: "dystans",
};

/** Patch przy zmianie miary pozycji — czyści pola innych miar i wstawia smart default. */
export function measurePatch(
  measure: ExerciseType,
  exercise?: Exercise
): Partial<BuilderItem> {
  if (measure === "time") {
    return {
      measureType: "time",
      reps: null,
      repsMax: null,
      distanceMeters: null,
      repDurationSeconds: exercise?.defaultRepDurationSeconds ?? 30,
      repDurationSecondsMax: null,
    };
  }
  if (measure === "distance") {
    return {
      measureType: "distance",
      reps: null,
      repsMax: null,
      repDurationSeconds: null,
      repDurationSecondsMax: null,
      distanceMeters: exercise?.defaultDistanceMeters ?? 20,
    };
  }
  return {
    measureType: "reps",
    repDurationSeconds: null,
    repDurationSecondsMax: null,
    distanceMeters: null,
    reps: exercise?.defaultReps ?? 10,
    repsMax: null,
  };
}

export type RepRange = { reps: number | null; repsMax: number | null };

const RANGE_SEPARATORS = /[-–—/]/;

/**
 * Jedno pole zamiast pary „od/do”: `5`, `5-10`, `5–10`, `10 - 5` → `reps`/`repsMax`.
 * Zakres odwrotny normalizuje się, pusty i częściowy (`5-`) zostaje bez `repsMax`.
 */
export function parseRepRange(raw: string): RepRange {
  const text = raw.trim();
  if (text === "") return { reps: null, repsMax: null };
  const parts = text.split(RANGE_SEPARATORS).map((p) => p.trim());
  const nums = parts
    .filter((p) => p !== "")
    .map((p) => Number.parseInt(p, 10))
    .filter((n) => Number.isFinite(n) && n > 0);
  if (nums.length === 0) return { reps: null, repsMax: null };
  if (nums.length === 1) return { reps: nums[0], repsMax: null };
  const min = Math.min(nums[0], nums[1]);
  const max = Math.max(nums[0], nums[1]);
  return { reps: min, repsMax: min === max ? null : max };
}

/** Odwrotność `parseRepRange` — `8` albo `8–12`, pusty string gdy brak wartości. */
export function formatRepRange(reps: number | null, repsMax: number | null): string {
  if (reps == null && repsMax == null) return "";
  if (reps == null) return String(repsMax);
  if (repsMax == null || repsMax === reps) return String(reps);
  return `${reps}–${repsMax}`;
}

/** Rdzeń schematu: `8–10` / `30s` / `20 m`. */
export function formatMeasureCore(
  item: Pick<
    BuilderItem,
    | "measureType"
    | "reps"
    | "repsMax"
    | "repDurationSeconds"
    | "repDurationSecondsMax"
    | "distanceMeters"
  >,
  exercise?: Exercise
): string {
  if (item.measureType === "time") {
    const base = item.repDurationSeconds ?? exercise?.defaultRepDurationSeconds ?? null;
    if (base == null) return "—";
    return `${base}${item.repDurationSecondsMax ? `–${item.repDurationSecondsMax}` : ""}s`;
  }
  if (item.measureType === "distance") {
    const dist = item.distanceMeters ?? exercise?.defaultDistanceMeters ?? null;
    return dist != null ? `${dist} m` : "—";
  }
  const reps = item.reps ?? exercise?.defaultReps ?? null;
  if (reps == null) return "—";
  return `${reps}${item.repsMax ? `–${item.repsMax}` : ""}`;
}

/** Overrides z quick-entry: wartość trafia w pole zgodne z miarą (+ kg/%). Rampa: `rampOverridesFromParsed`. */
export function measureOverridesFromParsed(
  parsed: {
    sets: number | null;
    measure: ExerciseType | null;
    value: number | null;
    valueMax: number | null;
    tempo: string | null;
    targetRir: number | null;
    loadKg?: number | null;
    loadPercent?: number | null;
  },
  fallbackMeasure: ExerciseType
): Partial<BuilderItem> {
  const measure = parsed.measure ?? fallbackMeasure;
  const overrides: Partial<BuilderItem> = { measureType: measure };
  if (parsed.sets != null) overrides.sets = parsed.sets;
  if (parsed.tempo != null) overrides.tempo = parsed.tempo;
  if (parsed.targetRir != null) overrides.targetRir = parsed.targetRir;
  if (parsed.loadKg != null) {
    overrides.loadKg = parsed.loadKg;
    overrides.loadPercent = null;
  } else if (parsed.loadPercent != null) {
    overrides.loadPercent = parsed.loadPercent;
    overrides.loadKg = null;
  }

  if (parsed.value != null || parsed.measure != null) {
    if (measure === "time") {
      overrides.reps = null;
      overrides.repsMax = null;
      overrides.distanceMeters = null;
      if (parsed.value != null) overrides.repDurationSeconds = parsed.value;
      overrides.repDurationSecondsMax = parsed.valueMax;
    } else if (measure === "distance") {
      overrides.reps = null;
      overrides.repsMax = null;
      overrides.repDurationSeconds = null;
      overrides.repDurationSecondsMax = null;
      if (parsed.value != null) overrides.distanceMeters = parsed.value;
    } else {
      overrides.repDurationSeconds = null;
      overrides.repDurationSecondsMax = null;
      overrides.distanceMeters = null;
      if (parsed.value != null) overrides.reps = parsed.value;
      overrides.repsMax = parsed.valueMax;
    }
  }

  return overrides;
}
