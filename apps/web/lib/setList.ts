import { polishSetCount } from "@/lib/plural";

/** Parser serii z kartki / dziennika: `65 x 5` = ciężar × powtórzenia, `8x30` = powt. × kg. */

export type ParsedLoggedSet = {
  reps: number;
  repsMax?: number | null;
  loadKg: number | null;
  loadPercent?: number | null;
  isBodyweight: boolean;
};

const SET_SEP = /\s*[,;·]\s*/;

function parseNumber(raw: string): number {
  return Number(raw.replace(",", "."));
}

function isDecimalToken(raw: string): boolean {
  return /[.,]/.test(raw);
}

/** Gdy brak jednostki: większa (≥40 albo ≥20 przy małych powt.) = ciężar; inaczej lewa = powt. (8×30). */
function resolvePair(
  left: number,
  right: number,
  leftRaw: string,
  rightRaw: string,
  unit: "kg" | "%" | null,
  unitOn: "left" | "right" | null,
): { reps: number; loadKg: number | null; loadPercent: number | null } | null {
  if (unit === "%") {
    const pct = unitOn === "left" ? left : right;
    const reps = unitOn === "left" ? right : left;
    if (reps < 1 || reps > 100 || pct <= 0 || pct > 100) return null;
    return { reps, loadKg: null, loadPercent: pct };
  }

  if (unit === "kg") {
    const kg = unitOn === "left" ? left : right;
    const reps = unitOn === "left" ? right : left;
    if (reps < 1 || reps > 100 || kg < 0 || kg > 1000) return null;
    return { reps, loadKg: kg, loadPercent: null };
  }

  const leftDec = isDecimalToken(leftRaw);
  const rightDec = isDecimalToken(rightRaw);
  if (leftDec && !rightDec) {
    if (right < 1 || right > 100 || left < 0 || left > 1000) return null;
    return { reps: right, loadKg: left, loadPercent: null };
  }
  if (rightDec && !leftDec) {
    if (left < 1 || left > 100 || right < 0 || right > 1000) return null;
    return { reps: left, loadKg: right, loadPercent: null };
  }

  const hi = Math.max(left, right);
  const lo = Math.min(left, right);
  const weightFirst = hi >= 40 || (hi >= 20 && lo <= 12 && hi !== lo);
  if (weightFirst) {
    const kg = left > right ? left : right;
    const reps = left > right ? right : left;
    if (reps < 1 || reps > 100 || kg < 0 || kg > 1000) return null;
    return { reps, loadKg: kg, loadPercent: null };
  }

  if (left < 1 || left > 100 || right < 0 || right > 1000) return null;
  return { reps: left, loadKg: right, loadPercent: null };
}

const PAIR =
  /^(\d+(?:[.,]\d+)?)\s*(kg|%)?\s*[x×]\s*(\d+(?:[.,]\d+)?)\s*(kg|%)?$/i;

const RANGE_LEFT =
  /^(\d+)\s*[-–]\s*(\d+)\s*[x×]\s*(\d+(?:[.,]\d+)?)\s*(kg|%)?$/i;

const RANGE_RIGHT =
  /^(\d+(?:[.,]\d+)?)\s*(kg|%)?\s*[x×]\s*(\d+)\s*[-–]\s*(\d+)$/i;

const BW = /^(\d+)\s*[x×]\s*(?:bw|masa\s+ciała)$/i;
const BW_REV = /^(?:bw|masa\s+ciała)\s*[x×]\s*(\d+)$/i;

function toSet(
  reps: number,
  loadKg: number | null,
  loadPercent: number | null,
  hadKg: boolean,
): ParsedLoggedSet {
  const isBodyweight = hadKg && loadKg === 0;
  return {
    reps,
    loadKg: isBodyweight ? 0 : loadKg,
    loadPercent,
    isBodyweight,
  };
}

