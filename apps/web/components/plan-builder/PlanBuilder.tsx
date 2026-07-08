"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { api, Exercise, Plan, PlanInput } from "@/lib/api";
import { PLAN_PRESETS } from "@/lib/planPresets";
import { computeGroupsFromLinks, deriveLinkedToNext } from "@/lib/supersets";
import { Button, Card, ErrorBanner, Field, Pill, inputClass, useUndoToast } from "@/components/ui";
import { DayBoard } from "./DayBoard";
import { isDayContainerId, dayKeyFromContainerId } from "./dnd";
import { PlanTable } from "./PlanTable";
import { BuilderDay, BuilderItem, BuilderSet, newKey } from "./types";
import { WeekTabs } from "./WeekTabs";

type ViewMode = "board" | "table";
const VIEW_MODE_STORAGE_KEY = "trainer-app:plan-builder-view-mode";

function loadInitialViewMode(): ViewMode {
  if (typeof window === "undefined") return "board";
  return window.localStorage.getItem(VIEW_MODE_STORAGE_KEY) === "table" ? "table" : "board";
}

function loadInitialDays(plan?: Plan, initialDayCount = 1, initialWeekCount = 1): BuilderDay[] {
  if (!plan || plan.days.length === 0) {
    const weekCount = Math.max(initialWeekCount, 1);
    const dayCount = Math.max(initialDayCount, 1);
    return Array.from({ length: weekCount }, (_, w) =>
      Array.from({ length: dayCount }, (_, idx) => ({
        key: newKey(),
        weekNumber: w + 1,
        order: idx + 1,
        label: `Dzień ${idx + 1}`,
        notes: null,
        items: [],
      }))
    ).flat();
  }
  return plan.days.map((d) => {
    const linked = deriveLinkedToNext(d.items.map((i) => i.supersetGroup));
    return {
      key: newKey(),
      weekNumber: d.weekNumber,
      order: d.order,
      label: d.label,
      notes: d.notes,
      items: d.items.map((i, idx) => ({
        key: newKey(),
        exerciseId: i.exerciseId,
        exerciseName: i.exerciseName,
        exerciseType: i.exerciseType,
        order: i.order,
        linkedToNext: linked[idx],
        sets: i.overrides.sets,
        reps: i.overrides.reps,
        repsMax: i.overrides.repsMax,
        repDurationSeconds: i.overrides.repDurationSeconds,
        repDurationSecondsMax: i.overrides.repDurationSecondsMax,
        distanceMeters: i.overrides.distanceMeters,
        tempo: i.tempo,
        targetRpe: i.targetRpe,
        targetRir: i.targetRir,
        setScheme: i.setScheme,
        restBetweenSetsSeconds: i.overrides.restBetweenSetsSeconds,
        restAfterExerciseSeconds: i.restAfterExerciseSeconds,
        loadKg: i.overrides.loadKg,
        notes: i.notes,
        prescribedSets: i.prescribedSets.map((s) => ({
          key: newKey(),
          order: s.order,
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
        })),
      })),
    };
  });
}

// Odłącza pozycję od jej sąsiadów w superserii — wywoływane przed przeniesieniem pozycji
// drag & dropem, żeby łańcuch superserii nie "rozjechał się" po zmianie pozycji/dnia.
function detachLinks(items: BuilderItem[], itemKey: string): BuilderItem[] {
  return items.map((it, idx) => {
    if (it.key === itemKey) return { ...it, linkedToNext: false };
    const next = items[idx + 1];
    if (next?.key === itemKey && it.linkedToNext) return { ...it, linkedToNext: false };
    return it;
  });
}

