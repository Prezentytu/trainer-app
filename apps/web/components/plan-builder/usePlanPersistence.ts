"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api, Plan, PlanInput, PlanSaveIds } from "@/lib/api";
import { sanitizeSetScheme } from "@/lib/schemeSummary";
import { clearImportHandoff } from "@/lib/planImportHandoff";
import { refreshNavCounts } from "@/lib/navCounts";
import { computeGroupsFromLinks } from "@/lib/supersets";
import { compactDayOrders, normalizeWeeks } from "./builderMove";
import { stripDuplicateEntityIds } from "./planSaveMap";
import { BuilderDay } from "./types";

const SAVE_TIMEOUT_MS = 30_000;
const SAVE_TIMEOUT_MESSAGE = "Zapis trwał zbyt długo. Sprawdź sieć i spróbuj ponownie.";

export function snapshotDaysForSave(days: BuilderDay[]): BuilderDay[] {
  return stripDuplicateEntityIds(compactDayOrders(normalizeWeeks(days)));
}

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
    days: snapshotDaysForSave(days).map((d) => {
      const groups = computeGroupsFromLinks(d.items.map((i) => i.linkedToNext));
      return {
        id: d.entityId,
        weekNumber: d.weekNumber,
        order: d.order,
        label: d.label.trim() || `Dzień ${d.order}`,
        notes: d.notes?.trim() || null,
        dayOfWeek: d.dayOfWeek,
        items: d.items.map((it, idx) => ({
          id: it.entityId,
          exerciseId: it.exerciseId,
          order: idx + 1,
          supersetGroup: groups[idx],
          isWarmup: it.isWarmup,
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
          setScheme: sanitizeSetScheme(it.setScheme),
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
            restSeconds: s.restSeconds ?? null,
          })),
        })),
      };
    }),
  };
}

function isAbortError(err: unknown): boolean {
  return err instanceof DOMException
    ? err.name === "AbortError"
    : err instanceof Error && err.name === "AbortError";
}

function withTimeout<T>(promise: Promise<T>, abort: AbortController): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => {
      abort.abort();
      reject(new Error(SAVE_TIMEOUT_MESSAGE));
    }, SAVE_TIMEOUT_MS);
    promise.then(
      (value) => {
        window.clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        window.clearTimeout(timer);
        reject(err);
      },
    );
  });
}

export function usePlanPersistence({
  plan,
  name,
  description,
  isTemplate,
  days,
  assignTo,
  onSavedIds,
}: {
  plan?: Plan;
  name: string;
  description: string;
  isTemplate: boolean;
  days: BuilderDay[];
  assignTo?: { id: number; name: string };
  onSavedIds?: (saved: PlanSaveIds, snapshot: BuilderDay[]) => void;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autosaveFailed, setAutosaveFailed] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const lastSavedPayloadRef = useRef<string | null>(null);
  const seededRef = useRef(false);
  const inFlightRef = useRef(false);
  const genRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!plan || seededRef.current) return;
    lastSavedPayloadRef.current = JSON.stringify(
      buildPlanInput(name, description, isTemplate, days),
    );
    seededRef.current = true;
    setIsDirty(false);
  }, [plan, name, description, isTemplate, days]);

  useEffect(() => {
    const payload = JSON.stringify(buildPlanInput(name, description, isTemplate, days));
    if (lastSavedPayloadRef.current == null) {
      setIsDirty(Boolean(plan) || name.trim().length > 0 || days.some((d) => d.items.length > 0));
      return;
    }
    setIsDirty(payload !== lastSavedPayloadRef.current);
  }, [plan, name, description, isTemplate, days]);

  useEffect(() => {
    if (!isDirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isDirty]);

  const saveExisting = useCallback(
    async (manual: boolean) => {
      if (!plan) return;
      if (inFlightRef.current && !manual) return;
      abortRef.current?.abort();
      const abort = new AbortController();
      abortRef.current = abort;
      const gen = ++genRef.current;
      inFlightRef.current = true;
      if (manual) {
        setSaving(true);
        setError(null);
      }
      const snapshot = snapshotDaysForSave(days);
      const input = buildPlanInput(name, description, isTemplate, days);
      try {
        const saved = await withTimeout(
          api.plans.update(plan.id, input, { signal: abort.signal }),
          abort,
        );
        if (gen !== genRef.current) return;
        onSavedIds?.(saved, snapshot);
        lastSavedPayloadRef.current = JSON.stringify(input);
        setIsDirty(false);
        setAutosaveFailed(false);
        setLastSavedAt(new Date());
        setError(null);
        clearImportHandoff();
      } catch (err) {
        if (gen !== genRef.current) return;
        if (isAbortError(err) && !manual) return;
        const message = isAbortError(err)
          ? SAVE_TIMEOUT_MESSAGE
          : err instanceof Error
            ? err.message
            : SAVE_TIMEOUT_MESSAGE;
        setAutosaveFailed(true);
        if (manual) setError(message);
      } finally {
        if (gen === genRef.current) {
          inFlightRef.current = false;
          if (manual) setSaving(false);
        }
      }
    },
    [days, description, isTemplate, name, onSavedIds, plan],
  );

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      const totalItems = days.reduce((sum, d) => sum + d.items.length, 0);
      if (totalItems === 0) {
        setError("Dodaj przynajmniej jedno ćwiczenie do planu.");
        return;
      }
      if (plan) {
        await saveExisting(true);
        return;
      }
      setSaving(true);
      setError(null);
      const effectiveIsTemplate = assignTo ? false : isTemplate;
      const input = buildPlanInput(name, description, effectiveIsTemplate, days);
      try {
        const created = await api.plans.create(input);
        void refreshNavCounts();
        lastSavedPayloadRef.current = JSON.stringify(input);
        setIsDirty(false);
        clearImportHandoff();
        if (assignTo) {
          const startDate = new Date().toISOString().slice(0, 10);
          try {
            await api.assignments.create({
              planId: created.id,
              clientId: assignTo.id,
              startDate,
              note: null,
            });
            router.push(`/clients/${assignTo.id}?assigned=1`);
          } catch {
            router.push(`/plans/${created.id}`);
          }
        } else {
          router.push(`/plans/${created.id}`);
        }
        router.refresh();
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setSaving(false);
      }
    },
    [assignTo, days, description, isTemplate, name, plan, router, saveExisting],
  );

  useEffect(() => {
    if (!plan) return;
    const totalItems = days.reduce((sum, d) => sum + d.items.length, 0);
    if (totalItems === 0 || !name.trim()) return;
    const input = buildPlanInput(name, description, isTemplate, days);
    const payload = JSON.stringify(input);
    if (payload === lastSavedPayloadRef.current) return;
    const timer = window.setTimeout(() => {
      void saveExisting(false);
    }, 2000);
    return () => window.clearTimeout(timer);
  }, [plan, name, description, isTemplate, days, saveExisting]);

  const retryAutosave = useCallback(() => {
    void saveExisting(true);
  }, [saveExisting]);

  const totalItems = days.reduce((sum, d) => sum + d.items.length, 0);
  const visibleError =
    error === "Dodaj przynajmniej jedno ćwiczenie do planu." && totalItems > 0 ? null : error;

  return {
    saving,
    error: visibleError,
    setError,
    lastSavedAt,
    isDirty,
    autosaveFailed,
    retryAutosave,
    handleSubmit,
  };
}
