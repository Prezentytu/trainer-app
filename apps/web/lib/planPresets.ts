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
    targetRir: null,
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

// Metoda Charlesa Poliquina 6-4-2-5-3-1 — periodyzacja 6-tygodniowa dla JEDNEJ pozycji (to samo
// ćwiczenie co tydzień). T1/T2/T3 to rampa ustalająca kolejne rekordy (6RM→4RM→2RM), T4/T5 to
// rampa ciężarem bliskim rekordowi z wcześniejszego tygodnia + serie dodatkowe, T6 to test 1RM.
// Uwaga: w MVP trener wpisuje ciężar ręcznie w każdym tygodniu — automatyczne przeniesienie
// ciężaru między tygodniami (np. "użyj 4RM z T2") wymaga logowania wyników, patrz
// .ai/specs/2026-07-05-method-templates.md.
export function poliquin642531(week: number): PlanSetInput[] {
  switch (week) {
    case 1:
      return [set(1, { role: "ramp", reps: 6, note: "ustal 6RM (z zapasem)" })];
    case 2:
      return [set(1, { role: "ramp", reps: 4, note: "ustal 4RM" }), anabolic80(2)];
    case 3:
      return [set(1, { role: "ramp", reps: 2, note: "ustal 2RM" }), anabolic80(2), volume60(3)];
    case 4:
      return [
        set(1, { role: "ramp", reps: 5, note: "rampa ciężarem bliskim 4RM z tygodnia 2" }),
        anabolic80(2),
        volume60(3),
      ];
    case 5:
      // Tapering: bez serii 60% — ograniczamy objętość przed testem maksów w T6.
      return [set(1, { role: "ramp", reps: 3, note: "rampa ciężarem bliskim 2RM z tygodnia 3" }), anabolic80(2)];
    case 6:
      return [set(1, { role: "ramp", reps: 1, repsMax: 2, note: "GRAND FINALE — nowy 1RM" })];
    default:
      return [set(1, { role: "ramp", reps: 6, note: "ustal 6RM" })];
  }
}

// Rampa do serii roboczej (progresywna rozgrzewka + 1 seria na 100%) dla JEDNEJ pozycji w JEDNYM
// dniu treningowym. To budulec metody 15-10-5, nie cała metoda — pełna metoda to podział
// tygodniowy (Dzień 15 / Dzień 10 / Dzień 5), patrz .ai/specs/2026-07-05-method-templates.md.
// Wariant = docelowa liczba powtórzeń serii roboczej (15/10/5), zgodnie z dniem, w którym
// ćwiczenie występuje.
export function rampToWorkingSet(variant: 15 | 10 | 5): PlanSetInput[] {
  const percents = variant === 15 ? [50, 75, 100] : variant === 10 ? [40, 60, 80, 100] : [40, 60, 80, 90, 100];
  return percents.map((p, idx) =>
    set(idx + 1, {
      role: p === 100 ? "top" : "ramp",
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
  { id: "ramp15", label: "Rampa do serii roboczej — 15 powt. (50/75/100%)", build: () => rampToWorkingSet(15) },
  { id: "ramp10", label: "Rampa do serii roboczej — 10 powt. (40/60/80/100%)", build: () => rampToWorkingSet(10) },
  { id: "ramp5", label: "Rampa do serii roboczej — 5 powt. (40/60/80/90/100%)", build: () => rampToWorkingSet(5) },
];
