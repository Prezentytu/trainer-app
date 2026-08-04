import {
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  EQUIPMENT_LABELS,
  Exercise,
  ExerciseCategory,
  ExercisePattern,
  ExerciseType,
  EXERCISE_TYPE_LABELS,
  PATTERN_LABELS,
} from "@/lib/api";

/** Usuwa diakrytyki (ł→l, ą→a) i sprowadza do lower-case. `ł` nie rozpada się w NFD. */
export function foldDiacritics(value: string): string {
  return value
    .replace(/ł/g, "l")
    .replace(/Ł/g, "L")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase();
}

export type ExerciseFilters = {
  query: string;
  category: ExerciseCategory | "all";
  equipment: string | "all";
  pattern: string | "all";
  typeFilter: ExerciseType | "all";
  onlyVideo: boolean;
  unilateralOnly: boolean;
};

function matchesQuery(ex: Exercise, foldedQuery: string): boolean {
  if (!foldedQuery) return true;
  const haystacks: string[] = [ex.name];
  if (ex.category && ex.category in CATEGORY_LABELS) {
    haystacks.push(CATEGORY_LABELS[ex.category as ExerciseCategory]);
  }
  for (const eq of ex.equipment ?? []) {
    haystacks.push(EQUIPMENT_LABELS[eq] ?? eq);
    haystacks.push(eq);
  }
  for (const m of ex.primaryMuscles ?? []) {
    haystacks.push(m);
  }
  if (ex.pattern && ex.pattern in PATTERN_LABELS) {
    haystacks.push(PATTERN_LABELS[ex.pattern as ExercisePattern]);
  }
  return haystacks.some((h) => foldDiacritics(h).includes(foldedQuery));
}

function matchesFilters(ex: Exercise, filters: ExerciseFilters, skip: (keyof ExerciseFilters)[] = []): boolean {
  const folded = foldDiacritics(filters.query.trim());
  if (!skip.includes("query") && !matchesQuery(ex, folded)) return false;
  if (!skip.includes("category") && filters.category !== "all" && ex.category !== filters.category) return false;
  if (
    !skip.includes("equipment") &&
    filters.equipment !== "all" &&
    !(ex.equipment ?? []).includes(filters.equipment)
  ) {
    return false;
  }
  if (!skip.includes("pattern") && filters.pattern !== "all" && ex.pattern !== filters.pattern) return false;
  if (!skip.includes("typeFilter") && filters.typeFilter !== "all" && ex.type !== filters.typeFilter) return false;
  if (!skip.includes("onlyVideo") && filters.onlyVideo && !(ex.media?.length > 0)) return false;
  if (!skip.includes("unilateralOnly") && filters.unilateralOnly && !ex.isUnilateral) return false;
  return true;
}

export function filterExercisesLibrary(exercises: Exercise[], filters: ExerciseFilters): Exercise[] {
  return exercises.filter((ex) => matchesFilters(ex, filters));
}

/** Liczniki fasetowe: dana opcja uwzględnia pozostałe aktywne filtry (bez własnego wymiaru). */
export function facetCounts(exercises: Exercise[], filters: ExerciseFilters) {
  const baseWithoutCategory = exercises.filter((ex) => matchesFilters(ex, filters, ["category"]));
  const category: Record<string, number> = { all: baseWithoutCategory.length };
  for (const c of CATEGORY_ORDER) category[c] = 0;
  for (const ex of baseWithoutCategory) {
    if (ex.category && ex.category in category) category[ex.category] += 1;
  }

  const baseWithoutEquipment = exercises.filter((ex) => matchesFilters(ex, filters, ["equipment"]));
  const equipment = new Map<string, number>();
  for (const ex of baseWithoutEquipment) {
    for (const eq of ex.equipment ?? []) {
      equipment.set(eq, (equipment.get(eq) ?? 0) + 1);
    }
  }

  const baseWithoutPattern = exercises.filter((ex) => matchesFilters(ex, filters, ["pattern"]));
  const pattern = new Map<string, number>();
  for (const ex of baseWithoutPattern) {
    if (ex.pattern) pattern.set(ex.pattern, (pattern.get(ex.pattern) ?? 0) + 1);
  }

  const baseWithoutType = exercises.filter((ex) => matchesFilters(ex, filters, ["typeFilter"]));
  const type: Record<ExerciseType, number> = { reps: 0, time: 0, distance: 0 };
  for (const ex of baseWithoutType) {
    if (ex.type in type) type[ex.type] += 1;
  }

  const baseWithoutVideo = exercises.filter((ex) => matchesFilters(ex, filters, ["onlyVideo"]));
  const withVideo = baseWithoutVideo.filter((e) => e.media?.length > 0).length;

  const baseWithoutUnilateral = exercises.filter((ex) => matchesFilters(ex, filters, ["unilateralOnly"]));
  const unilateral = baseWithoutUnilateral.filter((e) => e.isUnilateral).length;

  return {
    category,
    equipment: [...equipment.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])),
    pattern: [...pattern.entries()].sort((a, b) => b[1] - a[1]),
    type,
    withVideo,
    unilateral,
  };
}

export function hasActiveFilters(filters: ExerciseFilters): boolean {
  return (
    filters.category !== "all" ||
    filters.equipment !== "all" ||
    filters.pattern !== "all" ||
    filters.typeFilter !== "all" ||
    filters.onlyVideo ||
    filters.unilateralOnly ||
    filters.query.trim().length > 0
  );
}

/** Licznik filtrów w panelu „Filtry” (bez partii i zapytania — te są zawsze widoczne). */
export function advancedFilterCount(filters: ExerciseFilters): number {
  let n = 0;
  if (filters.equipment !== "all") n += 1;
  if (filters.pattern !== "all") n += 1;
  if (filters.typeFilter !== "all") n += 1;
  if (filters.onlyVideo) n += 1;
  if (filters.unilateralOnly) n += 1;
  return n;
}

export { polishExerciseCount } from "@/lib/plural";

export function polishPartCount(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (n === 1) return "1 partia";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${n} partie`;
  return `${n} partii`;
}

export function equipmentLabel(eq: string): string {
  return EQUIPMENT_LABELS[eq] ?? eq;
}

export function patternLabel(p: string): string {
  return PATTERN_LABELS[p as ExercisePattern] ?? p;
}

export function typeLabel(t: ExerciseType): string {
  return EXERCISE_TYPE_LABELS[t];
}