function parsePart(part: string, hadKgInText: boolean): ParsedLoggedSet | null {
  const bw = part.match(BW) ?? part.match(BW_REV);
  if (bw) {
    const reps = Number(bw[1]);
    if (!Number.isFinite(reps) || reps < 1 || reps > 100) return null;
    return { reps, loadKg: 0, isBodyweight: true };
  }

  const rangeLeft = part.match(RANGE_LEFT);
  if (rangeLeft) {
    const reps = Number(rangeLeft[1]);
    const repsMax = Number(rangeLeft[2]);
    const load = parseNumber(rangeLeft[3]);
    const unit = (rangeLeft[4] ?? "").toLowerCase() as "kg" | "%" | "";
    if (!Number.isFinite(reps) || reps < 1 || reps > 100) return null;
    if (!Number.isFinite(repsMax) || repsMax < reps || repsMax > 100) return null;
    if (unit === "%") {
      if (load <= 0 || load > 100) return null;
      return { reps, repsMax, loadKg: null, loadPercent: load, isBodyweight: false };
    }
    if (!Number.isFinite(load) || load < 0 || load > 1000) return null;
    return { ...toSet(reps, load, null, unit === "kg" || hadKgInText), repsMax };
  }

  const rangeRight = part.match(RANGE_RIGHT);
  if (rangeRight) {
    const load = parseNumber(rangeRight[1]);
    const unit = (rangeRight[2] ?? "").toLowerCase() as "kg" | "%" | "";
    const reps = Number(rangeRight[3]);
    const repsMax = Number(rangeRight[4]);
    if (!Number.isFinite(reps) || reps < 1 || reps > 100) return null;
    if (!Number.isFinite(repsMax) || repsMax < reps || repsMax > 100) return null;
    if (unit === "%") {
      if (load <= 0 || load > 100) return null;
      return { reps, repsMax, loadKg: null, loadPercent: load, isBodyweight: false };
    }
    if (!Number.isFinite(load) || load < 0 || load > 1000) return null;
    return { ...toSet(reps, load, null, unit === "kg" || hadKgInText), repsMax };
  }

  const pair = part.match(PAIR);
  if (!pair) return null;
  const leftRaw = pair[1];
  const leftUnit = (pair[2] ?? "").toLowerCase() as "kg" | "%" | "";
  const rightRaw = pair[3];
  const rightUnit = (pair[4] ?? "").toLowerCase() as "kg" | "%" | "";
  const unit = (leftUnit || rightUnit || null) as "kg" | "%" | null;
  const unitOn = leftUnit ? "left" : rightUnit ? "right" : null;
  const resolved = resolvePair(
    parseNumber(leftRaw),
    parseNumber(rightRaw),
    leftRaw,
    rightRaw,
    unit,
    unitOn,
  );
  if (!resolved) return null;
  return toSet(resolved.reps, resolved.loadKg, resolved.loadPercent, unit === "kg" || hadKgInText);
}

function splitSetParts(text: string): string[] {
  return text.split(SET_SEP).map((p) => p.trim()).filter(Boolean);
}

function looksLikePair(part: string): boolean {
  return (
    PAIR.test(part) ||
    RANGE_LEFT.test(part) ||
    RANGE_RIGHT.test(part) ||
    BW.test(part) ||
    BW_REV.test(part)
  );
}

/** Czy surowy string wygląda na listę serii, nie na `3x8` (serie × powt.). */
export function looksLikeRepsTimesLoadList(raw: string): boolean {
  const text = raw.trim();
  if (!text) return false;
  if (/\bkg\b/i.test(text) || /%/.test(text) || /\bbw\b/i.test(text)) return true;
  const parts = splitSetParts(text);
  if (parts.length >= 2 && parts.every(looksLikePair)) return true;
  if (RANGE_LEFT.test(text) || RANGE_RIGHT.test(text)) return true;
  if (PAIR.test(text)) {
    const parsed = parsePart(text, false);
    return parsed != null && parsed.loadKg != null && parsed.loadKg > 0;
  }
  return false;
}

/** Parsuje całą wklejkę. Zwraca null, gdy to nie jest lista serii. */
export function parseSetList(raw: string): ParsedLoggedSet[] | null {
  const text = raw.trim();
  if (!text) return null;
  if (!looksLikeRepsTimesLoadList(text)) {
    const one = parsePart(text, /\bkg\b/i.test(text));
    if (one && (one.isBodyweight || /\bkg\b/i.test(text) || one.loadPercent != null)) return [one];
    return null;
  }

  const parts = splitSetParts(text);
  const hadKg = /\bkg\b/i.test(text);
  const sets: ParsedLoggedSet[] = [];
  for (const part of parts) {
    const parsed = parsePart(part, hadKg);
    if (!parsed) return null;
    sets.push(parsed);
  }
  return sets.length > 0 ? sets : null;
}

