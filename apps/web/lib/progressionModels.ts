/**
 * Modele progresji obciążenia dla jednej pozycji planu w kolejnych tygodniach.
 * Wszystko liczymy w kilogramach na serię szczytową — resztę serii trener trzyma w rozpisie.
 */

export type ProgressionModel = "linear" | "step" | "wave";

export type ProgressionParams = {
  /** Ciężar serii szczytowej w tygodniu 1. */
  baseKg: number;
  /** Ile tygodni wygenerować. */
  weeks: number;
  /** Skok obciążenia między krokami. */
  incrementKg: number;
  /** `step`: ile tygodni trzymamy ten sam ciężar. `wave`: długość fali. */
  blockWeeks?: number;
  /** Ostatni tydzień jako roztrenowanie — procent ciężaru z poprzedniego tygodnia. */
  deloadPercent?: number | null;
  /** Zaokrąglenie do wielokrotności (talerze 1,25 kg → skok 2,5 kg). */
  roundToKg?: number;
};

export const PROGRESSION_LABELS: Record<ProgressionModel, string> = {
  linear: "Liniowa",
  step: "Schodkowa",
  wave: "Falowa",
};

export const PROGRESSION_HINTS: Record<ProgressionModel, string> = {
  linear: "Ten sam skok w każdym tygodniu. Dla początkujących i krótkich bloków.",
  step: "Ciężar rośnie co kilka tygodni, między krokami zostaje ten sam. Dla średnio zaawansowanych.",
  wave: "Fale po kilka tygodni: w każdej kolejnej startujesz wyżej niż w poprzedniej. Dla zaawansowanych.",
};

function roundTo(value: number, step: number): number {
  if (step <= 0) return Math.round(value * 2) / 2;
  return Math.round(value / step) * step;
}

/** Zwraca ciężar serii szczytowej dla każdego tygodnia (index 0 = tydzień 1). */
export function generateProgression(
  model: ProgressionModel,
  params: ProgressionParams,
): number[] {
  const weeks = Math.max(1, Math.floor(params.weeks));
  const step = params.roundToKg ?? 2.5;
  const inc = params.incrementKg;
  const block = Math.max(1, Math.floor(params.blockWeeks ?? (model === "wave" ? 3 : 2)));
  const deload = params.deloadPercent ?? null;
  const hasDeload = deload != null && deload > 0 && weeks > 1;
  const workWeeks = hasDeload ? weeks - 1 : weeks;

  const raw: number[] = [];
  for (let i = 0; i < workWeeks; i++) {
    if (model === "linear") {
      raw.push(params.baseKg + i * inc);
      continue;
    }
    if (model === "step") {
      raw.push(params.baseKg + Math.floor(i / block) * inc);
      continue;
    }
    // Falowa: w obrębie fali rośnie o `inc`, każda kolejna fala startuje o jeden skok wyżej.
    const waveIndex = Math.floor(i / block);
    const inWave = i % block;
    raw.push(params.baseKg + waveIndex * inc + inWave * inc);
  }

  const result = raw.map((kg) => roundTo(kg, step));
  if (hasDeload) {
    const reference = result[result.length - 1] ?? params.baseKg;
    result.push(roundTo((reference * deload) / 100, step));
  }
  return result;
}

/** Podgląd w jednej linii: `80 · 82,5 · 85 · 70`. */
export function formatProgressionPreview(values: number[]): string {
  return values.map((v) => String(v).replace(".", ",")).join(" · ");
}

/** Różnica względem poprzedniego tygodnia — `+2,5` / `−10` / `=`. */
export function formatDelta(current: number | null, previous: number | null): string | null {
  if (current == null || previous == null) return null;
  const diff = Math.round((current - previous) * 100) / 100;
  if (diff === 0) return "=";
  const sign = diff > 0 ? "+" : "−";
  return `${sign}${String(Math.abs(diff)).replace(".", ",")}`;
}
