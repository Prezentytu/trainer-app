import { api, Exercise } from "@/lib/api";
import { ExerciseInput } from "@/lib/exerciseDraft";

/** Tworzy ćwiczenie; przy konflikcie 409 (już w bibliotece) zwraca istniejące. */
export async function createOrReuseExercise(
  input: ExerciseInput
): Promise<{ exercise: Exercise; created: boolean }> {
  try {
    const created = await api.exercises.create(input);
    return { exercise: created, created: true };
  } catch (err) {
    const list = await api.exercises.list().catch(() => null);
    if (list) {
      const existing = list.find(
        (e) => e.name.toLowerCase() === input.name.trim().toLowerCase()
      );
      if (existing) return { exercise: existing, created: false };
    }
    throw err;
  }
}
