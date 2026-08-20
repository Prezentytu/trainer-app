"use client";

import { useCallback, useMemo, useState } from "react";
import { arrayMove } from "@dnd-kit/sortable";
import { Exercise, LastPrescription, Plan, PlanSaveIds } from "@/lib/api";
import { lastPrescriptionOverrides } from "./lastPrescription";
import { formatSchemeLabel, matchingPresetId, PLAN_PRESETS } from "@/lib/planPresets";
import { isDefaultDayLabel, WEEKDAY_NAMES } from "@/lib/schedule";
import { applyMethodTemplate, MethodTemplateId } from "@/lib/methodTemplates";
import { useUndoToast } from "@/components/ui";
import { loadInitialDays } from "./loadInitialDays";
import {
  duplicateWeek as duplicateWeekPure,
  insertWeek as insertWeekPure,
  moveDayTo,
  moveItemTo,
  normalizeWeeks,
  removeWeek as removeWeekPure,
} from "./builderMove";
import { useUndoRedo } from "./useUndoRedo";
import { BuilderDay, BuilderItem, BuilderSet, newKey } from "./types";

/**
 * Rozpisane serie są jedynym źródłem prawdy. Pola itemu synchronizujemy tylko wtedy,
 * gdy wszystkie serie są identyczne — inaczej agregat min–max kłamałby („8 × 1–10”
 * dla rozpisu 3/3/1/1/1/3/3). Przy różnych seriach zostaje wyłącznie liczba serii.
 */
function aggregatesFromSets(sets: BuilderSet[]): Partial<BuilderItem> {
  if (sets.length === 0) return {};
  const patch: Partial<BuilderItem> = { sets: sets.length };
  const same = <T,>(values: T[]) => values.every((v) => v === values[0]);
  if (same(sets.map((s) => s.reps)) && same(sets.map((s) => s.repsMax))) {
    patch.reps = sets[0].reps;
    patch.repsMax = sets[0].repsMax ?? null;
  }
  if (same(sets.map((s) => s.loadKg))) patch.loadKg = sets[0].loadKg;
  return patch;
}

function withSyncedSets(item: BuilderItem, sets: BuilderSet[]): BuilderItem {
  return { ...item, prescribedSets: sets, ...aggregatesFromSets(sets) };
}

export function detachLinks(items: BuilderItem[], itemKey: string): BuilderItem[] {
  return items.map((it, idx) => {
    if (it.key === itemKey) return { ...it, linkedToNext: false };
    const next = items[idx + 1];
    if (next?.key === itemKey && it.linkedToNext) return { ...it, linkedToNext: false };
    return it;
  });
}

