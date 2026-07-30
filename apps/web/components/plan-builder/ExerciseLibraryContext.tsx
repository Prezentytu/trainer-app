"use client";

import { createContext, useContext, ReactNode } from "react";
import { Exercise } from "@/lib/api";
import { ExerciseInput } from "@/lib/exerciseDraft";

export type NewExerciseRequest = {
  prefill: ExerciseInput;
  /** Po utworzeniu (lub reużyciu) — wywołaj z gotowym ćwiczeniem. */
  onCreated: (exercise: Exercise) => void;
  /** Tryb edycji istniejącego (toast „Popraw szczegóły”). */
  editExercise?: Exercise;
};

type ExerciseLibraryActions = {
  createExercise: (input: ExerciseInput) => Promise<{ exercise: Exercise; created: boolean }>;
  updateExercise: (id: number, input: ExerciseInput) => Promise<Exercise>;
  requestNewExercise: (req: NewExerciseRequest) => void;
};

const ExerciseLibraryContext = createContext<ExerciseLibraryActions | null>(null);

export function ExerciseLibraryProvider({
  value,
  children,
}: {
  value: ExerciseLibraryActions;
  children: ReactNode;
}) {
  return <ExerciseLibraryContext.Provider value={value}>{children}</ExerciseLibraryContext.Provider>;
}

export function useExerciseLibraryActions(): ExerciseLibraryActions {
  const ctx = useContext(ExerciseLibraryContext);
  if (!ctx) {
    throw new Error("useExerciseLibraryActions wymaga ExerciseLibraryProvider");
  }
  return ctx;
}
