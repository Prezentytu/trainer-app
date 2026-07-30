"use client";

import { useCallback, useMemo, useState } from "react";
import { arrayMove } from "@dnd-kit/sortable";
import { Exercise, Plan } from "@/lib/api";
import { PLAN_PRESETS } from "@/lib/planPresets";
import { useUndoToast } from "@/components/ui";
import { loadInitialDays } from "./loadInitialDays";
import { BuilderDay, BuilderItem, BuilderSet, newKey } from "./types";

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
  initialIsTemplate,
  initialDayCount,
  initialWeekCount,
  getExerciseById,
}: {
  plan?: Plan;
  initialName?: string;
  initialIsTemplate?: boolean;
  initialDayCount?: number;
  initialWeekCount?: number;
  getExerciseById: (id: number) => Exercise | undefined;
}) {
  const { showUndoToast, toastNode } = useUndoToast();

  const [name, setName] = useState(plan?.name ?? initialName ?? "");
  const [description, setDescription] = useState(plan?.description ?? "");
  const [isTemplate, setIsTemplate] = useState(plan?.isTemplate ?? initialIsTemplate ?? false);
  const [days, setDays] = useState<BuilderDay[]>(() => loadInitialDays(plan, initialDayCount, initialWeekCount));
  const [activeWeek, setActiveWeek] = useState<number>(() => {
    const initial = loadInitialDays(plan, initialDayCount, initialWeekCount);
    return initial.length ? Math.min(...initial.map((d) => d.weekNumber)) : 1;
  });

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
        { key: newKey(), weekNumber, order: inWeek + 1, label: `Dzień ${inWeek + 1}`, notes: null, items: [] },
      ];
    });
  }, []);

  const addWeek = useCallback(() => {
    const week = maxWeek + 1 || 1;
    addDay(week);
    setActiveWeek(week);
  }, [addDay, maxWeek]);

  const copyWeek = useCallback(
    (weekNumber: number, options?: { keepSets?: boolean; reapplyPresets?: boolean }) => {
      const keepSets = options?.keepSets ?? true;
      const reapplyPresets = options?.reapplyPresets ?? false;
      setDays((prev) => {
        const target = (prev.length ? Math.max(...prev.map((d) => d.weekNumber)) : 0) + 1;
        const clones = prev
          .filter((d) => d.weekNumber === weekNumber)
          .map((d) => ({
            ...d,
            key: newKey(),
            weekNumber: target,
            items: d.items.map((it) => {
              let prescribedSets = it.prescribedSets.map((s) => ({ ...s, key: newKey() }));
              let setScheme = it.setScheme;
              if (!keepSets) {
                prescribedSets = [];
                setScheme = null;
              } else if (reapplyPresets && it.setScheme) {
                const preset = PLAN_PRESETS.find((p) => p.label === it.setScheme || it.setScheme?.includes(p.id));
                const byLabel = PLAN_PRESETS.find((p) => it.setScheme?.includes("6-4-2") && p.id === "642531");
                const match = preset ?? byLabel;
                if (match) {
                  prescribedSets = match.build(target).map((s) => ({ ...s, key: newKey() }));
                  setScheme = match.label;
                }
              }
              return { ...it, key: newKey(), prescribedSets, setScheme };
            }),
          }));
        setActiveWeek(target);
        return [...prev, ...clones];
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

  const duplicateDay = useCallback((dayKey: string) => {
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
                    ...overrides,
                  },
                ],
              }
        )
      );
    },
    [getExerciseById]
  );

  const patchItem = useCallback(
    (dayKey: string, itemKey: string, patch: Partial<BuilderItem>) =>
      setDays((prev) =>
        prev.map((d) =>
          d.key !== dayKey ? d : { ...d, items: d.items.map((i) => (i.key === itemKey ? { ...i, ...patch } : i)) }
        )
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

          type Block = { start: number; end: number; num: number };
          const blocks: Block[] = [];
          let i = 0;
          const hasWarmup = d.items.some((it) => it.isWarmup);
          let nextNum = hasWarmup ? 0 : 1;
          while (i < d.items.length) {
            let end = i;
            while (end < d.items.length - 1 && d.items[end].linkedToNext) end++;
            blocks.push({ start: i, end, num: nextNum });
            nextNum++;
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
            ...options.overrides,
            isWarmup: warmupFlag,
          };

          const target = blocks.find((b) => b.num === options.positionNum);
          let nextItems = [...d.items];

          if (target) {
            // Dołącz do istniejącej pozycji (superseria) albo wstaw za nią jako nowy człon
            nextItems = nextItems.map((it, idx) => {
              if (idx >= target.start && idx <= target.end) {
                return {
                  ...it,
                  isWarmup: warmupFlag,
                  linkedToNext: idx === target.end ? true : it.linkedToNext,
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
    [getExerciseById]
  );

  const removeItem = useCallback(
    (dayKey: string, itemKey: string) =>
      setDays((prev) =>
        prev.map((d) =>
          d.key !== dayKey
            ? d
            : {
                ...d,
                items: detachLinks(d.items, itemKey)
                  .filter((i) => i.key !== itemKey)
                  .map((i, idx) => ({ ...i, order: idx + 1 })),
              }
        )
      ),
    []
  );

  const moveItem = useCallback(
    (dayKey: string, itemKey: string, dir: -1 | 1) =>
      setDays((prev) =>
        prev.map((d) => {
          if (d.key !== dayKey) return d;
          const idx = d.items.findIndex((i) => i.key === itemKey);
          const target = idx + dir;
          if (idx === -1 || target < 0 || target >= d.items.length) return d;
          return { ...d, items: arrayMove(d.items, idx, target).map((i, o) => ({ ...i, order: o + 1 })) };
        })
      ),
    []
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
        const linked = selected.map((i, idx) => ({
          ...i,
          linkedToNext: idx < selected.length - 1,
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
    (dayKey: string, itemKey: string, sets: BuilderSet[]) => patchItem(dayKey, itemKey, { prescribedSets: sets }),
    [patchItem]
  );

  const addSet = useCallback(
    (dayKey: string, itemKey: string) => {
      setDays((prev) =>
        prev.map((d) => {
          if (d.key !== dayKey) return d;
          return {
            ...d,
            items: d.items.map((item) => {
              if (item.key !== itemKey) return item;
              return {
                ...item,
                prescribedSets: [
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
                ],
              };
            }),
          };
        })
      );
    },
    []
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
                    : {
                        ...i,
                        prescribedSets: i.prescribedSets.map((s) => (s.key === setKey ? { ...s, ...patch } : s)),
                      }
                ),
              }
        )
      ),
    []
  );

  const removeSet = useCallback((dayKey: string, itemKey: string, setKey: string) => {
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
                      prescribedSets: i.prescribedSets
                        .filter((s) => s.key !== setKey)
                        .map((s, idx) => ({ ...s, order: idx + 1 })),
                    }
              ),
            }
      )
    );
  }, []);

  const applyPreset = useCallback((dayKey: string, itemKey: string, presetId: string) => {
    setDays((prev) =>
      prev.map((d) => {
        if (d.key !== dayKey) return d;
        const preset = PLAN_PRESETS.find((p) => p.id === presetId);
        if (!preset) return d;
        const sets: BuilderSet[] = preset.build(d.weekNumber).map((s) => ({ ...s, key: newKey() }));
        return {
          ...d,
          items: d.items.map((i) =>
            i.key === itemKey ? { ...i, prescribedSets: sets, setScheme: preset.label } : i
          ),
        };
      })
    );
  }, []);

  const clearSets = useCallback(
    (dayKey: string, itemKey: string) => setItemSets(dayKey, itemKey, []),
    [setItemSets]
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
    patchDay,
    addDay,
    addWeek,
    copyWeek,
    removeDay,
    duplicateDay,
    addItem,
    addItemAt,
    patchItem,
    removeItem,
    moveItem,
    toggleLink,
    toggleWarmup,
    linkSelected,
    unlinkGroup,
    addSet,
    patchSet,
    removeSet,
    applyPreset,
    clearSets,
    setItemSets,
  };
}
