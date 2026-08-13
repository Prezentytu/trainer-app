import { formatKg } from "@/lib/plates";

/** Para hantli (obie ręce naraz) — nie unilateral / nie goblet oznaczony jako unilateral. */
export function isDumbbellPair(ex: {
  equipment?: string[] | null;
  isUnilateral?: boolean | null;
}): boolean {
  return Boolean(ex.equipment?.includes("dumbbell") && !ex.isUnilateral);
}

/** Waga jednej hantli → „2×15 kg” (konwencja: zapisujemy sztukę, UI pokazuje parę). */
export function formatPairWeight(kg: number, opts?: { unit?: boolean }): string {
  const n = formatKg(kg);
  return opts?.unit === false ? `2×${n}` : `2×${n} kg`;
}

/** Ciężar z jednostką — 0 kg = masa ciała (BW); para hantli z prefiksem 2×. */
export function formatLoadDisplay(
  kg: number,
  ex?: { equipment?: string[] | null; isUnilateral?: boolean | null } | null,
): string {
  if (kg === 0) return "BW";
  if (ex && isDumbbellPair(ex)) return formatPairWeight(kg);
  return `${formatKg(kg)} kg`;
}

/** Zwarty wynik serii: `2×15×12` albo `15×12`. */
export function formatSetLoadReps(
  weightKg: number,
  reps: number,
  ex?: { equipment?: string[] | null; isUnilateral?: boolean | null } | null,
): string {
  const w = formatKg(weightKg);
  if (ex && isDumbbellPair(ex)) return `2×${w}×${reps}`;
  return `${w}×${reps}`;
}