/**
 * Wycina blok listy serii z linii composera.
 * `wyciskanie 65x5, 70x5 rir2` → rest = `wyciskanie rir2`.
 */
export function extractSetList(raw: string): { sets: ParsedLoggedSet[]; rest: string } | null {
  const text = raw.trim();
  if (!text) return null;

  const block =
    /(?:\d+(?:[.,]\d+)?\s*(?:kg|%)?\s*[x×]\s*\d+(?:[.,]\d+)?(?:\s*(?:kg|%))?)(?:\s*[,;]\s*\d+(?:[.,]\d+)?\s*(?:kg|%)?\s*[x×]\s*\d+(?:[.,]\d+)?(?:\s*(?:kg|%))?)+/i;
  const multi = text.match(block);
  if (multi && multi[0]) {
    const parsed = parseSetList(multi[0]);
    if (parsed && parsed.length >= 2) {
      const rest = (text.slice(0, multi.index ?? 0) + " " + text.slice((multi.index ?? 0) + multi[0].length))
        .replace(/\s+/g, " ")
        .trim();
      return { sets: parsed, rest };
    }
  }

  const singleKg = /\d+(?:[.,]\d+)?\s*[x×]\s*\d+(?:[.,]\d+)?\s*kg|\d+(?:[.,]\d+)?\s*kg\s*[x×]\s*\d+/i;
  const one = text.match(singleKg);
  if (one && one[0] && !block.test(text)) {
    const parsed = parseSetList(one[0]);
    if (parsed && parsed.length === 1) {
      const rest = (text.slice(0, one.index ?? 0) + " " + text.slice((one.index ?? 0) + one[0].length))
        .replace(/\s+/g, " ")
        .trim();
      return { sets: parsed, rest };
    }
  }

  return null;
}

function loadLabel(s: ParsedLoggedSet): string {
  if (s.isBodyweight || s.loadKg === 0) return "BW";
  if (s.loadPercent != null) return `${s.loadPercent}%`;
  if (s.loadKg == null) return "—";
  const kg = Number.isInteger(s.loadKg) ? String(s.loadKg) : String(s.loadKg).replace(".", ",");
  return `${kg} kg`;
}

function repsLabel(s: ParsedLoggedSet): string {
  return s.repsMax != null ? `${s.reps}–${s.repsMax}` : String(s.reps);
}

/** Format do pola wklejki: `65×5, 70×5`. */
export function formatSetList(sets: ParsedLoggedSet[]): string {
  return sets
    .map((s) => {
      if (s.isBodyweight || s.loadKg === 0) return `BW×${s.reps}`;
      if (s.loadPercent != null) return `${s.loadPercent}%×${repsLabel(s)}`;
      if (s.loadKg == null) return `—×${repsLabel(s)}`;
      const kg = Number.isInteger(s.loadKg) ? String(s.loadKg) : String(s.loadKg).replace(".", ",");
      return `${kg}×${repsLabel(s)}`;
    })
    .join(", ");
}

/** Podgląd interpretacji: `2 serie: 65 kg × 5`. */
export function formatSetListPreview(sets: ParsedLoggedSet[]): string {
  if (sets.length === 0) return "";
  const first = `${loadLabel(sets[0])} × ${repsLabel(sets[0])}`;
  const same = sets.every((s) => `${loadLabel(s)} × ${repsLabel(s)}` === first);
  if (same) {
    return sets.length === 1 ? first : `${polishSetCount(sets.length)}: ${first}`;
  }
  return sets.map((s) => `${loadLabel(s)} × ${repsLabel(s)}`).join(", ");
}

export const SET_TOKEN = /(\d+)\s*[x×]\s*(\d+(?:[.,]\d+)?)(?:\s*kg)?/gi;
