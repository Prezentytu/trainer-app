import { BuilderDay, BuilderItem, newKey } from "./types";

function reorderItems(items: BuilderItem[]): BuilderItem[] {
  return items.map((i, idx) => ({ ...i, order: idx + 1 }));
}

function reorderDaysInWeeks(days: BuilderDay[]): BuilderDay[] {
  const counters = new Map<number, number>();
  return days.map((d) => {
    const next = (counters.get(d.weekNumber) ?? 0) + 1;
    counters.set(d.weekNumber, next);
    return { ...d, order: next };
  });
}

/** Rozłącza superserię wokół pozycji — ćwiczenie zmieniające dzień nie może ciągnąć partnera. */
function detachAround(items: BuilderItem[], itemKey: string): BuilderItem[] {
  return items.map((it, idx) => {
    if (it.key === itemKey) return { ...it, linkedToNext: false };
    if (items[idx + 1]?.key === itemKey && it.linkedToNext) return { ...it, linkedToNext: false };
    return it;
  });
}

/**
 * Numery tygodni zawsze ciągłe `1…N`. Stan „tydzień 2 i 5” jest błędem — po każdej operacji
 * strukturalnej i po wczytaniu starego planu przenumerowujemy, zachowując kolejność tygodni.
 */
export function normalizeWeeks(days: BuilderDay[]): BuilderDay[] {
  const present = [...new Set(days.map((d) => d.weekNumber))].sort((a, b) => a - b);
  const alreadyContiguous = present.every((w, idx) => w === idx + 1);
  if (alreadyContiguous) return days;
  const mapping = new Map(present.map((w, idx) => [w, idx + 1]));
  return days.map((d) => ({ ...d, weekNumber: mapping.get(d.weekNumber) ?? d.weekNumber }));
}

/** Przenosi ćwiczenie w obrębie dnia albo do innego dnia, na wskazany indeks. */
export function moveItemTo(
  days: BuilderDay[],
  from: { dayKey: string; itemKey: string },
  to: { dayKey: string; index: number },
): BuilderDay[] {
  const sourceDay = days.find((d) => d.key === from.dayKey);
  const moving = sourceDay?.items.find((i) => i.key === from.itemKey);
  if (!sourceDay || !moving) return days;

  const sameDay = from.dayKey === to.dayKey;
  const oldIndex = sourceDay.items.findIndex((i) => i.key === from.itemKey);
  let targetIndex = to.index;
  if (sameDay && oldIndex !== -1 && oldIndex < targetIndex) targetIndex -= 1;

  return days.map((d) => {
    if (d.key === from.dayKey && sameDay) {
      const rest = detachAround(d.items, from.itemKey).filter((i) => i.key !== from.itemKey);
      const next = [...rest];
      next.splice(Math.max(0, Math.min(targetIndex, next.length)), 0, { ...moving, linkedToNext: false });
      return { ...d, items: reorderItems(next) };
    }
    if (d.key === from.dayKey) {
      const rest = detachAround(d.items, from.itemKey).filter((i) => i.key !== from.itemKey);
      return { ...d, items: reorderItems(rest) };
    }
    if (d.key === to.dayKey) {
      const next = [...d.items];
      next.splice(Math.max(0, Math.min(targetIndex, next.length)), 0, {
        ...moving,
        linkedToNext: false,
        isWarmup: false,
      });
      return { ...d, items: reorderItems(next) };
    }
    return d;
  });
}

/**
 * Przenosi cały dzień do innego tygodnia (lub na inną pozycję w tym samym).
 * Zachowuje `entityId`, więc backend zaktualizuje ten sam `PlanDay`, a nie utworzy duplikatu.
 */
export function moveDayTo(
  days: BuilderDay[],
  dayKey: string,
  target: { weekNumber: number; index?: number },
): BuilderDay[] {
  const moving = days.find((d) => d.key === dayKey);
  if (!moving) return days;

  const rest = days.filter((d) => d.key !== dayKey);
  const inTargetWeek = rest
    .filter((d) => d.weekNumber === target.weekNumber)
    .sort((a, b) => a.order - b.order);
  const at = target.index ?? inTargetWeek.length;
  const reordered = [...inTargetWeek];
  reordered.splice(Math.max(0, Math.min(at, reordered.length)), 0, {
    ...moving,
    weekNumber: target.weekNumber,
  });

  const others = rest.filter((d) => d.weekNumber !== target.weekNumber);
  const merged = [...others, ...reordered].sort(
    (a, b) => a.weekNumber - b.weekNumber || a.order - b.order,
  );
  return normalizeWeeks(reorderDaysInWeeks(merged));
}

/** Wstawia pusty tydzień przed/po wskazanym; kolejne numery przesuwają się o jeden. */
export function insertWeek(
  days: BuilderDay[],
  weekNumber: number,
  side: "before" | "after",
): { days: BuilderDay[]; weekNumber: number } {
  const target = side === "before" ? weekNumber : weekNumber + 1;
  const shifted = days.map((d) =>
    d.weekNumber >= target ? { ...d, weekNumber: d.weekNumber + 1 } : d,
  );
  const fresh: BuilderDay = {
    key: newKey(),
    weekNumber: target,
    order: 1,
    label: "Dzień 1",
    notes: null,
    dayOfWeek: null,
    items: [],
  };
  return { days: normalizeWeeks([...shifted, fresh]), weekNumber: target };
}

/** Usuwa cały tydzień i domyka numerację. */
export function removeWeek(days: BuilderDay[], weekNumber: number): BuilderDay[] {
  return normalizeWeeks(days.filter((d) => d.weekNumber !== weekNumber));
}

/**
 * Duplikuje tydzień zaraz za oryginałem. Klony gubią `entityId` — inaczej zapis
 * nadpisałby dni źródłowe zamiast utworzyć nowe.
 */
export function duplicateWeek(
  days: BuilderDay[],
  weekNumber: number,
): { days: BuilderDay[]; weekNumber: number } {
  const target = weekNumber + 1;
  const shifted = days.map((d) =>
    d.weekNumber >= target ? { ...d, weekNumber: d.weekNumber + 1 } : d,
  );
  const clones = days
    .filter((d) => d.weekNumber === weekNumber)
    .sort((a, b) => a.order - b.order)
    .map((d) => ({
      ...d,
      key: newKey(),
      entityId: undefined,
      weekNumber: target,
      items: d.items.map((it) => ({
        ...it,
        key: newKey(),
        entityId: undefined,
        prescribedSets: it.prescribedSets.map((s) => ({ ...s, key: newKey() })),
      })),
    }));
  return { days: normalizeWeeks([...shifted, ...clones]), weekNumber: target };
}
