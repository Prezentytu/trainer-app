/** Dzieli „Polska nazwa (English Name)” na dwie części. Nawias z samymi cyframi zostaje w nazwie. */
export function splitExerciseName(name: string): { primary: string; secondary: string | null } {
  const trimmed = name.trim();
  const m = trimmed.match(/^(.*)\s+\(([^)]*[A-Za-zÀ-žĄąĆćĘęŁłŃńÓóŚśŹźŻż][^)]*)\)\s*$/);
  if (!m) return { primary: trimmed, secondary: null };
  const primary = m[1].trim();
  const secondary = m[2].trim();
  if (!primary || !secondary) return { primary: trimmed, secondary: null };
  return { primary, secondary };
}

export function clientExerciseName(name: string): string {
  return splitExerciseName(name).primary;
}
