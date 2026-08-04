/** Polskie liczebniki rzeczownikowe dla UI (tygodnie, dni, ćwiczenia). */

function polishPlural(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (n === 1) return `1 ${one}`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${n} ${few}`;
  return `${n} ${many}`;
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
