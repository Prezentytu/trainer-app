"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api, Exercise } from "@/lib/api";
import { ExerciseInput } from "@/lib/exerciseDraft";
import { createOrReuseExercise } from "@/lib/exerciseLibrary";

function sortByName(list: Exercise[]): Exercise[] {
  return [...list].sort((a, b) => a.name.localeCompare(b.name, "pl"));
}

function mergeExercise(list: Exercise[], exercise: Exercise): Exercise[] {
  const without = list.filter((e) => e.id !== exercise.id);
  return sortByName([...without, exercise]);
}

export function useExerciseLibrary() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
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
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [sync]);

  const getExerciseById = useCallback((id: number): Exercise | undefined => {
    return exercisesRef.current.find((e) => e.id === id);
  }, []);

  const createExercise = useCallback(
    async (input: ExerciseInput): Promise<{ exercise: Exercise; created: boolean }> => {
      const result = await createOrReuseExercise(input);
      sync(mergeExercise(exercisesRef.current, result.exercise));
      return result;
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
    loading,
    getExerciseById,
    createExercise,
    updateExercise,
    error,
    setError,
  };
}