export default function PlanBuilder({
  plan,
  initialName,
  initialIsTemplate,
  initialDayCount,
  initialWeekCount,
}: {
  plan?: Plan;
  /** Wypełnione tylko przy tworzeniu nowego planu (patrz app/plans/new) — smart default zamiast pustego formularza. */
  initialName?: string;
  initialIsTemplate?: boolean;
  initialDayCount?: number;
  initialWeekCount?: number;
}) {
  const router = useRouter();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const { showUndoToast, toastNode } = useUndoToast();

  const [name, setName] = useState(plan?.name ?? initialName ?? "");
  const [description, setDescription] = useState(plan?.description ?? "");
  const [isTemplate, setIsTemplate] = useState(plan?.isTemplate ?? initialIsTemplate ?? false);

  const [days, setDays] = useState<BuilderDay[]>(() => loadInitialDays(plan, initialDayCount, initialWeekCount));
  const [activeWeek, setActiveWeek] = useState<number>(() => {
    const initial = loadInitialDays(plan, initialDayCount, initialWeekCount);
    return initial.length ? Math.min(...initial.map((d) => d.weekNumber)) : 1;
  });
  const [activeDragItem, setActiveDragItem] = useState<BuilderItem | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>(loadInitialViewMode);

  useEffect(() => {
    window.localStorage.setItem(VIEW_MODE_STORAGE_KEY, viewMode);
  }, [viewMode]);

  useEffect(() => {
    api.exercises
      .list()
      .then(setExercises)
      .catch((e: Error) => setError(e.message));
  }, []);

  const weeks = useMemo(() => {
    const set = new Set(days.map((d) => d.weekNumber));
    return [...set].sort((a, b) => a - b);
  }, [days]);
  const maxWeek = weeks.length ? Math.max(...weeks) : 0;
  const visibleDays = useMemo(
    () => days.filter((d) => d.weekNumber === activeWeek).sort((a, b) => a.order - b.order),
    [days, activeWeek]
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor)
  );

  // --- mutacje tygodni/dni ---
  const patchDay = (dayKey: string, patch: Partial<BuilderDay>) =>
    setDays((prev) => prev.map((d) => (d.key === dayKey ? { ...d, ...patch } : d)));

  const addDay = (weekNumber: number) =>
    setDays((prev) => {
      const inWeek = prev.filter((d) => d.weekNumber === weekNumber).length;
      return [
        ...prev,
        { key: newKey(), weekNumber, order: inWeek + 1, label: `Dzień ${inWeek + 1}`, notes: null, items: [] },
      ];
    });

  const addWeek = () => {
    const week = maxWeek + 1 || 1;
    addDay(week);
    setActiveWeek(week);
  };

  const copyWeek = (weekNumber: number) =>
    setDays((prev) => {
      const target = (prev.length ? Math.max(...prev.map((d) => d.weekNumber)) : 0) + 1;
      const clones = prev
        .filter((d) => d.weekNumber === weekNumber)
        .map((d) => ({
          ...d,
          key: newKey(),
          weekNumber: target,
          items: d.items.map((it) => ({
            ...it,
            key: newKey(),
            prescribedSets: it.prescribedSets.map((s) => ({ ...s, key: newKey() })),
          })),
        }));
      setActiveWeek(target);
      return [...prev, ...clones];
    });

  const removeDay = (dayKey: string) => {
    const removed = days.find((d) => d.key === dayKey);
    const removedIndex = days.findIndex((d) => d.key === dayKey);
    setDays((prev) => prev.filter((d) => d.key !== dayKey));
    if (removed) {
      showUndoToast(`Usunięto dzień „${removed.label}”`, () =>
        setDays((prev) => {
          const next = [...prev];
          next.splice(removedIndex, 0, removed);
          return next;
        })
      );
    }
  };

  const duplicateDay = (dayKey: string) =>
    setDays((prev) => {
      const source = prev.find((d) => d.key === dayKey);
      if (!source) return prev;
      const inWeek = prev.filter((d) => d.weekNumber === source.weekNumber).length;
      const clone: BuilderDay = {
        ...source,
        key: newKey(),
        order: inWeek + 1,
        label: `${source.label} (kopia)`,
        items: source.items.map((it) => ({
          ...it,
          key: newKey(),
          prescribedSets: it.prescribedSets.map((s) => ({ ...s, key: newKey() })),
        })),
      };
      return [...prev, clone];
    });

  // --- mutacje pozycji ---
  const addItem = (dayKey: string, exerciseId: number, overrides?: Partial<BuilderItem>) => {
    const exercise = exercises.find((e) => e.id === exerciseId);
    if (!exercise) return;
    setDays((prev) =>
      prev.map((d) =>
        d.key !== dayKey
          ? d
          : {
              ...d,
              items: [
                ...d.items,
                {
                  key: newKey(),
                  exerciseId: exercise.id,
                  exerciseName: exercise.name,
                  exerciseType: exercise.type,
                  order: d.items.length + 1,
                  linkedToNext: false,
                  sets: null,
                  reps: null,
                  repsMax: null,
                  repDurationSeconds: null,
                  repDurationSecondsMax: null,
                  distanceMeters: null,
                  tempo: null,
                  targetRpe: null,
                  targetRir: null,
                  setScheme: null,
                  restBetweenSetsSeconds: null,
                  restAfterExerciseSeconds: 90,
                  loadKg: null,
                  notes: null,
                  prescribedSets: [],
                  ...overrides,
                },
              ],
            }
      )
    );
  };

  const patchItem = (dayKey: string, itemKey: string, patch: Partial<BuilderItem>) =>
    setDays((prev) =>
      prev.map((d) =>
        d.key !== dayKey ? d : { ...d, items: d.items.map((i) => (i.key === itemKey ? { ...i, ...patch } : i)) }
      )
    );

  const removeItem = (dayKey: string, itemKey: string) =>
    setDays((prev) =>
      prev.map((d) =>
        d.key !== dayKey
          ? d
          : { ...d, items: d.items.filter((i) => i.key !== itemKey).map((i, idx) => ({ ...i, order: idx + 1 })) }
      )
    );

  const moveItem = (dayKey: string, itemKey: string, dir: -1 | 1) =>
    setDays((prev) =>
      prev.map((d) => {
        if (d.key !== dayKey) return d;
        const idx = d.items.findIndex((i) => i.key === itemKey);
        const target = idx + dir;
        if (idx === -1 || target < 0 || target >= d.items.length) return d;
        const items = arrayMove(d.items, idx, target).map((i, o) => ({ ...i, order: o + 1 }));
        return { ...d, items };
      })
    );

  const toggleLink = (dayKey: string, itemKey: string) =>
    setDays((prev) =>
      prev.map((d) => {
        if (d.key !== dayKey) return d;
        return { ...d, items: d.items.map((i) => (i.key === itemKey ? { ...i, linkedToNext: !i.linkedToNext } : i)) };
      })
    );

  // --- serie (PlanSet) ---
  const setItemSets = (dayKey: string, itemKey: string, sets: BuilderSet[]) =>
    patchItem(dayKey, itemKey, { prescribedSets: sets });

  const addSet = (dayKey: string, itemKey: string) => {
    const day = days.find((d) => d.key === dayKey);
    const item = day?.items.find((i) => i.key === itemKey);
    if (!item) return;
    setItemSets(dayKey, itemKey, [
      ...item.prescribedSets,
      {
        key: newKey(),
        order: item.prescribedSets.length + 1,
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
        role: "work",
        note: null,
      },
    ]);
  };

  const patchSet = (dayKey: string, itemKey: string, setKey: string, patch: Partial<BuilderSet>) =>
    setDays((prev) =>
      prev.map((d) =>
        d.key !== dayKey
          ? d
          : {
              ...d,
              items: d.items.map((i) =>
                i.key !== itemKey
                  ? i
                  : { ...i, prescribedSets: i.prescribedSets.map((s) => (s.key === setKey ? { ...s, ...patch } : s)) }
              ),
            }
      )
    );

  const removeSet = (dayKey: string, itemKey: string, setKey: string) => {
    const day = days.find((d) => d.key === dayKey);
    const item = day?.items.find((i) => i.key === itemKey);
    if (!item) return;
    setItemSets(
      dayKey,
      itemKey,
      item.prescribedSets.filter((s) => s.key !== setKey).map((s, idx) => ({ ...s, order: idx + 1 }))
    );
  };

  const applyPreset = (dayKey: string, itemKey: string, presetId: string) => {
    const day = days.find((d) => d.key === dayKey);
    if (!day) return;
    const preset = PLAN_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    const sets: BuilderSet[] = preset.build(day.weekNumber).map((s) => ({ ...s, key: newKey() }));
    patchItem(dayKey, itemKey, { prescribedSets: sets, setScheme: preset.label });
  };

  // --- drag & drop ---
  const findDayOfItem = (itemKey: string) => days.find((d) => d.items.some((i) => i.key === itemKey));

  const handleDragStart = (event: DragStartEvent) => {
    const day = findDayOfItem(String(event.active.id));
    setActiveDragItem(day?.items.find((i) => i.key === event.active.id) ?? null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDragItem(null);
    const { active, over } = event;
    if (!over) return;
    const activeKey = String(active.id);
    const overId = String(over.id);

    const sourceDay = findDayOfItem(activeKey);
    if (!sourceDay) return;

    const targetDayKey = isDayContainerId(overId) ? dayKeyFromContainerId(overId) : findDayOfItem(overId)?.key;
    if (!targetDayKey) return;

    if (sourceDay.key === targetDayKey && !isDayContainerId(overId)) {
      // Reorder w obrębie tego samego dnia.
      const oldIndex = sourceDay.items.findIndex((i) => i.key === activeKey);
      const newIndex = sourceDay.items.findIndex((i) => i.key === overId);
      if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;
      setDays((prev) =>
        prev.map((d) =>
          d.key !== sourceDay.key
            ? d
            : { ...d, items: arrayMove(d.items, oldIndex, newIndex).map((i, o) => ({ ...i, order: o + 1 })) }
        )
      );
      return;
    }

    // Przeniesienie między dniami: odłączamy superserię przy starej pozycji, wstawiamy w nowym miejscu.
    const movingItem = sourceDay.items.find((i) => i.key === activeKey);
    if (!movingItem) return;

    setDays((prev) => {
      const withoutItem = prev.map((d) =>
        d.key !== sourceDay.key ? d : { ...d, items: detachLinks(d.items, activeKey).filter((i) => i.key !== activeKey) }
      );
      return withoutItem.map((d) => {
        if (d.key !== targetDayKey) return d;
        const insertAt = isDayContainerId(overId) ? d.items.length : d.items.findIndex((i) => i.key === overId);
        const targetIndex = insertAt === -1 ? d.items.length : insertAt;
        const items = [...d.items];
        items.splice(targetIndex, 0, { ...movingItem, linkedToNext: false });
        return { ...d, items: items.map((i, o) => ({ ...i, order: o + 1 })) };
      });
    });
  };

  const buildPlanInput = (): PlanInput => ({
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
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const totalItems = days.reduce((sum, d) => sum + d.items.length, 0);
    if (totalItems === 0) {
      setError("Dodaj przynajmniej jedno ćwiczenie do planu.");
      return;
    }
    setSaving(true);
    setError(null);
    const input = buildPlanInput();
    try {
      if (plan) {
        await api.plans.update(plan.id, input);
        router.push(`/plans/${plan.id}`);
      } else {
        const created = await api.plans.create(input);
        router.push(`/plans/${created.id}`);
      }
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
      setSaving(false);
    }
  };

  // Autosave (tylko edycja istniejącego planu — nowy plan wymaga jawnego pierwszego zapisu, bo nie
  // ma jeszcze ID). Debounce 2s bez aktywności, gasi lęk przed utratą zmian; "Zapisz plan" zostaje
  // jako explicit checkpoint.
  useEffect(() => {
    if (!plan) return;
    const totalItems = days.reduce((sum, d) => sum + d.items.length, 0);
    if (totalItems === 0 || !name.trim()) return;
    const timer = setTimeout(() => {
      api.plans
        .update(plan.id, buildPlanInput())
        .then(() => setLastSavedAt(new Date()))
        .catch(() => {
          // Autosave po cichu nie udało się — trener wciąż ma manualny "Zapisz plan" jako fallback.
        });
    }, 2000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan, name, description, isTemplate, days]);

  return (
    <form onSubmit={handleSubmit}>
      <ErrorBanner message={error} />

      <Card className="mb-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Nazwa planu *">
            <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} required />
          </Field>
          <Field label="Rodzaj">
            <select
              className={inputClass}
              value={isTemplate ? "template" : "plan"}
              onChange={(e) => setIsTemplate(e.target.value === "template")}
            >
              <option value="plan">Plan klienta (przypisywalny)</option>
              <option value="template">Szablon (wielokrotnego użytku)</option>
            </select>
          </Field>
          <div className="sm:col-span-3">
            <Field label="Zasady ogólne / opis planu">
              <textarea
                className={inputClass}
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="np. tempo, nawodnienie, zasady progresji…"
              />
            </Field>
          </div>
        </div>
      </Card>

      <div className="mb-3 flex justify-end">
        <div className="inline-flex shrink-0 items-center gap-1 rounded-full bg-surface-hover p-1">
          <Pill active={viewMode === "board"} onClick={() => setViewMode("board")}>
            Tablica
          </Pill>
          <Pill active={viewMode === "table"} onClick={() => setViewMode("table")}>
            Arkusz
          </Pill>
        </div>
      </div>

      <WeekTabs weeks={weeks} activeWeek={activeWeek} onSelect={setActiveWeek} onAddWeek={addWeek} onCopyWeek={copyWeek} />

      {viewMode === "board" ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <DayBoard
            days={visibleDays}
            exercises={exercises}
            onAddDay={() => addDay(activeWeek)}
            onPatchDay={patchDay}
            onRemoveDay={removeDay}
            onDuplicateDay={duplicateDay}
            onAddItem={addItem}
            onPatchItem={patchItem}
            onRemoveItem={removeItem}
            onMoveItem={moveItem}
            onToggleLink={toggleLink}
            onAddSet={addSet}
            onPatchSet={patchSet}
            onRemoveSet={removeSet}
            onApplyPreset={applyPreset}
            onClearSets={(dayKey, itemKey) => setItemSets(dayKey, itemKey, [])}
          />
          <DragOverlay>
            {activeDragItem && (
              <div className="rounded-lg border border-accent/60 bg-surface px-3 py-2 text-sm font-medium shadow-xl">
                {activeDragItem.exerciseName}
              </div>
            )}
          </DragOverlay>
        </DndContext>
      ) : (
        <PlanTable
          days={visibleDays}
          exercises={exercises}
          onAddDay={() => addDay(activeWeek)}
          onPatchDay={patchDay}
          onRemoveDay={removeDay}
          onDuplicateDay={duplicateDay}
          onAddItem={addItem}
          onPatchItem={patchItem}
          onRemoveItem={removeItem}
          onMoveItem={moveItem}
          onToggleLink={toggleLink}
          onAddSet={addSet}
          onPatchSet={patchSet}
          onRemoveSet={removeSet}
          onApplyPreset={applyPreset}
          onClearSets={(dayKey, itemKey) => setItemSets(dayKey, itemKey, [])}
        />
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={saving || !name.trim()}>
          {saving ? "Zapisywanie…" : plan ? "Zapisz zmiany" : "Utwórz plan"}
        </Button>
        {plan && lastSavedAt && (
          <span className="text-xs text-muted">
            Zapisano autom. o {lastSavedAt.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" })}
          </span>
        )}
      </div>

      {toastNode}
    </form>
  );
}
