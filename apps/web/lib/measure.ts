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

/** Overrides z quick-entry: wartość trafia w pole zgodne z miarą. */
export function measureOverridesFromParsed(
  parsed: {
    sets: number | null;
    measure: ExerciseType | null;
    value: number | null;
    valueMax: number | null;
    tempo: string | null;
    targetRir: number | null;
  },
  fallbackMeasure: ExerciseType
): Partial<BuilderItem> {
  const measure = parsed.measure ?? fallbackMeasure;
  const overrides: Partial<BuilderItem> = { measureType: measure };
  if (parsed.sets != null) overrides.sets = parsed.sets;
  if (parsed.tempo != null) overrides.tempo = parsed.tempo;
  if (parsed.targetRir != null) overrides.targetRir = parsed.targetRir;

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
