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

export function parseRampScheme(setScheme: string | null): number | null {
  if (!setScheme) return null;
  const m = setScheme.match(/rampa\s*→\s*(\d+)\s*RM/i) || setScheme.match(/rampa\s*->\s*(\d+)\s*RM/i);
  return m ? Number(m[1]) : null;
}

export function formatRampScheme(targetRm: number): string {
  return `rampa → ${targetRm}RM`;
}

/** Jedna linia podsumowania karty Lista (jak makieta WA). */
export function listEntrySummary(item: BuilderItem, exercise?: Exercise): string {
  const sets = item.sets ?? exercise?.defaultSets ?? null;
  const ramp = parseRampScheme(item.setScheme);
  let schemeText: string;
  if (ramp != null) {
    schemeText = `${sets ?? "?"} serii · rampa → ${ramp}RM`;
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

export function countDaySets(items: BuilderItem[], exercises: Exercise[]): number {
  return items.reduce((sum, item) => {
    const exercise = exercises.find((e) => e.id === item.exerciseId);
    return sum + (item.prescribedSets.length || item.sets || exercise?.defaultSets || 0);
  }, 0);
}
