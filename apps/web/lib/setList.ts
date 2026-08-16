/** Parser serii z kartki / dziennika PL: `8 x 30kg, 8 x 35kg` = powtórzenia × ciężar na serię. */

export type ParsedLoggedSet = {
  reps: number;
  repsMax?: number | null;
  loadKg: number | null;
  loadPercent?: number | null;
  isBodyweight: boolean;
};

const SET_TOKEN =
  /(\d+)\s*[x×]\s*(\d+(?:[.,]\d+)?)(?:\s*kg)?/gi;

const SET_TOKEN_ANCHORED =
  /^(\d+)\s*[x×]\s*(\d+(?:[.,]\d+)?)(?:\s*kg)?$/i;

const SET_RANGE_ANCHORED =
  /^(\d+)\s*[-–]\s*(\d+)\s*[x×]\s*(\d+(?:[.,]\d+)?)(?:\s*(kg|%))?$/i;

const SET_PERCENT_ANCHORED = /^(\d+)\s*[x×]\s*(\d+(?:[.,]\d+)?)\s*%$/i;

const SET_BW_ANCHORED = /^(\d+)\s*[x×]\s*(?:bw|masa\s+ciała)$/i;

const SET_SEP = /\s*[,;·]\s*/;

function parseNumber(raw: string): number {
  return Number(raw.replace(",", "."));
}

function toSet(reps: number, load: number, hadKg: boolean): ParsedLoggedSet {
  const isBodyweight = hadKg && load === 0;
  return {
    reps,
    loadKg: isBodyweight ? 0 : load,
    isBodyweight,
  };
}

function parsePart(part: string, hadKgInText: boolean): ParsedLoggedSet | null {
  const bw = part.match(SET_BW_ANCHORED);
  if (bw) {
    const reps = Number(bw[1]);
    if (!Number.isFinite(reps) || reps < 1 || reps > 100) return null;
    return { reps, loadKg: 0, isBodyweight: true };
  }
  const pct = part.match(SET_PERCENT_ANCHORED);
  if (pct) {
    const reps = Number(pct[1]);
    const loadPercent = parseNumber(pct[2]);
    if (!Number.isFinite(reps) || reps < 1 || reps > 100) return null;
    if (!Number.isFinite(loadPercent) || loadPercent <= 0 || loadPercent > 100) return null;
    return { reps, loadKg: null, loadPercent, isBodyweight: false };
  }
  const range = part.match(SET_RANGE_ANCHORED);
  if (range) {
    const reps = Number(range[1]);
    const repsMax = Number(range[2]);
    const load = parseNumber(range[3]);
    const unit = (range[4] ?? "").toLowerCase();
    if (!Number.isFinite(reps) || reps < 1 || reps > 100) return null;
    if (!Number.isFinite(repsMax) || repsMax < reps || repsMax > 100) return null;
    if (unit === "%") {
      if (!Number.isFinite(load) || load <= 0 || load > 100) return null;
      return { reps, repsMax, loadKg: null, loadPercent: load, isBodyweight: false };
    }
    if (!Number.isFinite(load) || load < 0 || load > 1000) return null;
    return { ...toSet(reps, load, unit === "kg" || hadKgInText), repsMax };
  }
  const m = part.match(SET_TOKEN_ANCHORED);
  if (!m) return null;
  const reps = Number(m[1]);
  const load = parseNumber(m[2]);
  if (!Number.isFinite(reps) || reps < 1 || reps > 100) return null;
  if (!Number.isFinite(load) || load < 0 || load > 1000) return null;
  return toSet(reps, load, /\bkg\b/i.test(part) || hadKgInText);
}

function splitSetParts(text: string): string[] {
  return text.split(SET_SEP).map((p) => p.trim()).filter(Boolean);
}

/** Czy surowy string wygląda na listę serii `powt. × kg`, nie na `3x8` (serie × powt.). */
export function looksLikeRepsTimesLoadList(raw: string): boolean {
  const text = raw.trim();
  if (!text) return false;
  if (/\bkg\b/i.test(text)) return true;
  if (SET_BW_ANCHORED.test(text)) return true;
  const parts = splitSetParts(text);
  if (
    parts.length >= 2 &&
    parts.every(
      (p) =>
        SET_TOKEN_ANCHORED.test(p) ||
        SET_BW_ANCHORED.test(p) ||
        SET_RANGE_ANCHORED.test(p) ||
        SET_PERCENT_ANCHORED.test(p),
    )
  ) {
    return true;
  }
  if (SET_RANGE_ANCHORED.test(text) || SET_PERCENT_ANCHORED.test(text)) return true;
  return false;
}

/** Parsuje całą wklejkę. Zwraca null, gdy to nie jest lista serii `powt. × kg`. */
export function parseSetList(raw: string): ParsedLoggedSet[] | null {
  const text = raw.trim();
  if (!text) return null;
  if (!looksLikeRepsTimesLoadList(text)) {
    // Pojedynczy token z kg: `8x30kg`
    const one = parsePart(text, /\bkg\b/i.test(text));
    if (one && (one.isBodyweight || /\bkg\b/i.test(text))) return [one];
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
 * `wyciskanie 8x30kg, 8x35kg rir2` → rest = `wyciskanie rir2`.
 */
export function extractSetList(raw: string): { sets: ParsedLoggedSet[]; rest: string } | null {
  const text = raw.trim();
  if (!text) return null;

  const block =
    /(?:\d+\s*[x×]\s*\d+(?:[.,]\d+)?(?:\s*kg)?)(?:\s*[,;]\s*\d+\s*[x×]\s*\d+(?:[.,]\d+)?(?:\s*kg)?)+/i;
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

  const singleKg = /\d+\s*[x×]\s*\d+(?:[.,]\d+)?\s*kg/i;
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

/** Format do pola wklejki: `8×30, 8×35`. */
export function formatSetList(sets: ParsedLoggedSet[]): string {
  return sets
    .map((s) => {
      if (s.isBodyweight || s.loadKg === 0) return `${s.reps}×BW`;
      if (s.loadKg == null) return `${s.reps}×—`;
      const kg = Number.isInteger(s.loadKg) ? String(s.loadKg) : String(s.loadKg).replace(".", ",");
      return `${s.reps}×${kg}`;
    })
    .join(", ");
}

export { SET_TOKEN };
