import { Exercise } from "@/lib/api";

const STORAGE_KEY = "trainer-app:recent-exercises:v1";
const LIMIT = 30;

export function readRecentExerciseIds(): number[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id): id is number => typeof id === "number" && Number.isFinite(id));
  } catch {
    return [];
  }
}

export function rememberExercise(id: number): number[] {
  const next = [id, ...readRecentExerciseIds().filter((x) => x !== id)].slice(0, LIMIT);
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }
  return next;
}

export function sortExercisesByRecent(exercises: Exercise[], recentIds: number[]): Exercise[] {
  const rank = (id: number) => {
    const i = recentIds.indexOf(id);
    return i === -1 ? 999 : i;
  };
  return [...exercises].sort(
    (a, b) => rank(a.id) - rank(b.id) || a.name.localeCompare(b.name, "pl"),
  );
}