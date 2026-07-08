import { Exercise } from "@/lib/api";

// Composer „szybkie wpisywanie" — parsuje jedną linię tekstu na dopasowanie ćwiczenia
// + opcjonalne nadpisania parametrów. Patrz .ai/specs/2026-07-08-quick-entry-composer.md.

export type ParsedQuickEntry = {
  query: string; // pozostały fragment nazwy do dopasowania
  supersetPrefix: { group: string; letter: string } | null; // "0a" -> { group: "0", letter: "a" }
  sets: number | null;
  reps: number | null;
  repsMax: number | null;
  tempo: string | null;
  targetRir: number | null;
};

function cut(text: string, match: RegExpMatchArray): string {
  const start = match.index ?? 0;
  return (text.slice(0, start) + " " + text.slice(start + match[0].length)).trim();
}

/**
 * Parsuje jedną linię composera: `{fragment nazwy} [SxR[-Rmax]] [tempo] [rirN]`, tokeny w
 * dowolnej kolejności po nazwie, wszystkie opcjonalne. Token nierozpoznany trafia do `query`
 * (literówka nie blokuje dodania pozycji).
 */
export function parseQuickEntry(raw: string): ParsedQuickEntry {
  let text = raw;
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
  let reps: number | null = null;
  let repsMax: number | null = null;
  const setsRepsMatch = text.match(/\b(\d+)\s*[xX]\s*(\d+)(?:-(\d+))?\b/);
  if (setsRepsMatch) {
    sets = Number(setsRepsMatch[1]);
    reps = Number(setsRepsMatch[2]);
    repsMax = setsRepsMatch[3] ? Number(setsRepsMatch[3]) : null;
    text = cut(text, setsRepsMatch);
  }

  let tempo: string | null = null;
  const tempoMatch = text.match(/\b([0-9][0-9Xx]{3}|[0-9Xx]{3}[0-9])\b/);
  if (tempoMatch) {
    tempo = tempoMatch[1].toUpperCase();
    text = cut(text, tempoMatch);
  }

  const query = text.replace(/\s+/g, " ").trim();

  return { query, supersetPrefix, sets, reps, repsMax, tempo, targetRir };
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
