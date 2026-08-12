/** Wspólna logika karty share (route ImageResponse + UI). Hexy = tokeny mono v2 (satori nie czyta CSS vars). */

export const SHARE_BG = "#0B0C0D";
export const SHARE_FG = "#FFFFFF";
export const SHARE_MUTED = "#9AA1A8";
export const SHARE_SECONDARY = "#C9CED4";
export const SHARE_LINE = "#2B2F33";
export const SHARE_SURFACE = "#17191B";
export const SHARE_PR = "#E0B13F";
export const SHARE_GAIN = "#57BF82";

export type ShareVariant = "stats" | "pr" | "story";

export function parseShareVariant(raw: string | null, hasPrs: boolean): ShareVariant {
  const v = (raw ?? "").toLowerCase();
  if (v === "story") return "story";
  if (v === "pr" && hasPrs) return "pr";
  if (v === "pr" && !hasPrs) return "stats";
  return "stats";
}

export function shareCardSize(variant: ShareVariant): { width: number; height: number } {
  if (variant === "story") return { width: 1080, height: 1920 };
  return { width: 1080, height: 1350 };
}

export function formatShareKg(n: number): string {
  const rounded = Math.round(n * 10) / 10;
  const s = Number.isInteger(rounded) ? String(rounded) : String(rounded).replace(".", ",");
  return s.replace(/\B(?=(\d{3})+(?!\d))/g, "\u00a0");
}

export function formatShareDay(iso: string): string {
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("pl-PL", { day: "numeric", month: "long", year: "numeric" });
}

export function formatShareDayShort(iso: string): string {
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("pl-PL", { day: "numeric", month: "short", year: "numeric" });
}

export function formatShareDuration(seconds: number | null): string {
  const sec = seconds ?? 0;
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export type SharePr = {
  exerciseId: number;
  exerciseName: string;
  weightKg: number | null;
  reps: number | null;
  estimated1Rm: number | null;
  previousBest1Rm?: number | null;
};

export type ShareSet = {
  completed: boolean;
  isPr?: boolean;
  weightKg?: number | null;
  reps?: number | null;
  estimated1Rm?: number | null;
};

export type ShareExercise = {
  exerciseId: number;
  exerciseName: string;
  sets: ShareSet[];
};

/** Hero PR: największy przyrost e1RM, potem najwyższe e1RM. */
export function pickHeroPr(prs: SharePr[]): SharePr | null {
  if (prs.length === 0) return null;
  return [...prs].sort((a, b) => {
    const da = (a.estimated1Rm ?? 0) - (a.previousBest1Rm ?? 0);
    const db = (b.estimated1Rm ?? 0) - (b.previousBest1Rm ?? 0);
    if (db !== da) return db - da;
    return (b.estimated1Rm ?? 0) - (a.estimated1Rm ?? 0);
  })[0];
}

export type HighlightLift = {
  exerciseId: number;
  name: string;
  /** np. 72×10 */
  result: string;
  isPr: boolean;
  sortKey: number;
};

/**
 * Serie, którymi warto się pochwalić: tylko ukończone, z wynikiem.
 * Nie pokazujemy 0/3 — to raport, nie share.
 */
export function highlightLifts(
  exercises: ShareExercise[],
  prExerciseIds: Set<number>,
  limit = 4,
): HighlightLift[] {
  const lifts: HighlightLift[] = [];
  for (const ex of exercises) {
    const completed = ex.sets.filter((s) => s.completed && s.weightKg != null && s.reps != null);
    if (completed.length === 0) continue;
    const best = [...completed].sort((a, b) => {
      const ea = a.estimated1Rm ?? (a.weightKg ?? 0) * (1 + (a.reps ?? 0) / 30);
      const eb = b.estimated1Rm ?? (b.weightKg ?? 0) * (1 + (b.reps ?? 0) / 30);
      return eb - ea;
    })[0];
    const w = best.weightKg!;
    const r = best.reps!;
    lifts.push({
      exerciseId: ex.exerciseId,
      name: ex.exerciseName,
      result: `${formatShareKg(w)}x${r}`,
      isPr: Boolean(best.isPr) || prExerciseIds.has(ex.exerciseId),
      sortKey: best.estimated1Rm ?? w * (1 + r / 30),
    });
  }
  return lifts.sort((a, b) => {
    if (a.isPr !== b.isPr) return a.isPr ? -1 : 1;
    return b.sortKey - a.sortKey;
  }).slice(0, limit);
}
