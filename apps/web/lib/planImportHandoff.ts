import { Exercise, ExerciseType, PlanImportDraft, PlanImportItem, PlanSetInput } from "@/lib/api";
import { BuilderDay, BuilderItem, BuilderSet, newKey } from "@/components/plan-builder/types";
import { deriveLinkedToNext } from "@/lib/supersets";

export const PLAN_IMPORT_STORAGE_KEY = "trainer-app:plan-import-draft:v1";

export type PlanImportHandoff = {
  name: string;
  description: string | null;
  isTemplate: boolean;
  days: BuilderDay[];
  clientId?: number;
};

/** Mapowanie ćwiczeń: klucz = `${dayIdx}:${itemIdx}` → exerciseId. */
export type ExerciseIdMap = Record<string, number>;

export function itemMapKey(dayIdx: number, itemIdx: number): string {
  return `${dayIdx}:${itemIdx}`;
}

export function saveImportHandoff(payload: PlanImportHandoff): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(PLAN_IMPORT_STORAGE_KEY, JSON.stringify(payload));
}

export function readImportHandoff(): PlanImportHandoff | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(PLAN_IMPORT_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PlanImportHandoff;
  } catch {
    return null;
  }
}

export function clearImportHandoff(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(PLAN_IMPORT_STORAGE_KEY);
}

/** @deprecated użyj readImportHandoff + clearImportHandoff po zapisie */
export function consumeImportHandoff(): PlanImportHandoff | null {
  const value = readImportHandoff();
  clearImportHandoff();
  return value;
}

function emptySet(order: number, patch: Partial<PlanSetInput> = {}): BuilderSet {
  return {
    key: newKey(),
    order,
    reps: null,
    repsMax: null,
    durationSeconds: null,
    distanceMeters: null,
    loadKg: null,
    loadPercent: null,
    percentOf: null,
    targetRpe: null,
    targetRir: null,
    tempo: null,
    role: null,
    note: null,
    ...patch,
  };
}

function toBuilderItem(
  item: PlanImportItem,
  exerciseId: number,
  exercise: Exercise | undefined,
  linkedToNext: boolean
): BuilderItem {
  const measureType: ExerciseType =
    (item.measureType as ExerciseType | null) ?? exercise?.type ?? "reps";
  const prescribed = (item.prescribedSets ?? []).map((s, i) =>
    emptySet(s.order || i + 1, {
      reps: s.reps,
      repsMax: s.repsMax,
      durationSeconds: s.durationSeconds,
      distanceMeters: s.distanceMeters,
      loadKg: s.loadKg,
      loadPercent: s.loadPercent,
      percentOf: s.percentOf,
      targetRpe: s.targetRpe,
      targetRir: s.targetRir,
      tempo: s.tempo,
      role: s.role,
      note: s.note,
    })
  );

  return {
    key: newKey(),
    exerciseId,
    exerciseName: exercise?.name ?? item.exerciseName,
    exerciseType: exercise?.type ?? measureType,
    measureType,
    order: item.order,
    linkedToNext,
    isWarmup: item.isWarmup,
    sets: item.sets ?? (prescribed.length || exercise?.defaultSets || 3),
    reps: item.reps,
    repsMax: item.repsMax,
    repDurationSeconds: item.repDurationSeconds,
    repDurationSecondsMax: null,
    distanceMeters: item.distanceMeters,
    tempo: item.tempo,
    targetRpe: item.targetRpe,
    targetRir: item.targetRir,
    setScheme: item.setScheme,
    restBetweenSetsSeconds: item.restBetweenSetsSeconds ?? exercise?.defaultRestBetweenSetsSeconds ?? 60,
    restAfterExerciseSeconds: item.restAfterExerciseSeconds ?? 90,
    loadKg: item.loadKg,
    loadPercent: item.loadPercent,
    notes: item.notes,
    prescribedSets: prescribed,
  };
}

/**
 * Buduje draft kreatora z odpowiedzi AI + mapy exerciseId (po ręcznym mapowaniu / create).
 * Pomija pozycje bez przypisanego ID.
 */
export function draftToBuilderHandoff(
  draft: PlanImportDraft,
  idMap: ExerciseIdMap,
  exercises: Exercise[],
  opts?: { isTemplate?: boolean; clientId?: number }
): PlanImportHandoff {
  const byId = new Map(exercises.map((e) => [e.id, e]));
  const days: BuilderDay[] = (draft.days ?? []).map((d, dayIdx) => {
    const rawItems = d.items ?? [];
    const resolved = rawItems
      .map((it, itemIdx) => {
        const id = idMap[itemMapKey(dayIdx, itemIdx)] ?? it.matchedExerciseId;
        if (id == null) return null;
        return { it, id };
      })
      .filter((x): x is { it: PlanImportItem; id: number } => x != null);

    const linked = deriveLinkedToNext(resolved.map((x) => x.it.supersetGroup));
    const items = resolved.map((x, idx) =>
      toBuilderItem(x.it, x.id, byId.get(x.id), linked[idx] ?? false)
    );

    return {
      key: newKey(),
      weekNumber: d.weekNumber || 1,
      order: d.order || dayIdx + 1,
      label: d.label || `Dzień ${dayIdx + 1}`,
      notes: d.notes,
      dayOfWeek: null,
      items: items.map((it, o) => ({ ...it, order: o + 1 })),
    };
  });

  return {
    name: draft.name?.trim() || "Zaimportowany plan",
    description: draft.description,
    isTemplate: opts?.isTemplate ?? false,
    days,
    clientId: opts?.clientId,
  };
}

/** Czy wszystkie pozycje mają przypisane exerciseId. */
export function allItemsMapped(draft: PlanImportDraft, idMap: ExerciseIdMap): boolean {
  for (let di = 0; di < (draft.days ?? []).length; di++) {
    const items = draft.days[di].items ?? [];
    for (let ii = 0; ii < items.length; ii++) {
      const id = idMap[itemMapKey(di, ii)] ?? items[ii].matchedExerciseId;
      if (id == null) return false;
    }
  }
  return (draft.days ?? []).some((d) => (d.items ?? []).length > 0);
}

export function countUnmapped(draft: PlanImportDraft, idMap: ExerciseIdMap): number {
  let n = 0;
  for (let di = 0; di < (draft.days ?? []).length; di++) {
    const items = draft.days[di].items ?? [];
    for (let ii = 0; ii < items.length; ii++) {
      const id = idMap[itemMapKey(di, ii)] ?? items[ii].matchedExerciseId;
      if (id == null) n++;
    }
  }
  return n;
}
