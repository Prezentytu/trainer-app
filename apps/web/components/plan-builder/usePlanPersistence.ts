"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api, Plan, PlanInput } from "@/lib/api";
import { computeGroupsFromLinks } from "@/lib/supersets";
import { BuilderDay } from "./types";

export function buildPlanInput(
  name: string,
  description: string,
  isTemplate: boolean,
  days: BuilderDay[]
): PlanInput {
  return {
    name: name.trim(),
    description: description.trim() || null,
    isTemplate,
    days: days.map((d) => {
      const groups = computeGroupsFromLinks(d.items.map((i) => i.linkedToNext));
      return {
        weekNumber: d.weekNumber,
        order: d.order,
        label: d.label.trim() || `Dzień ${d.order}`,
        notes: d.notes?.trim() || null,
        items: d.items.map((it, idx) => ({
          exerciseId: it.exerciseId,
          order: idx + 1,
          supersetGroup: groups[idx],
          isWarmup: it.isWarmup,
          // null gdy równe typowi biblioteki — dziedziczenie przy zapisie
          measureType: it.measureType === it.exerciseType ? null : it.measureType,
          sets: it.sets,
          reps: it.reps,
          repsMax: it.repsMax,
          repDurationSeconds: it.repDurationSeconds,
          repDurationSecondsMax: it.repDurationSecondsMax,
          distanceMeters: it.distanceMeters,
          tempo: it.tempo?.trim() || null,
          targetRpe: it.targetRpe,
          targetRir: it.targetRir,
          setScheme: it.setScheme?.trim() || null,
          restBetweenSetsSeconds: it.restBetweenSetsSeconds,
          restAfterExerciseSeconds: it.restAfterExerciseSeconds,
          loadKg: it.loadKg,
          loadPercent: it.loadPercent,
          notes: it.notes?.trim() || null,
          prescribedSets: it.prescribedSets.map((s, sidx) => ({
            order: sidx + 1,
            reps: s.reps,
            repsMax: s.repsMax,
            durationSeconds: s.durationSeconds,
            distanceMeters: s.distanceMeters,
            loadKg: s.loadKg,
            loadPercent: s.loadPercent,
            percentOf: s.percentOf,
            targetRpe: s.targetRpe,
            targetRir: s.targetRir,
            tempo: s.tempo?.trim() || null,
            role: s.role,
            note: s.note?.trim() || null,
          })),
        })),
      };
    }),
  };
}

export function usePlanPersistence({
  plan,
  name,
  description,
  isTemplate,
  days,
}: {
  plan?: Plan;
  name: string;
  description: string;
  isTemplate: boolean;
  days: BuilderDay[];
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  /** Snapshot ostatnio wysłanego payloadu — pomija PUT gdy treść się nie zmieniła. */
  const lastSavedPayloadRef = useRef<string | null>(null);

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      const totalItems = days.reduce((sum, d) => sum + d.items.length, 0);
      if (totalItems === 0) {
        setError("Dodaj przynajmniej jedno ćwiczenie do planu.");
        return;
      }
      setSaving(true);
      setError(null);
      const input = buildPlanInput(name, description, isTemplate, days);
      try {
        if (plan) {
          await api.plans.update(plan.id, input);
          lastSavedPayloadRef.current = JSON.stringify(input);
          router.push(`/plans/${plan.id}`);
        } else {
          const created = await api.plans.create(input);
          lastSavedPayloadRef.current = JSON.stringify(input);
          router.push(`/plans/${created.id}`);
        }
        router.refresh();
      } catch (err) {
        setError((err as Error).message);
        setSaving(false);
      }
    },
    [days, description, isTemplate, name, plan, router]
  );

  useEffect(() => {
    if (!plan) return;
    const totalItems = days.reduce((sum, d) => sum + d.items.length, 0);
    if (totalItems === 0 || !name.trim()) return;
    const input = buildPlanInput(name, description, isTemplate, days);
    const payload = JSON.stringify(input);
    if (payload === lastSavedPayloadRef.current) return;
    const timer = setTimeout(() => {
      api.plans
        .update(plan.id, input)
        .then(() => {
          lastSavedPayloadRef.current = payload;
          setLastSavedAt(new Date());
        })
        .catch(() => {
          /* ciche fail — manualny zapis zostaje fallbackiem */
        });
    }, 2000);
    return () => clearTimeout(timer);
  }, [plan, name, description, isTemplate, days]);

  return { saving, error, setError, lastSavedAt, handleSubmit };
}
