import { Exercise } from "@/lib/api";
import { compactSchemeLine } from "@/lib/schemeSummary";
import { BuilderItem, newKey } from "./types";

const LETTERS = "abcdefgh";

export type ListEntry = {
  item: BuilderItem;
  index: number;
  label: string;
  positionNum: number;
  letterIndex: number;
  multi: boolean;
};

export type ListGroup = {
  positionNum: number;
  isWarmup: boolean;
  multi: boolean;
  /** np. "a → b" */
  flow: string;
  caption: string | null;
  entries: ListEntry[];
};

function positionLabel(isWarmup: boolean, positionNum: number, letterIndex: number, multi: boolean): string {
  const prefix = isWarmup ? `R${positionNum}` : String(positionNum);
  return multi ? `${prefix}${LETTERS.charAt(letterIndex)}` : prefix;
}

/** Numeracja: rozgrzewka R1/R2, część główna od 1; superserie z literami. */
export function buildListGroups(items: BuilderItem[]): ListGroup[] {
  const hasWarmup = items.some((it) => it.isWarmup);
  const groups: ListGroup[] = [];
  let i = 0;
  let nextWarmup = 1;
  let nextMain = 1;
  let mainCaptionDone = false;

  while (i < items.length) {
    let end = i;
    while (end < items.length - 1 && items[end].linkedToNext) end++;
    const slice = items.slice(i, end + 1);
    const multi = slice.length > 1;
    const isWarmup = items[i].isWarmup;
    const positionNum = isWarmup ? nextWarmup : nextMain;

    let caption: string | null = null;
    if (isWarmup && positionNum === 1) caption = "Rozgrzewka";
    else if (hasWarmup && !isWarmup && !mainCaptionDone) {
      caption = "Część główna";
      mainCaptionDone = true;
    }

    const entries: ListEntry[] = slice.map((item, letterIndex) => ({
      item,
      index: i + letterIndex,
      label: positionLabel(isWarmup, positionNum, letterIndex, multi),
      positionNum,
      letterIndex,
      multi,
    }));

    groups.push({
      positionNum,
      isWarmup,
      multi,
      flow: multi ? slice.map((_, idx) => LETTERS.charAt(idx)).join(" → ") : "",
      caption,
      entries,
    });

    if (isWarmup) nextWarmup++;
    else nextMain++;
    i = end + 1;
  }

  return groups;
}

/** Etykieta następnej pozycji (composer badge). */
export function nextPositionLabel(
  items: BuilderItem[],
  opts?: { forcedNum?: number | null; pendingNum?: number | null; pendingWarmup?: boolean }
): string {
  const groups = buildListGroups(items);
  if (opts?.forcedNum != null) {
    if (opts.forcedNum === 0) {
      const warmups = groups.filter((x) => x.isWarmup);
      const g = warmups[warmups.length - 1];
      if (g) return positionLabel(true, g.positionNum, g.entries.length, true);
      return "R1";
    }
    const g = groups.find((x) => !x.isWarmup && x.positionNum === opts.forcedNum);
    if (g) return positionLabel(false, opts.forcedNum, g.entries.length, true);
    return String(opts.forcedNum);
  }
  if (opts?.pendingNum != null) {
    const warmup = Boolean(opts.pendingWarmup);
    const g = groups.find((x) => x.positionNum === opts.pendingNum && x.isWarmup === warmup);
    if (g) return positionLabel(g.isWarmup, g.positionNum, g.entries.length, true);
    return warmup ? `R${opts.pendingNum}` : String(opts.pendingNum);
  }
  const mains = groups.filter((x) => !x.isWarmup);
  if (mains.length === 0) return "1";
  return String(mains[mains.length - 1].positionNum + 1);
}

/** Etykieta superserii z ostatnią pozycją (hint ⇧↵). */
export function superHintLabel(items: BuilderItem[]): string {
  const groups = buildListGroups(items);
  if (groups.length === 0) return "1a";
  const last = groups[groups.length - 1];
  return positionLabel(last.isWarmup, last.positionNum, last.entries.length, true);
}

export type BackoffRow = {
  reps: number | null;
  repsMax: number | null;
  percent: number;
};

export type RampSchemeInfo = {
  targetRm: number;
  /** % topu dla serii backoff (kolejność = kolejność serii); null/[] = bez BO */
  backoffPercents: number[] | null;
};

const DEFAULT_BACKOFF: BackoffRow = { reps: 5, repsMax: 10, percent: 80 };

/** Heurystyka liczby serii przy otwartej rampie (estymata czasu / volume). */
export const OPEN_RAMP_SET_FALLBACK = 5;

function parseBackoffPercents(raw: string | undefined): number[] | null {
  if (!raw) return null;
  const parts = raw
    .split("/")
    .map((p) => Number(p.trim()))
    .filter((n) => Number.isFinite(n) && n > 0);
  return parts.length > 0 ? parts : null;
}

/** Parsuje `rampa → 4RM` / `rampa → 4RM + BO 80%` / `rampa → 2RM + BO 80/60%`. */
export function parseRampSchemeInfo(setScheme: string | null): RampSchemeInfo | null {
  if (!setScheme) return null;
  const m =
    setScheme.match(/rampa\s*[→\-]+\s*(\d+)\s*RM(?:\s*\+\s*BO\s*([\d./]+)\s*%?)?/i) ||
    setScheme.match(/rampa\s+(\d+)(?:\s*\+\s*BO\s*([\d./]+)\s*%?)?/i);
  if (!m) return null;
  const targetRm = Number(m[1]);
  if (!Number.isFinite(targetRm) || targetRm < 1) return null;
  return {
    targetRm,
    backoffPercents: parseBackoffPercents(m[2]),
  };
}

