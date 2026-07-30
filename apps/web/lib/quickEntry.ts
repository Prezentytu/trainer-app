import { Exercise, ExerciseType } from "@/lib/api";

// Composer „szybkie wpisywanie" — parsuje jedną linię tekstu na dopasowanie ćwiczenia
// + opcjonalne nadpisania parametrów. Patrz .ai/specs/2026-07-29-composer-units-and-help.md.

export type ParsedQuickEntry = {
  query: string; // pozostały fragment nazwy do dopasowania
  supersetPrefix: { group: string; letter: string } | null; // "0a" -> { group: "0", letter: "a" }
  sets: number | null;
  /** null = jednostka ćwiczenia / pozycji */
  measure: ExerciseType | null;
  /** powtórzenia | sekundy | metry */
  value: number | null;
  valueMax: number | null;
  tempo: string | null;
  targetRir: number | null;
};

function cut(text: string, match: RegExpMatchArray): string {
  const start = match.index ?? 0;
  return (text.slice(0, start) + " " + text.slice(start + match[0].length)).trim();
}

/** Normalizuje „3 serie po 30s" → „3x30s" przed tokenizacją. */
function normalizeSetsPhrase(text: string): string {
  return text.replace(
    /\b(\d+)\s*(?:x|×|ser(?:ia|ie|ii|y))\s*(?:po\s*)?(?=\d)/gi,
    "$1x"
  );
}

type UnitKind = "time" | "distance";

/** min|minut… przed m|metr… — inaczej „2min" = 2 metry. */
function parseUnit(unitRaw: string): { kind: UnitKind; scale: number } | null {
  // Usuń znaki diakrytyczne bez \p{M} (szersza kompatybilność targetu TS)
  const u = unitRaw
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  if (/^(s|sek|sekund[ay]?)$/.test(u)) return { kind: "time", scale: 1 };
  if (/^(min|minut[ay]?)$/.test(u)) return { kind: "time", scale: 60 };
  if (/^(km|kilometr[oyw]?)$/.test(u)) return { kind: "distance", scale: 1000 };
  if (/^(m|metr[oyw]?)$/.test(u)) return { kind: "distance", scale: 1 };
  return null;
}

/**
 * Parsuje jedną linię composera: `{fragment nazwy} [SxR[-Rmax][jednostka]] [tempo] [rirN]`.
 * Token z jednostką przed SxR bez jednostki. Token nierozpoznany trafia do `query`.
 */
export function parseQuickEntry(raw: string): ParsedQuickEntry {
  let text = normalizeSetsPhrase(raw);
  let supersetPrefix: ParsedQuickEntry["supersetPrefix"] = null;

  const prefixMatch = text.match(/^\s*(\d+)([a-zA-Z])(?=\s|$)/);
  if (prefixMatch) {
    supersetPrefix = { group: prefixMatch[1], letter: prefixMatch[2].toLowerCase() };
    text = text.slice(prefixMatch[0].length);
  }

  let targetRir: number | null = null;
  const rirMatch = text.match(/\brir\s*(\d+(?:\.\d+)?)\b/i);
  if (rirMatch) {
    targetRir = Number(rirMatch[1]);
    text = cut(text, rirMatch);
  }

  let sets: number | null = null;
  let measure: ExerciseType | null = null;
  let value: number | null = null;
  let valueMax: number | null = null;

  // Token z jednostką: [Sx]V[-Vmax]unit — min przed m
  const unitToken =
    /\b(?:(\d+)\s*[xX×]\s*)?(\d+(?:\.\d+)?)(?:\s*[-–]\s*(\d+(?:\.\d+)?))?\s*(s|sek(?:und[ay]?)?|min(?:ut[ay]?)?|km|kilometr[oyw]?|m|metr[oyw]?)\b/i;
  const unitMatch = text.match(unitToken);
  if (unitMatch) {
    const unit = parseUnit(unitMatch[4]);
    if (unit) {
      if (unitMatch[1]) sets = Number(unitMatch[1]);
      const v = Number(unitMatch[2]);
      const vmax = unitMatch[3] ? Number(unitMatch[3]) : null;
      if (Number.isFinite(v)) {
        measure = unit.kind;
        value = Math.round(v * unit.scale);
        valueMax = vmax != null && Number.isFinite(vmax) ? Math.round(vmax * unit.scale) : null;
        text = cut(text, unitMatch);
      }
    }
  }

  // mm:ss jako czas (z lub bez serii): 3x1:30 / 1:30
  if (measure == null) {
    const clockMatch = text.match(/\b(?:(\d+)\s*[xX×]\s*)?(\d+):(\d{1,2})(?:\s*[-–]\s*(\d+):(\d{1,2}))?\b/);
    if (clockMatch) {
      if (clockMatch[1]) sets = Number(clockMatch[1]);
      measure = "time";
      value = Number(clockMatch[2]) * 60 + Number(clockMatch[3]);
      if (clockMatch[4] != null) {
        valueMax = Number(clockMatch[4]) * 60 + Number(clockMatch[5]);
      }
      text = cut(text, clockMatch);
    }
  }

  // SxR bez jednostki (tylko gdy nie złapano tokenu z jednostką / czasem)
  if (measure == null) {
    const setsRepsMatch = text.match(/\b(\d+)\s*[xX×]\s*(\d+)(?:-(\d+))?\b/);
    if (setsRepsMatch) {
      sets = Number(setsRepsMatch[1]);
      value = Number(setsRepsMatch[2]);
      valueMax = setsRepsMatch[3] ? Number(setsRepsMatch[3]) : null;
      text = cut(text, setsRepsMatch);
    }
  }

  let tempo: string | null = null;
  const tempoMatch = text.match(/\b([0-9][0-9Xx]{3}|[0-9Xx]{3}[0-9])\b/);
  if (tempoMatch) {
    tempo = tempoMatch[1].toUpperCase();
    text = cut(text, tempoMatch);
  }

  const query = text.replace(/\s+/g, " ").trim();

  return { query, supersetPrefix, sets, measure, value, valueMax, tempo, targetRir };
}

/**
 * Filtruje ćwiczenia case-insensitive `includes`, bez limitu ani rankingu — jedyne źródło prawdy
 * dla dopasowania, używane też przez `ExercisePicker` (tryb „przeglądaj listę").
 */
export function filterExercises(query: string, exercises: Exercise[]): Exercise[] {
  const q = query.trim().toLowerCase();
  if (!q) return exercises;
  return exercises.filter((e) => e.name.toLowerCase().includes(q));
}

/**
 * Dopasowuje ćwiczenia do zapytania dla dropdownu composera: `filterExercises` + priorytet dla
 * dopasowania prefiksu nazwy, potem najkrótsza nazwa, maks. 6 wyników.
 */
export function matchExercises(query: string, exercises: Exercise[]): Exercise[] {
  const q = query.trim().toLowerCase();
  if (!q) return exercises.slice(0, 6);
  return filterExercises(query, exercises)
    .map((e) => {
      const name = e.name.toLowerCase();
      return { exercise: e, prefixRank: name.startsWith(q) ? 0 : 1, length: name.length };
    })
    .sort((a, b) => a.prefixRank - b.prefixRank || a.length - b.length)
    .slice(0, 6)
    .map((m) => m.exercise);
}
