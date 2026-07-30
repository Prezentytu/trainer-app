import { Exercise, ExerciseType } from "@/lib/api";
import { ParsedQuickEntry } from "@/lib/quickEntry";

export type ExerciseInput = Omit<Exercise, "id">;

export const DEFAULT_EXERCISE_INPUT: ExerciseInput = {
  name: "",
  description: null,
  type: "reps",
  defaultSets: 3,
  defaultReps: 10,
  defaultRepDurationSeconds: null,
  defaultDistanceMeters: null,
  defaultRestBetweenSetsSeconds: 60,
  defaultLoadKg: null,
  category: null,
  pattern: null,
  isUnilateral: false,
  equipment: [],
  primaryMuscles: [],
  instructions: null,
  media: [],
};

/** Buduje payload tworzenia ćwiczenia z nazwy + opcjonalnych parametrów quick-entry. */
export function exerciseInputFromQuickEntry(
  query: string,
  parsed?: Pick<ParsedQuickEntry, "sets" | "measure" | "value" | "valueMax">,
  type: ExerciseType = parsed?.measure ?? "reps"
): ExerciseInput {
  const name = query.trim().replace(/\s+/g, " ");
  const sets = parsed?.sets ?? DEFAULT_EXERCISE_INPUT.defaultSets;
  const resolvedType = parsed?.measure ?? type;

  if (resolvedType === "time") {
    return {
      ...DEFAULT_EXERCISE_INPUT,
      name,
      type: "time",
      defaultSets: sets,
      defaultReps: 1,
      defaultRepDurationSeconds: parsed?.value ?? 30,
      defaultDistanceMeters: null,
    };
  }
  if (resolvedType === "distance") {
    return {
      ...DEFAULT_EXERCISE_INPUT,
      name,
      type: "distance",
      defaultSets: sets,
      defaultReps: 1,
      defaultRepDurationSeconds: null,
      defaultDistanceMeters: parsed?.value ?? 20,
    };
  }
  return {
    ...DEFAULT_EXERCISE_INPUT,
    name,
    type: "reps",
    defaultSets: sets,
    defaultReps: parsed?.value ?? DEFAULT_EXERCISE_INPUT.defaultReps,
    defaultRepDurationSeconds: null,
    defaultDistanceMeters: null,
  };
}

/** Podgląd parametrów dla rzędu „Utwórz” (np. `3×8 · powtórzenia`). */
export function createExercisePreviewLabel(
  input: Pick<
    ExerciseInput,
    "type" | "defaultSets" | "defaultReps" | "defaultRepDurationSeconds" | "defaultDistanceMeters"
  >
): string {
  const typeLabel =
    input.type === "time" ? "czas" : input.type === "distance" ? "dystans" : "powtórzenia";
  let core: string;
  if (input.type === "time") {
    core = input.defaultRepDurationSeconds ? `${input.defaultRepDurationSeconds}s` : "—";
  } else if (input.type === "distance") {
    core = input.defaultDistanceMeters ? `${input.defaultDistanceMeters} m` : "—";
  } else {
    core = `${input.defaultReps}`;
  }
  return `${input.defaultSets}×${core} · ${typeLabel}`;
}