export function usePlanDraft({
  plan,
  initialName,
  initialDescription,
  initialIsTemplate,
  initialDayCount,
  initialWeekCount,
  initialDays,
  getExerciseById,
  getLastPrescription,
}: {
  plan?: Plan;
  initialName?: string;
  initialDescription?: string | null;
  initialIsTemplate?: boolean;
  initialDayCount?: number;
  initialWeekCount?: number;
  /** Gotowy draft (np. z importu AI) — nadpisuje pustą strukturę. */
  initialDays?: BuilderDay[];
  getExerciseById: (id: number) => Exercise | undefined;
  getLastPrescription?: (exerciseId: number) => LastPrescription | undefined;
}) {
  const { showUndoToast, toastNode } = useUndoToast();

  const [name, setName] = useState(plan?.name ?? initialName ?? "");
  const [description, setDescription] = useState(plan?.description ?? initialDescription ?? "");
  const [isTemplate, setIsTemplate] = useState(plan?.isTemplate ?? initialIsTemplate ?? false);
  // Stary plan mógł mieć luki w numeracji (np. tydzień 2 i 5) — normalizujemy przy wczytaniu.
  const [days, setDays] = useState<BuilderDay[]>(() =>
    normalizeWeeks(
      initialDays && initialDays.length > 0
        ? initialDays
        : loadInitialDays(plan, initialDayCount, initialWeekCount),
    ),
  );
  const history = useUndoRedo(days, setDays);
  const [activeWeek, setActiveWeek] = useState<number>(1);

  const weeks = useMemo(() => {
    const set = new Set(days.map((d) => d.weekNumber));
    return [...set].sort((a, b) => a - b);
  }, [days]);
  const maxWeek = weeks.length ? Math.max(...weeks) : 0;
  const visibleDays = useMemo(
    () => days.filter((d) => d.weekNumber === activeWeek).sort((a, b) => a.order - b.order),
    [days, activeWeek]
  );

  const patchDay = useCallback(
    (dayKey: string, patch: Partial<BuilderDay>) =>
      setDays((prev) => prev.map((d) => (d.key === dayKey ? { ...d, ...patch } : d))),
    []
  );

  const addDay = useCallback((weekNumber: number) => {
    setDays((prev) => {
      const inWeek = prev.filter((d) => d.weekNumber === weekNumber).length;
      return [
        ...prev,
        { key: newKey(), weekNumber, order: inWeek + 1, label: `Dzień ${inWeek + 1}`, notes: null, dayOfWeek: null, items: [] },
      ];
    });
  }, []);

  const addWeek = useCallback(() => {
    const week = maxWeek + 1 || 1;
    addDay(week);
    setActiveWeek(week);
  }, [addDay, maxWeek]);

  const copyWeek = useCallback(
    (
      weekNumber: number,
      options?: {
        keepSets?: boolean;
        reapplyPresets?: boolean;
        progression?: { mode: "none" | "kg" | "percent" | "reps"; amount: number };
        copies?: number;
      }
    ) => {
      const keepSets = options?.keepSets ?? true;
      const reapplyPresets = options?.reapplyPresets ?? false;
      const progression = options?.progression ?? { mode: "none" as const, amount: 0 };
      const copies = Math.max(1, Math.min(12, options?.copies ?? 1));
      setDays((prev) => {
        let next = prev;
        let sourceWeek = weekNumber;
        for (let i = 0; i < copies; i++) {
          const target = (next.length ? Math.max(...next.map((d) => d.weekNumber)) : 0) + 1;
          const clones = next
            .filter((d) => d.weekNumber === sourceWeek)
            .map((d) => ({
              ...d,
              key: newKey(),
              entityId: undefined,
              weekNumber: target,
              items: d.items.map((it) => {
                let prescribedSets = it.prescribedSets.map((s) => ({ ...s, key: newKey() }));
                let setScheme = it.setScheme;
                let loadKg = it.loadKg;
                let reps = it.reps;
                let repsMax = it.repsMax;
                if (!keepSets) {
                  prescribedSets = [];
                  setScheme = null;
                } else if (reapplyPresets) {
                  const matchId = matchingPresetId(it.prescribedSets, sourceWeek);
                  const match = matchId ? PLAN_PRESETS.find((p) => p.id === matchId) : undefined;
                  if (match) {
                    prescribedSets = match.build(target).map((s) => ({ ...s, key: newKey() }));
                    setScheme = formatSchemeLabel(prescribedSets);
                  }
                }
                if (progression.mode === "kg" && progression.amount !== 0) {
                  if (loadKg != null) loadKg = Math.round((loadKg + progression.amount) * 2) / 2;
                  prescribedSets = prescribedSets.map((s) =>
                    s.loadKg != null
                      ? { ...s, loadKg: Math.round((s.loadKg + progression.amount) * 2) / 2 }
                      : s
                  );
                } else if (progression.mode === "percent" && progression.amount !== 0) {
                  const factor = 1 + progression.amount / 100;
                  if (loadKg != null) loadKg = Math.round(loadKg * factor * 2) / 2;
                  prescribedSets = prescribedSets.map((s) =>
                    s.loadKg != null ? { ...s, loadKg: Math.round(s.loadKg * factor * 2) / 2 } : s
                  );
                } else if (progression.mode === "reps" && progression.amount !== 0) {
                  if (reps != null) reps = Math.max(1, reps + progression.amount);
                  if (repsMax != null) repsMax = Math.max(reps ?? 1, repsMax + progression.amount);
                  prescribedSets = prescribedSets.map((s) => ({
                    ...s,
                    reps: s.reps != null ? Math.max(1, s.reps + progression.amount) : s.reps,
                    repsMax:
                      s.repsMax != null
                        ? Math.max(s.reps ?? 1, s.repsMax + progression.amount)
                        : s.repsMax,
                  }));
                }
                return {
                  ...it,
                  key: newKey(),
                  entityId: undefined,
                  prescribedSets,
                  setScheme,
                  loadKg,
                  reps,
                  repsMax,
                };
              }),
            }));
          next = [...next, ...clones];
          sourceWeek = target;
        }
        const lastWeek = next.length ? Math.max(...next.map((d) => d.weekNumber)) : weekNumber;
        setActiveWeek(lastWeek);
        return next;
      });
    },
    []
  );

  const removeDay = useCallback(
    (dayKey: string) => {
      setDays((prev) => {
        const removed = prev.find((d) => d.key === dayKey);
        const removedIndex = prev.findIndex((d) => d.key === dayKey);
        const next = prev.filter((d) => d.key !== dayKey);
        if (removed) {
          showUndoToast(`Usunięto dzień „${removed.label}”`, () =>
            setDays((cur) => {
              const restored = [...cur];
              restored.splice(Math.min(removedIndex, restored.length), 0, removed);
              return restored;
            })
          );
        }
        return next;
      });
    },
    [showUndoToast]
  );

  const duplicateDay = useCallback((dayKey: string, targetWeekNumber?: number) => {
    setDays((prev) => {
      const source = prev.find((d) => d.key === dayKey);
      if (!source) return prev;
      const week = targetWeekNumber ?? source.weekNumber;
      const inWeek = prev.filter((d) => d.weekNumber === week).length;
      // Klon nie może dziedziczyć entityId — inaczej zapis nadpisałby dzień źródłowy.
      const clone: BuilderDay = {
        ...source,
        key: newKey(),
        entityId: undefined,
        weekNumber: week,
        order: inWeek + 1,
        label: `${source.label} (kopia)`,
        items: source.items.map((it) => ({
          ...it,
          key: newKey(),
          entityId: undefined,
          prescribedSets: it.prescribedSets.map((s) => ({ ...s, key: newKey() })),
        })),
      };
      return [...prev, clone];
    });
  }, []);

  /** Przenosi dzień do innego tygodnia (drag na numer tygodnia albo „Przenieś do tygodnia…”). */
  const moveDay = useCallback(
    (dayKey: string, targetWeek: number, index?: number) => {
      setDays((prev) => moveDayTo(prev, dayKey, { weekNumber: targetWeek, index }));
      setActiveWeek(targetWeek);
    },
    [],
  );

  /** Przenosi ćwiczenie w dniu albo do innego dnia — wspólne dla Listy, Tablicy i Arkusza. */
  const moveItemTarget = useCallback(
    (fromDayKey: string, itemKey: string, toDayKey: string, index: number) => {
      setDays((prev) => moveItemTo(prev, { dayKey: fromDayKey, itemKey }, { dayKey: toDayKey, index }));
    },
    [],
  );

  const insertWeek = useCallback((weekNumber: number, side: "before" | "after") => {
    setDays((prev) => {
      const result = insertWeekPure(prev, weekNumber, side);
      setActiveWeek(result.weekNumber);
      return result.days;
    });
  }, []);

  const duplicateWeek = useCallback((weekNumber: number) => {
    setDays((prev) => {
      const result = duplicateWeekPure(prev, weekNumber);
      setActiveWeek(result.weekNumber);
      return result.days;
    });
  }, []);

  const removeWeek = useCallback(
    (weekNumber: number) => {
      setDays((prev) => {
        const snapshot = prev;
        const next = removeWeekPure(prev, weekNumber);
        if (next.length !== prev.length) {
          showUndoToast(`Usunięto tydzień ${weekNumber}`, () => setDays(snapshot));
        }
        setActiveWeek((cur) => Math.max(1, Math.min(cur, next.length ? Math.max(...next.map((d) => d.weekNumber)) : 1)));
        return next;
      });
    },
    [showUndoToast],
  );

  const applyWeekdaysToOtherWeeks = useCallback((sourceWeek: number) => {
    setDays((prev) => {
      const source = prev
        .filter((d) => d.weekNumber === sourceWeek)
        .sort((a, b) => a.order - b.order);
      return prev.map((d) => {
        if (d.weekNumber === sourceWeek) return d;
        const match = source.find((s) => s.order === d.order);
        if (!match) return d;
        const nextLabel =
          isDefaultDayLabel(d.label, d.order) && match.dayOfWeek
            ? WEEKDAY_NAMES[match.dayOfWeek]
            : d.label;
        return { ...d, dayOfWeek: match.dayOfWeek, label: nextLabel };
      });
    });
  }, []);

  const addItem = useCallback(
    (dayKey: string, exerciseId: number, overrides?: Partial<BuilderItem>) => {
      const exercise = getExerciseById(exerciseId);
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
                    measureType: exercise.type,
                    order: d.items.length + 1,
                    linkedToNext: false,
                    isWarmup: false,
                    sets: exercise.defaultSets,
                    reps: exercise.type === "reps" ? exercise.defaultReps : null,
                    repsMax: null,
                    repDurationSeconds: exercise.type === "time" ? exercise.defaultRepDurationSeconds : null,
                    repDurationSecondsMax: null,
                    distanceMeters: exercise.type === "distance" ? exercise.defaultDistanceMeters : null,
                    tempo: null,
                    targetRpe: null,
                    targetRir: null,
                    setScheme: null,
                    restBetweenSetsSeconds: exercise.defaultRestBetweenSetsSeconds,
                    restAfterExerciseSeconds: 90,
                    loadKg: exercise.defaultLoadKg,
                    loadPercent: null,
                    notes: null,
                    prescribedSets: [],
                    ...lastPrescriptionOverrides(getLastPrescription?.(exerciseId), overrides),
                    ...overrides,
                  },
                ],
              }
        )
      );
    },
    [getExerciseById, getLastPrescription]
  );

  const patchItem = useCallback(
    (dayKey: string, itemKey: string, patch: Partial<BuilderItem>) =>
      setDays((prev) =>
        prev.map((d) => {
          if (d.key !== dayKey) return d;
          if (patch.restBetweenSetsSeconds === undefined) {
            return { ...d, items: d.items.map((i) => (i.key === itemKey ? { ...i, ...patch } : i)) };
          }
          const idx = d.items.findIndex((i) => i.key === itemKey);
          if (idx === -1) return d;
          let start = idx;
          while (start > 0 && d.items[start - 1].linkedToNext) start--;
          let end = idx;
          while (end < d.items.length - 1 && d.items[end].linkedToNext) end++;
          const multi = end > start;
          return {
            ...d,
            items: d.items.map((i, iIdx) => {
              if (i.key === itemKey) return { ...i, ...patch };
              if (multi && iIdx >= start && iIdx <= end) {
                return { ...i, restBetweenSetsSeconds: patch.restBetweenSetsSeconds ?? i.restBetweenSetsSeconds };
              }
              return i;
            }),
          };
        })
      ),
    []
  );

  /** Przełącza rozgrzewkę i przenosi pozycję na koniec bloku rozgrzewki / początek części głównej. */
  const toggleWarmup = useCallback((dayKey: string, itemKey: string) => {
    setDays((prev) =>
      prev.map((d) => {
        if (d.key !== dayKey) return d;
        const idx = d.items.findIndex((i) => i.key === itemKey);
        if (idx === -1) return d;
        const item = d.items[idx];
        const nextWarmup = !item.isWarmup;
        // Rozłącz z sąsiadami przy przenoszeniu między sekcjami
        let items = detachLinks(d.items, itemKey).map((i) =>
          i.key === itemKey ? { ...i, isWarmup: nextWarmup, linkedToNext: false } : i
        );
        const moved = items.find((i) => i.key === itemKey)!;
        items = items.filter((i) => i.key !== itemKey);
        if (nextWarmup) {
          const lastWarmup = items.reduce((acc, i, iIdx) => (i.isWarmup ? iIdx : acc), -1);
          items.splice(lastWarmup + 1, 0, moved);
        } else {
          const firstMain = items.findIndex((i) => !i.isWarmup);
          items.splice(firstMain === -1 ? items.length : firstMain, 0, moved);
        }
        return { ...d, items: items.map((i, o) => ({ ...i, order: o + 1 })) };
      })
    );
  }, []);

  /**
   * Wstawia ćwiczenie na wymuszonej pozycji (numer grupy z composera, np. 1 → „1” / „1b”).
   * `asSuper` łączy z ostatnim członkiem tej grupy; `isWarmup` gdy numer === 0 lub jawnie.
   */
  const addItemAt = useCallback(
    (
      dayKey: string,
      exerciseId: number,
      options: {
        positionNum: number;
        asSuper?: boolean;
        isWarmup?: boolean;
        overrides?: Partial<BuilderItem>;
      }
    ) => {
      const exercise = getExerciseById(exerciseId);
      if (!exercise) return;
      setDays((prev) =>
        prev.map((d) => {
          if (d.key !== dayKey) return d;

          type Block = { start: number; end: number; num: number; warmup: boolean };
          const blocks: Block[] = [];
          let i = 0;
          let nextWarmup = 1;
          let nextMain = 1;
          while (i < d.items.length) {
            let end = i;
            while (end < d.items.length - 1 && d.items[end].linkedToNext) end++;
            const warmup = d.items[i].isWarmup;
            blocks.push({ start: i, end, num: warmup ? nextWarmup : nextMain, warmup });
            if (warmup) nextWarmup++;
            else nextMain++;
            i = end + 1;
          }

          const warmupFlag = options.isWarmup ?? options.positionNum === 0;
          const newItem: BuilderItem = {
            key: newKey(),
            exerciseId: exercise.id,
            exerciseName: exercise.name,
            exerciseType: exercise.type,
            measureType: exercise.type,
            order: 0,
            linkedToNext: false,
            sets: exercise.defaultSets,
            reps: exercise.type === "reps" ? exercise.defaultReps : null,
            repsMax: null,
            repDurationSeconds: exercise.type === "time" ? exercise.defaultRepDurationSeconds : null,
            repDurationSecondsMax: null,
            distanceMeters: exercise.type === "distance" ? exercise.defaultDistanceMeters : null,
            tempo: null,
            targetRpe: null,
            targetRir: null,
            setScheme: null,
            restBetweenSetsSeconds: exercise.defaultRestBetweenSetsSeconds,
            restAfterExerciseSeconds: 90,
            loadKg: exercise.defaultLoadKg,
            loadPercent: null,
            notes: null,
            prescribedSets: [],
            ...lastPrescriptionOverrides(getLastPrescription?.(exerciseId), options.overrides),
            ...options.overrides,
            isWarmup: warmupFlag,
          };

          const target =
            options.positionNum === 0 && warmupFlag
              ? [...blocks].reverse().find((b) => b.warmup)
              : blocks.find((b) => b.num === options.positionNum && b.warmup === warmupFlag);
          let nextItems = [...d.items];

          if (target) {
            const anchorRest = nextItems[target.end]?.restBetweenSetsSeconds ?? newItem.restBetweenSetsSeconds;
            newItem.restBetweenSetsSeconds = anchorRest;
            nextItems = nextItems.map((it, idx) => {
              if (idx >= target.start && idx <= target.end) {
                return {
                  ...it,
                  isWarmup: warmupFlag,
                  linkedToNext: idx === target.end ? true : it.linkedToNext,
                  restBetweenSetsSeconds: anchorRest,
                };
              }
              return it;
            });
            nextItems.splice(target.end + 1, 0, newItem);
          } else if (warmupFlag) {
            const lastWarmup = nextItems.reduce((acc, it, iIdx) => (it.isWarmup ? iIdx : acc), -1);
            nextItems.splice(lastWarmup + 1, 0, newItem);
          } else {
            nextItems.push(newItem);
          }

          const warm = nextItems.filter((it) => it.isWarmup);
          const main = nextItems.filter((it) => !it.isWarmup);
          return { ...d, items: [...warm, ...main].map((it, o) => ({ ...it, order: o + 1 })) };
        })
      );
    },
    [getExerciseById, getLastPrescription]
  );

  const duplicateItem = useCallback((dayKey: string, itemKey: string) => {
    setDays((prev) =>
      prev.map((d) => {
        if (d.key !== dayKey) return d;
        const idx = d.items.findIndex((i) => i.key === itemKey);
        if (idx === -1) return d;
        const source = d.items[idx];
        const clone: BuilderItem = {
          ...source,
          key: newKey(),
          linkedToNext: false,
          prescribedSets: source.prescribedSets.map((s) => ({ ...s, key: newKey() })),
        };
        // Rozłącz źródło z następnym — klon wstawiamy między nimi jako osobną pozycję.
        const items = d.items.map((i, iIdx) =>
          iIdx === idx ? { ...i, linkedToNext: false } : i
        );
        items.splice(idx + 1, 0, clone);
        return { ...d, items: items.map((i, o) => ({ ...i, order: o + 1 })) };
      })
    );
  }, []);

  const removeItem = useCallback(
    (dayKey: string, itemKey: string) => {
      setDays((prev) => {
        const day = prev.find((d) => d.key === dayKey);
        const removedIndex = day?.items.findIndex((i) => i.key === itemKey) ?? -1;
        const removed = removedIndex >= 0 && day ? day.items[removedIndex] : null;
        if (removed) {
          showUndoToast(`Usunięto „${removed.exerciseName}”`, () => {
            setDays((cur) =>
              cur.map((d) => {
                if (d.key !== dayKey) return d;
                if (d.items.some((i) => i.key === removed.key)) return d;
                const next = [...d.items];
                next.splice(Math.min(removedIndex, next.length), 0, removed);
                return { ...d, items: next.map((i, o) => ({ ...i, order: o + 1 })) };
              }),
            );
          });
        }
        return prev.map((d) =>
          d.key !== dayKey
            ? d
            : {
                ...d,
                items: detachLinks(d.items, itemKey)
                  .filter((i) => i.key !== itemKey)
                  .map((i, o) => ({ ...i, order: o + 1 })),
              },
        );
      });
    },
    [showUndoToast],
  );

  const moveItem = useCallback(
    (dayKey: string, itemKey: string, dir: -1 | 1) =>
      setDays((prev) =>
        prev.map((d) => {
          if (d.key !== dayKey) return d;
          const detached = detachLinks(d.items, itemKey);
          const idx = detached.findIndex((i) => i.key === itemKey);
          const target = idx + dir;
          if (idx === -1 || target < 0 || target >= detached.length) return d;
          return { ...d, items: arrayMove(detached, idx, target).map((i, o) => ({ ...i, order: o + 1 })) };
        })
      ),
    []
  );

  const applySavedIds = useCallback((saved: PlanSaveIds) => {
    setDays((prev) =>
      prev.map((d) => {
        const match = saved.days.find((s) => s.weekNumber === d.weekNumber && s.order === d.order);
        if (!match) return d;
        return {
          ...d,
          entityId: match.id,
          items: d.items.map((it, idx) => {
            const im = match.items.find((s) => s.order === it.order) ?? match.items[idx];
            return im ? { ...it, entityId: im.id } : it;
          }),
        };
      }),
    );
  }, []);

  const swapItem = useCallback(
    (dayKey: string, itemKey: string, exerciseId: number) => {
      const exercise = getExerciseById(exerciseId);
      if (!exercise) return;
      setDays((prev) =>
        prev.map((d) => {
          if (d.key !== dayKey) return d;
          return {
            ...d,
            items: d.items.map((i) => {
              if (i.key !== itemKey) return i;
              const inheritMeasure = i.measureType === i.exerciseType;
              return {
                ...i,
                exerciseId: exercise.id,
                exerciseName: exercise.name,
                exerciseType: exercise.type,
                measureType: inheritMeasure ? exercise.type : i.measureType,
              };
            }),
          };
        }),
      );
    },
    [getExerciseById],
  );

  const toggleLink = useCallback(
    (dayKey: string, itemKey: string) =>
      setDays((prev) =>
        prev.map((d) => {
          if (d.key !== dayKey) return d;
          return {
            ...d,
            items: d.items.map((i) => (i.key === itemKey ? { ...i, linkedToNext: !i.linkedToNext } : i)),
          };
        })
      ),
    []
  );

  /** Łączy zaznaczone pozycje w superserię: zbiera je w ciągły blok i ustawia linkedToNext. */
  const linkSelected = useCallback((dayKey: string, itemKeys: string[]) => {
    if (itemKeys.length < 2) return;
    setDays((prev) =>
      prev.map((d) => {
        if (d.key !== dayKey) return d;
        const keySet = new Set(itemKeys);
        const selected = d.items.filter((i) => keySet.has(i.key));
        const rest = d.items.filter((i) => !keySet.has(i.key));
        const firstIdx = d.items.findIndex((i) => keySet.has(i.key));
        const insertAt = firstIdx === -1 ? rest.length : Math.min(firstIdx, rest.length);
        const rests = selected
          .map((i) => i.restBetweenSetsSeconds)
          .filter((r): r is number => r != null);
        const sharedRest = rests.length > 0 ? Math.max(...rests) : 90;
        const setCounts = selected.map((i) => i.sets).filter((n): n is number => n != null);
        const sharedSets = setCounts.length > 0 ? Math.max(...setCounts) : null;
        const linked = selected.map((i, idx) => ({
          ...i,
          linkedToNext: idx < selected.length - 1,
          restBetweenSetsSeconds: sharedRest,
          sets:
            sharedSets != null && i.prescribedSets.length === 0 && !i.setScheme
              ? sharedSets
              : i.sets,
        }));
        const items = [...rest];
        items.splice(insertAt, 0, ...linked);
        return { ...d, items: items.map((i, o) => ({ ...i, order: o + 1 })) };
      })
    );
  }, []);

  /** Rozłącza całą grupę superserii zawierającą itemKey. */
  const unlinkGroup = useCallback((dayKey: string, itemKey: string) => {
    setDays((prev) =>
      prev.map((d) => {
        if (d.key !== dayKey) return d;
        const idx = d.items.findIndex((i) => i.key === itemKey);
        if (idx === -1) return d;
        let start = idx;
        while (start > 0 && d.items[start - 1].linkedToNext) start--;
        let end = idx;
        while (end < d.items.length - 1 && d.items[end].linkedToNext) end++;
        return {
          ...d,
          items: d.items.map((i, iIdx) =>
            iIdx >= start && iIdx <= end ? { ...i, linkedToNext: false } : i
          ),
        };
      })
    );
  }, []);

  const setItemSets = useCallback(
    (dayKey: string, itemKey: string, sets: BuilderSet[]) =>
      patchItem(dayKey, itemKey, { prescribedSets: sets, ...aggregatesFromSets(sets) }),
    [patchItem]
  );

  /** Nowa seria kopiuje sąsiednią (rola, ciężar, powtórzenia, przerwa) — jak w Everfit. */
  const cloneNeighbourSet = (source: BuilderSet | undefined, order: number): BuilderSet => ({
    key: newKey(),
    order,
    reps: source?.reps ?? null,
    repsMax: source?.repsMax ?? null,
    durationSeconds: source?.durationSeconds ?? null,
    distanceMeters: source?.distanceMeters ?? null,
    loadKg: source?.loadKg ?? null,
    loadPercent: source?.loadPercent ?? null,
    percentOf: source?.percentOf ?? null,
    targetRpe: source?.targetRpe ?? null,
    targetRir: source?.targetRir ?? null,
    tempo: source?.tempo ?? null,
    role: source?.role ?? "work",
    note: null,
    restSeconds: source?.restSeconds ?? null,
  });

  const addSet = useCallback(
    (dayKey: string, itemKey: string) => {
      setDays((prev) =>
        prev.map((d) => {
          if (d.key !== dayKey) return d;
          return {
            ...d,
            items: d.items.map((item) => {
              if (item.key !== itemKey) return item;
              const last = item.prescribedSets[item.prescribedSets.length - 1];
              const next = [
                ...item.prescribedSets,
                cloneNeighbourSet(last, item.prescribedSets.length + 1),
              ];
              return withSyncedSets(item, next);
            }),
          };
        })
      );
    },
    []
  );

  /**
   * Wstawia serię dokładnie przed/po wskazanej — trener dopisuje 85 kg między 80 i 90
   * bez przepisywania kolejnych serii. Zwraca `key` nowej serii, żeby wołający mógł
   * ustawić fokus na jej ciężarze.
   */
  const insertSet = useCallback(
    (dayKey: string, itemKey: string, index: number, side: "before" | "after"): string => {
      const created = newKey();
      setDays((prev) =>
        prev.map((d) => {
          if (d.key !== dayKey) return d;
          return {
            ...d,
            items: d.items.map((item) => {
              if (item.key !== itemKey) return item;
              const at = side === "before" ? index : index + 1;
              const neighbour = item.prescribedSets[index];
              const inserted = { ...cloneNeighbourSet(neighbour, at + 1), key: created };
              const next = [...item.prescribedSets];
              next.splice(Math.max(0, Math.min(at, next.length)), 0, inserted);
              return withSyncedSets(
                item,
                next.map((s, o) => ({ ...s, order: o + 1 })),
              );
            }),
          };
        }),
      );
      return created;
    },
    [],
  );

  /** „Zastosuj do wszystkich serii” dla przerwy — jedno kliknięcie zamiast n edycji. */
  const applyRestToAllSets = useCallback(
    (dayKey: string, itemKey: string, seconds: number | null) => {
      setDays((prev) =>
        prev.map((d) =>
          d.key !== dayKey
            ? d
            : {
                ...d,
                items: d.items.map((i) =>
                  i.key !== itemKey
                    ? i
                    : {
                        ...i,
                        prescribedSets: i.prescribedSets.map((s) => ({ ...s, restSeconds: seconds })),
                      },
                ),
              },
        ),
      );
    },
    [],
  );

  const patchSet = useCallback(
    (dayKey: string, itemKey: string, setKey: string, patch: Partial<BuilderSet>) =>
      setDays((prev) =>
        prev.map((d) =>
          d.key !== dayKey
            ? d
            : {
                ...d,
                items: d.items.map((i) =>
                  i.key !== itemKey
                    ? i
                    : withSyncedSets(
                        i,
                        i.prescribedSets.map((s) => (s.key === setKey ? { ...s, ...patch } : s)),
                      )
                ),
              }
        )
      ),
    []
  );

  const removeSet = useCallback(
    (dayKey: string, itemKey: string, setKey: string) => {
      setDays((prev) => {
        const day = prev.find((d) => d.key === dayKey);
        const item = day?.items.find((i) => i.key === itemKey);
        const removedIndex = item?.prescribedSets.findIndex((s) => s.key === setKey) ?? -1;
        const removed = removedIndex >= 0 && item ? item.prescribedSets[removedIndex] : null;
        if (removed) {
          showUndoToast("Usunięto serię", () => {
            setDays((cur) =>
              cur.map((d) => {
                if (d.key !== dayKey) return d;
                return {
                  ...d,
                  items: d.items.map((i) => {
                    if (i.key !== itemKey) return i;
                    if (i.prescribedSets.some((s) => s.key === removed.key)) return i;
                    const next = [...i.prescribedSets];
                    next.splice(Math.min(removedIndex, next.length), 0, removed);
                    return withSyncedSets(i, next.map((s, o) => ({ ...s, order: o + 1 })));
                  }),
                };
              }),
            );
          });
        }
        return prev.map((d) =>
          d.key !== dayKey
            ? d
            : {
                ...d,
                items: d.items.map((i) =>
                  i.key !== itemKey
                    ? i
                    : withSyncedSets(
                        i,
                        i.prescribedSets
                          .filter((s) => s.key !== setKey)
                          .map((s, o) => ({ ...s, order: o + 1 })),
                      ),
                ),
              },
        );
      });
    },
    [showUndoToast],
  );

  const applyPreset = useCallback((dayKey: string, itemKey: string, presetId: string) => {
    setDays((prev) => {
      const day = prev.find((d) => d.key === dayKey);
      const item = day?.items.find((i) => i.key === itemKey);
      const previousSets = item?.prescribedSets ?? [];
      const previousScheme = item?.setScheme ?? null;
      const preset = PLAN_PRESETS.find((p) => p.id === presetId);
      if (!preset || !day) return prev;
      const sets: BuilderSet[] = preset.build(day.weekNumber).map((s) => ({ ...s, key: newKey() }));
      const setScheme = formatSchemeLabel(sets);
      if (previousSets.length > 0) {
        showUndoToast("Przywrócono poprzedni rozpis", () => {
          setDays((cur) =>
            cur.map((d) =>
              d.key !== dayKey
                ? d
                : {
                    ...d,
                    items: d.items.map((i) =>
                      i.key === itemKey
                        ? { ...withSyncedSets(i, previousSets), setScheme: previousScheme }
                        : i,
                    ),
                  },
            ),
          );
        });
      }
      return prev.map((d) =>
        d.key !== dayKey
          ? d
          : {
              ...d,
              items: d.items.map((i) =>
                i.key === itemKey ? { ...withSyncedSets(i, sets), setScheme } : i,
              ),
            },
      );
    });
  }, [showUndoToast]);

  const applyMethodToDraft = useCallback((id: MethodTemplateId) => {
    setDays((prev) => applyMethodTemplate(prev, id));
    setActiveWeek(1);
  }, []);

  const clearSets = useCallback(
    (dayKey: string, itemKey: string) => {
      setDays((prev) => {
        const day = prev.find((d) => d.key === dayKey);
        const item = day?.items.find((i) => i.key === itemKey);
        const previousSets = item?.prescribedSets ?? [];
        const previousScheme = item?.setScheme ?? null;
        if (previousSets.length > 0) {
          showUndoToast("Przywrócono serie", () => {
            setDays((cur) =>
              cur.map((d) =>
                d.key !== dayKey
                  ? d
                  : {
                      ...d,
                      items: d.items.map((i) =>
                        i.key === itemKey
                          ? { ...withSyncedSets(i, previousSets), setScheme: previousScheme }
                          : i,
                      ),
                    },
              ),
            );
          });
        }
        return prev.map((d) =>
          d.key !== dayKey
            ? d
            : {
                ...d,
                items: d.items.map((i) =>
                  i.key === itemKey ? { ...withSyncedSets(i, []), setScheme: i.setScheme } : i,
                ),
              },
        );
      });
    },
    [showUndoToast],
  );

  return {
    name,
    setName,
    description,
    setDescription,
    isTemplate,
    setIsTemplate,
    days,
    setDays,
    activeWeek,
    setActiveWeek,
    weeks,
    maxWeek,
    visibleDays,
    toastNode,
    showUndoToast,
    undo: history.undo,
    redo: history.redo,
    canUndo: history.canUndo,
    canRedo: history.canRedo,
    patchDay,
    addDay,
    addWeek,
    copyWeek,
    insertWeek,
    duplicateWeek,
    removeWeek,
    removeDay,
    duplicateDay,
    moveDay,
    moveItemTarget,
    applyWeekdaysToOtherWeeks,
    addItem,
    addItemAt,
    patchItem,
    removeItem,
    duplicateItem,
    moveItem,
    swapItem,
    applySavedIds,
    toggleLink,
    toggleWarmup,
    linkSelected,
    unlinkGroup,
    addSet,
    insertSet,
    applyRestToAllSets,
    patchSet,
    removeSet,
    applyPreset,
    applyMethodTemplate: applyMethodToDraft,
    clearSets,
    setItemSets,
  };
}
