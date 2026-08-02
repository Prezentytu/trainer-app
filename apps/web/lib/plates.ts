/** Kalkulator talerzy — greedy, pary na stronę. */

export type PlateConfig = {
  barKg: number;
  /** Dostępne talerze (kg), od najcięższego. */
  plates: number[];
};

export const DEFAULT_PLATE_CONFIG: PlateConfig = {
  barKg: 20,
  plates: [25, 20, 15, 10, 5, 2.5, 1.25],
};

const STORAGE_KEY = "wa-plates";

export function loadPlateConfig(): PlateConfig {
  if (typeof window === "undefined") return DEFAULT_PLATE_CONFIG;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PLATE_CONFIG;
    const parsed = JSON.parse(raw) as Partial<PlateConfig>;
    return {
      barKg: typeof parsed.barKg === "number" ? parsed.barKg : DEFAULT_PLATE_CONFIG.barKg,
      plates: Array.isArray(parsed.plates) && parsed.plates.length > 0
        ? [...parsed.plates].sort((a, b) => b - a)
        : DEFAULT_PLATE_CONFIG.plates,
    };
  } catch {
    return DEFAULT_PLATE_CONFIG;
  }
}

export function savePlateConfig(config: PlateConfig): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        barKg: config.barKg,
        plates: [...config.plates].sort((a, b) => b - a),
      }),
    );
  } catch {
    /* ignore */
  }
}

export type PlateSolution = {
  /** Talerze na jedną stronę (od najcięższego). */
  perSide: number[];
  achievedKg: number;
  shortfallKg: number;
};

export function solvePlates(
  targetKg: number,
  barKg: number,
  available: number[],
): PlateSolution {
  const sorted = [...available].filter((p) => p > 0).sort((a, b) => b - a);
  if (!(targetKg > 0) || !(barKg >= 0) || targetKg < barKg) {
    return { perSide: [], achievedKg: barKg, shortfallKg: Math.max(0, targetKg - barKg) };
  }
  let remaining = (targetKg - barKg) / 2;
  const perSide: number[] = [];
  for (const plate of sorted) {
    while (remaining + 1e-9 >= plate) {
      perSide.push(plate);
      remaining -= plate;
    }
  }
  const load = perSide.reduce((s, p) => s + p, 0) * 2;
  const achievedKg = Math.round((barKg + load) * 100) / 100;
  const shortfallKg = Math.round(Math.max(0, targetKg - achievedKg) * 100) / 100;
  return { perSide, achievedKg, shortfallKg };
}

export function formatPlateList(perSide: number[]): string {
  if (perSide.length === 0) return "tylko sztanga";
  const counts = new Map<number, number>();
  for (const p of perSide) counts.set(p, (counts.get(p) ?? 0) + 1);
  return [...counts.entries()]
    .map(([p, n]) => (n > 1 ? `${n}×${formatKg(p)}` : formatKg(p)))
    .join(" + ");
}

export function formatKg(n: number): string {
  return Number.isInteger(n) ? String(n) : String(n).replace(".", ",");
}
