/** Polskie liczebniki rzeczownikowe dla UI (tygodnie, dni, ćwiczenia). */

function polishForm(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (n === 1) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}

function polishPlural(n: number, one: string, few: string, many: string): string {
  return `${n} ${polishForm(n, one, few, many)}`;
}

export function polishWeekCount(n: number): string {
  return polishPlural(n, "tydzień", "tygodnie", "tygodni");
}

export function polishDayCount(n: number): string {
  if (n === 1) return "1 dzień";
  return `${n} dni`;
}

export function polishExerciseCount(n: number): string {
  return polishPlural(n, "ćwiczenie", "ćwiczenia", "ćwiczeń");
}

export function polishSetCount(n: number): string {
  return polishPlural(n, "seria", "serie", "serii");
}

export function polishTrainingCount(n: number): string {
  return polishPlural(n, "trening", "treningi", "treningów");
}

export function polishRecordCount(n: number): string {
  return polishPlural(n, "rekord", "rekordy", "rekordów");
}

export function polishPhotoCount(n: number): string {
  return polishPlural(n, "zdjęcie", "zdjęcia", "zdjęć");
}

export function polishResultCount(n: number): string {
  return polishPlural(n, "wynik", "wyniki", "wyników");
}

export function polishFilmCount(n: number): string {
  return polishPlural(n, "film", "filmy", "filmów");
}

/** Sam rzeczownik do etykiet StatBlock (wartość to liczba). */
export function polishFilmLabel(n: number): string {
  return polishForm(n, "film", "filmy", "filmów");
}

/** „3 z 4 treningów" — gdy expected ≤ 0, zwraca null. */
export function formatTrainingsFraction(completed: number, expected: number): string | null {
  if (expected <= 0) return null;
  return `${completed} z ${polishTrainingCount(expected)}`;
}
