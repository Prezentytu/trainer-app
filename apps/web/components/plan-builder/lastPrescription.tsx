"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { LastPrescription } from "@/lib/api";
import { BuilderItem, BuilderSet, newKey } from "./types";

export function formatLastPrescriptionLabel(last: LastPrescription): string {
  const scheme = last.label;
  if (!last.performedOn) return `jak ostatnio: ${scheme}`;
  const d = new Date(`${last.performedOn}T12:00:00`);
  if (Number.isNaN(d.getTime())) return `jak ostatnio: ${scheme}`;
  const day = d.getDate();
  const mon = d.toLocaleDateString("pl-PL", { month: "short" }).replace(".", "");
  return `jak ${day} ${mon}: ${scheme}`;
}

export function lastPrescriptionOverrides(
  last: LastPrescription | undefined,
  overrides?: Partial<BuilderItem>,
): Partial<BuilderItem> | null {
  if (!last || last.sets.length === 0) return null;
  if (
    overrides?.prescribedSets != null ||
    overrides?.sets != null ||
    overrides?.reps != null ||
    overrides?.loadKg != null ||
    overrides?.setScheme != null
  ) {
    return null;
  }
  const prescribedSets: BuilderSet[] = last.sets.map((s, i) => ({
    key: newKey(),
    order: i + 1,
    reps: s.reps,
    repsMax: s.repsMax,
    durationSeconds: null,
    distanceMeters: null,
    loadKg: s.loadKg,
    loadPercent: null,
    percentOf: null,
    targetRpe: null,
    targetRir: null,
    tempo: null,
    role: "work",
    note: null,
    restSeconds: null,
  }));
  const reps = prescribedSets.map((s) => s.reps);
  const sameReps = reps.every((r) => r === reps[0]);
  const loads = prescribedSets.map((s) => s.loadKg);
  const sameLoad = loads.every((l) => l === loads[0]);
  const numericReps = reps.filter((r): r is number => r != null);
  return {
    prescribedSets,
    sets: prescribedSets.length,
    reps: sameReps ? reps[0] : numericReps.length > 0 ? Math.min(...numericReps) : null,
    repsMax: sameReps ? (prescribedSets[0].repsMax ?? null) : null,
    loadKg: sameLoad ? loads[0] : null,
    lastPrescriptionLabel: formatLastPrescriptionLabel(last),
  };
}

export function libraryDefaults(item: Pick<BuilderItem, "exerciseType">, exercise: {
  defaultSets: number;
  defaultReps: number | null;
  defaultRepDurationSeconds: number | null;
  defaultDistanceMeters: number | null;
  defaultLoadKg: number | null;
}): Partial<BuilderItem> {
  return {
    sets: exercise.defaultSets,
    reps: item.exerciseType === "reps" ? exercise.defaultReps : null,
    repsMax: null,
    loadKg: exercise.defaultLoadKg,
    prescribedSets: [],
    lastPrescriptionLabel: null,
  };
}

const LastPrescriptionContext = createContext<{
  get: (exerciseId: number) => LastPrescription | undefined;
}>({ get: () => undefined });

export function LastPrescriptionProvider({
  value,
  children,
}: {
  value: { get: (exerciseId: number) => LastPrescription | undefined };
  children: ReactNode;
}) {
  return (
    <LastPrescriptionContext.Provider value={value}>{children}</LastPrescriptionContext.Provider>
  );
}

export function useLastPrescription() {
  return useContext(LastPrescriptionContext);
}
