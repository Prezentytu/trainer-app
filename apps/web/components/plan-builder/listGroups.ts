import { Exercise } from "@/lib/api";
import { formatMeasureCore } from "@/lib/measure";
import { BuilderItem } from "./types";

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

/** Numeracja pozycji dnia: 0 gdy jest rozgrzewka, inaczej od 1; superserie z literami. */
export function buildListGroups(items: BuilderItem[]): ListGroup[] {
  const hasWarmup = items.some((it) => it.isWarmup);
  const groups: ListGroup[] = [];
  let i = 0;
  let nextNum = hasWarmup ? 0 : 1;
  let mainCaptionDone = false;

  while (i < items.length) {
    let end = i;
    while (end < items.length - 1 && items[end].linkedToNext) end++;
    const slice = items.slice(i, end + 1);
    const multi = slice.length > 1;
    const positionNum = nextNum;
    const isWarmup = items[i].isWarmup;

    let caption: string | null = null;
    if (isWarmup && positionNum === 0) caption = "Rozgrzewka · 0";
    else if (hasWarmup && !isWarmup && !mainCaptionDone) {
      caption = "Część główna";
      mainCaptionDone = true;
    }

    const entries: ListEntry[] = slice.map((item, letterIndex) => ({
      item,
      index: i + letterIndex,
      label: multi ? `${positionNum}${LETTERS.charAt(letterIndex)}` : String(positionNum),
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

    nextNum++;
    i = end + 1;
  }

  return groups;
}

/** Etykieta następnej pozycji (composer badge). */
export function nextPositionLabel(
  items: BuilderItem[],
  opts?: { forcedNum?: number | null; pendingNum?: number | null }
): string {
  const groups = buildListGroups(items);
  if (opts?.forcedNum != null) {
    const g = groups.find((x) => x.positionNum === opts.forcedNum);
    if (g) return `${opts.forcedNum}${LETTERS.charAt(g.entries.length)}`;
    return String(opts.forcedNum);
  }
  if (opts?.pendingNum != null) {
    const g = groups.find((x) => x.positionNum === opts.pendingNum);
    if (g) return `${opts.pendingNum}${LETTERS.charAt(g.entries.length)}`;
    return String(opts.pendingNum);
  }
  if (groups.length === 0) return "1";
  // Domyślnie kolejny numer po ostatniej pozycji (nie 0, chyba że pusto i warmup pending)
  const last = groups[groups.length - 1];
  return String(last.positionNum + 1);
}

/** Etykieta superserii z ostatnią pozycją (hint ⇧↵). */
export function superHintLabel(items: BuilderItem[]): string {
  const groups = buildListGroups(items);
  if (groups.length === 0) return "—";
  const last = groups[groups.length - 1];
  return `${last.positionNum}${LETTERS.charAt(last.entries.length)}`;
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

/** Buduje prescribedSets: 1× ramp (cel xRM) + N× backoff (każdy z własnym %). */
export function buildRampPrescribedSets(opts: {
  targetRm: number;
  backoffs: BackoffRow[];
}): BuilderItem["prescribedSets"] {
  const sets: BuilderItem["prescribedSets"] = [
    {
      key: Math.random().toString(36).slice(2),
      order: 1,
      reps: opts.targetRm,
      repsMax: null,
      durationSeconds: null,
      distanceMeters: null,
      loadKg: null,
      loadPercent: null,
      percentOf: null,
      targetRpe: null,
      targetRir: null,
      tempo: null,
      role: "ramp",
      note: `ustal ${opts.targetRm}RM`,
    },
  ];
  opts.backoffs.forEach((bo, i) => {
    sets.push({
      key: Math.random().toString(36).slice(2),
      order: i + 2,
      reps: bo.reps ?? DEFAULT_BACKOFF.reps,
      repsMax: bo.repsMax ?? DEFAULT_BACKOFF.repsMax,
      durationSeconds: null,
      distanceMeters: null,
      loadKg: null,
      loadPercent: bo.percent,
      percentOf: "top",
      targetRpe: null,
      targetRir: null,
      tempo: null,
      role: "backoff",
      note: i === 0 ? "seria anaboliczna" : null,
    });
  });
  return sets;
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

/** Jedna linia podsumowania karty Lista (jak makieta WA). */
export function listEntrySummary(item: BuilderItem, exercise?: Exercise): string {
  const sets = item.sets ?? exercise?.defaultSets ?? null;
  const ramp = parseRampSchemeInfo(item.setScheme);
  let schemeText: string;
  if (ramp != null) {
    const backoffs = readRampBackoffs(item);
    const percents =
      backoffs.length > 0
        ? backoffs.map((b) => b.percent)
        : ramp.backoffPercents;
    schemeText = formatRampScheme(ramp.targetRm, percents);
    if (item.sets != null) schemeText = `~${item.sets} serii · ${schemeText}`;
  } else if (item.setScheme) {
    schemeText = sets ? `${sets} serii · ${item.setScheme}` : item.setScheme;
  } else {
    const core = formatMeasureCore(item, exercise);
    schemeText = sets ? `${sets} × ${core}` : core;
  }

  const parts: string[] = [schemeText];
  if (item.tempo) parts.push(`tempo ${item.tempo}`);
  if (item.targetRir != null) {
    const rirLabel = item.targetRir >= 3 ? "3+" : String(item.targetRir);
    parts.push(`RIR ${rirLabel}`);
  }
  const rest = item.restBetweenSetsSeconds ?? exercise?.defaultRestBetweenSetsSeconds ?? null;
  if (rest != null) parts.push(`przerwa ${rest}s`);
  return parts.join(" · ");
}

function itemSetCount(item: BuilderItem, exercise?: Exercise): number {
  const ramp = parseRampSchemeInfo(item.setScheme);
  if (ramp != null) {
    const boCount = item.prescribedSets.filter((s) => s.role === "backoff").length;
    const rampSets = item.sets ?? OPEN_RAMP_SET_FALLBACK;
    return rampSets + boCount;
  }
  if (item.prescribedSets.length > 0) return item.prescribedSets.length;
  return item.sets || exercise?.defaultSets || 0;
}

export function countDaySets(items: BuilderItem[], exercises: Exercise[]): number {
  return items.reduce((sum, item) => {
    const exercise = exercises.find((e) => e.id === item.exerciseId);
    return sum + itemSetCount(item, exercise);
  }, 0);
}
