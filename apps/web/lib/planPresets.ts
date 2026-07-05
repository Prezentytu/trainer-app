import { PlanSetInput } from "@/lib/api";

// Fabryka serii z domyślnymi (null) polami — ustawiamy tylko to, co istotne dla presetu.
function set(order: number, patch: Partial<PlanSetInput>): PlanSetInput {
  return {
    order,
    reps: null,
    repsMax: null,
    durationSeconds: null,
    distanceMeters: null,
    loadKg: null,
    loadPercent: null,
    percentOf: null,
    targetRpe: null,
    tempo: null,
    role: null,
    note: null,
    ...patch,
  };
}

// Serie anaboliczne wspólne dla metody 6-4-2-5-3-1 (procent od topowej/rampowej serii tej sesji).
const anabolic80 = (order: number) =>
  set(order, { role: "backoff", reps: 5, repsMax: 10, loadPercent: 80, percentOf: "top", note: "seria anaboliczna" });
const volume60 = (order: number) =>
  set(order, { role: "backoff", reps: 10, repsMax: 15, loadPercent: 60, percentOf: "top" });

// Metoda Charlesa Poliquina 6-4-2-5-3-1 — rozkład zależny od numeru tygodnia (1..6).
export function poliquin642531(week: number): PlanSetInput[] {
  switch (week) {
    case 1:
      return [set(1, { role: "ramp", reps: 6, note: "ustal 6RM (z zapasem)" })];
    case 2:
      return [set(1, { role: "ramp", reps: 4, note: "ustal 4RM" }), anabolic80(2)];
    case 3:
      return [set(1, { role: "ramp", reps: 2, note: "ustal 2RM" }), anabolic80(2), volume60(3)];
    case 4:
      return [set(1, { role: "work", reps: 5, note: "ciężar z 4RM (T2)" }), anabolic80(2), volume60(3)];
    case 5:
      return [set(1, { role: "work", reps: 3, note: "ciężar z 2RM (T3)" }), anabolic80(2)];
    case 6:
      return [set(1, { role: "ramp", reps: 1, repsMax: 2, note: "GRAND FINALE — nowy 1RM" })];
    default:
      return [set(1, { role: "ramp", reps: 6, note: "ustal 6RM" })];
  }
}

// Szablon 15-10-5 — procenty rosnące do topu (100%). Wariant = docelowe powtórzenia.
export function template151005(variant: 15 | 10 | 5): PlanSetInput[] {
  const percents = variant === 15 ? [50, 75, 100] : variant === 10 ? [40, 60, 80, 100] : [40, 60, 80, 90, 100];
  return percents.map((p, idx) =>
    set(idx + 1, {
      role: p === 100 ? "top" : "work",
      reps: variant,
      loadPercent: p,
      percentOf: "top",
    })
  );
}

export type PlanPreset = {
  id: string;
  label: string;
  // week jest przekazywany dla presetów periodyzowanych (6-4-2-5-3-1).
  build: (week: number) => PlanSetInput[];
};

export const PLAN_PRESETS: PlanPreset[] = [
  { id: "642531", label: "Metoda 6-4-2-5-3-1 (wg tygodnia)", build: (week) => poliquin642531(week) },
  { id: "15", label: "Szablon 15-10-5 → 15 powt. (50/75/100%)", build: () => template151005(15) },
  { id: "10", label: "Szablon 15-10-5 → 10 powt. (40/60/80/100%)", build: () => template151005(10) },
  { id: "5", label: "Szablon 15-10-5 → 5 powt. (40/60/80/90/100%)", build: () => template151005(5) },
];
