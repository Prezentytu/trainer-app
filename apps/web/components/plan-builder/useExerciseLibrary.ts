"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api, Exercise } from "@/lib/api";
import { ExerciseInput } from "@/lib/exerciseDraft";

function sortByName(list: Exercise[]): Exercise[] {
  return [...list].sort((a, b) => a.name.localeCompare(b.name, "pl"));
}

function mergeExercise(list: Exercise[], exercise: Exercise): Exercise[] {
  const without = list.filter((e) => e.id !== exercise.id);
  return sortByName([...without, exercise]);
}

export function useExerciseLibrary() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [error, setError] = useState<string | null>(null);
  const exercisesRef = useRef<Exercise[]>([]);

  const sync = useCallback((next: Exercise[]) => {
    exercisesRef.current = next;
    setExercises(next);
  }, []);

  useEffect(() => {
    api.exercises
      .list()
      .then(sync)
      .catch((e: Error) => setError(e.message));
  }, [sync]);

  const getExerciseById = useCallback((id: number): Exercise | undefined => {
    return exercisesRef.current.find((e) => e.id === id);
  }, []);

  const createExercise = useCallback(
    async (input: ExerciseInput): Promise<{ exercise: Exercise; created: boolean }> => {
      try {
        const created = await api.exercises.create(input);
        sync(mergeExercise(exercisesRef.current, created));
        return { exercise: created, created: true };
      } catch (err) {
        const list = await api.exercises.list().catch(() => null);
        if (list) {
          sync(list);
          const existing = list.find(
            (e) => e.name.toLowerCase() === input.name.trim().toLowerCase()
          );
          if (existing) return { exercise: existing, created: false };
        }
        throw err;
      }
    },
    [sync]
  );

  const updateExercise = useCallback(
    async (id: number, input: ExerciseInput): Promise<Exercise> => {
      const updated = await api.exercises.update(id, input);
      sync(mergeExercise(exercisesRef.current, updated));
      return updated;
    },
    [sync]
  );

  return {
    exercises,
    getExerciseById,
    createExercise,
    updateExercise,
    error,
    setError,
  };
}
