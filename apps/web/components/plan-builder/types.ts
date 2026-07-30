import { ExerciseType, PlanSetInput } from "@/lib/api";

export type BuilderSet = PlanSetInput & { key: string };

export type BuilderItem = {
  key: string;
  exerciseId: number;
  exerciseName: string;
  /** Typ ćwiczenia w bibliotece (kontekst pickera). */
  exerciseType: ExerciseType;
  /** Efektywna miara tej pozycji w planie. */
  measureType: ExerciseType;
  order: number;
  // Superseria jako akcja „połącz z następną pozycją”, nie surowe pole liczbowe —
  // numery grup (PlanItem.supersetGroup) są wyliczane przy zapisie, patrz lib/supersets.ts.
  linkedToNext: boolean;
  isWarmup: boolean;
  sets: number | null;
  reps: number | null;
  repsMax: number | null;
  repDurationSeconds: number | null;
  repDurationSecondsMax: number | null;
  distanceMeters: number | null;
  tempo: string | null;
  targetRpe: number | null;
  targetRir: number | null;
  setScheme: string | null;
  restBetweenSetsSeconds: number | null;
  restAfterExerciseSeconds: number | null;
  loadKg: number | null;
  loadPercent: number | null;
  notes: string | null;
  prescribedSets: BuilderSet[];
};

export type BuilderDay = {
  key: string;
  weekNumber: number;
  order: number;
  label: string;
  notes: string | null;
  items: BuilderItem[];
};

export function newKey(): string {
  return Math.random().toString(36).slice(2);
}