/** @deprecated użyj parseRampSchemeInfo — zostawione dla krótkiego odczytu celu */
export function parseRampScheme(setScheme: string | null): number | null {
  return parseRampSchemeInfo(setScheme)?.targetRm ?? null;
}

export function formatRampScheme(
  targetRm: number,
  backoffPercents?: number | number[] | null
): string {
  const base = `rampa → ${targetRm}RM`;
  if (backoffPercents == null) return base;
  const list = (Array.isArray(backoffPercents) ? backoffPercents : [backoffPercents]).filter(
    (n) => Number.isFinite(n) && n > 0
  );
  if (list.length === 0) return base;
  return `${base} + BO ${list.join("/")}%`;
}

const DEFAULT_RAMP_STEPS = [50, 75, 90];

function emptyRampSet(
  order: number,
  patch: Partial<BuilderItem["prescribedSets"][number]>,
): BuilderItem["prescribedSets"][number] {
  return {
    key: newKey(),
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

/** Rozbieg (domyślnie 50/75/90% topu) + seria szczytowa + backoffi. */
export function buildRampPrescribedSets(opts: {
  targetRm: number;
  topKg?: number | null;
  rampSteps?: number[];
  backoffs: BackoffRow[];
}): BuilderItem["prescribedSets"] {
  const steps = opts.rampSteps ?? DEFAULT_RAMP_STEPS;
  const sets: BuilderItem["prescribedSets"] = [];
  let order = 1;
  for (const percent of steps) {
    sets.push(
      emptyRampSet(order++, {
        reps: opts.targetRm,
        loadPercent: percent,
        percentOf: "top",
        role: "ramp",
      }),
    );
  }
  sets.push(
    emptyRampSet(order++, {
      reps: opts.targetRm,
      loadKg: opts.topKg ?? null,
      role: "top",
      note: `ustal ${opts.targetRm}RM`,
    }),
  );
  opts.backoffs.forEach((bo, i) => {
    sets.push(
      emptyRampSet(order++, {
        reps: bo.reps ?? DEFAULT_BACKOFF.reps,
        repsMax: bo.repsMax ?? DEFAULT_BACKOFF.repsMax,
        loadPercent: bo.percent,
        percentOf: "top",
        role: "backoff",
        note: i === 0 ? "seria anaboliczna" : null,
      }),
    );
  });
  return sets;
}

/** Dopisuje brakujące stopnie rampy (rola + kolejność), nie kasując ręcznych wierszy. */
export function mergeRampRoles(
  existing: BuilderItem["prescribedSets"],
  generated: BuilderItem["prescribedSets"],
): BuilderItem["prescribedSets"] {
  if (existing.length === 0) return generated;
  const haveCount = new Map<string, number>();
  for (const s of existing) {
    if (!s.role) continue;
    haveCount.set(s.role, (haveCount.get(s.role) ?? 0) + 1);
  }
  const seen = new Map<string, number>();
  const extra = generated.filter((s) => {
    if (!s.role) return false;
    const n = (seen.get(s.role) ?? 0) + 1;
    seen.set(s.role, n);
    return n > (haveCount.get(s.role) ?? 0);
  });
  return [...existing, ...extra].map((s, i) => ({ ...s, order: i + 1 }));
}

/** Odczyt wierszy BO z prescribedSets (+ fallback z setScheme). */
export function readRampBackoffs(item: BuilderItem): BackoffRow[] {
  const info = parseRampSchemeInfo(item.setScheme);
  const boSets = item.prescribedSets.filter((s) => s.role === "backoff");
  if (boSets.length > 0) {
    return boSets.map((s, i) => ({
      reps: s.reps ?? DEFAULT_BACKOFF.reps,
      repsMax: s.repsMax ?? DEFAULT_BACKOFF.repsMax,
      percent: s.loadPercent ?? info?.backoffPercents?.[i] ?? DEFAULT_BACKOFF.percent,
    }));
  }
  if (info?.backoffPercents && info.backoffPercents.length > 0) {
    return info.backoffPercents.map((percent) => ({ ...DEFAULT_BACKOFF, percent }));
  }
  return [];
}

/** Jedna linia podsumowania karty Lista — prescribedSets jest źródłem prawdy. */
export function listEntrySummary(item: BuilderItem, exercise?: Exercise, omitRest = false): string {
  const parts: string[] = [compactSchemeLine(item, exercise)];
  if (item.tempo) parts.push(`tempo ${item.tempo}`);
  if (item.targetRir != null && item.targetRir > 0) {
    const rirLabel = item.targetRir >= 3 ? "3+" : String(item.targetRir);
    parts.push(`RIR ${rirLabel}`);
  }
  const rest = item.restBetweenSetsSeconds ?? exercise?.defaultRestBetweenSetsSeconds ?? null;
  if (rest != null && rest > 0 && !omitRest) parts.push(`przerwa ${rest}s`);
  return parts.join(" · ");
}

export function itemSetCount(item: BuilderItem, exercise?: Exercise): number {
  if (item.prescribedSets.length > 0) return item.prescribedSets.length;
  const ramp = parseRampSchemeInfo(item.setScheme);
  if (ramp != null) {
    return (item.sets ?? OPEN_RAMP_SET_FALLBACK) + readRampBackoffs(item).length;
  }
  return item.sets || exercise?.defaultSets || 0;
}

export function countDaySets(items: BuilderItem[], exercises: Exercise[]): number {
  return items.reduce((sum, item) => {
    const exercise = exercises.find((e) => e.id === item.exerciseId);
    return sum + itemSetCount(item, exercise);
  }, 0);
}
