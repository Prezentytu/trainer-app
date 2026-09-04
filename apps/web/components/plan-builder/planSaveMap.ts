import { PlanSaveIds } from "@/lib/api";
import { BuilderDay } from "./types";

/** Drugi dzień/pozycja z tym samym Id idzie jako insert — nie wolno scalać. */
export function stripDuplicateEntityIds(days: BuilderDay[]): BuilderDay[] {
  const seenDays = new Set<number>();
  const seenItems = new Set<number>();
  return days.map((d) => {
    let entityId = d.entityId;
    if (entityId != null && seenDays.has(entityId)) entityId = undefined;
    else if (entityId != null) seenDays.add(entityId);
    return {
      ...d,
      entityId,
      items: d.items.map((it) => {
        let itemId = it.entityId;
        if (itemId != null && seenItems.has(itemId)) itemId = undefined;
        else if (itemId != null) seenItems.add(itemId);
        return { ...it, entityId: itemId };
      }),
    };
  });
}

/**
 * Id z odpowiedzi PUT przypisujemy wyłącznie do `key` ze snapshotu wysłanego
 * w tamtym requeście — nigdy do bieżącego draftu po (tydzień, kolejność).
 */
export function mapSavedIdsByClientKey(
  snapshot: BuilderDay[],
  saved: PlanSaveIds,
): { dayIds: Map<string, number>; itemIds: Map<string, number> } {
  const dayIds = new Map<string, number>();
  const itemIds = new Map<string, number>();
  const usedDayIds = new Set<number>();

  for (const day of snapshot) {
    const match = saved.days.find(
      (s) =>
        s.weekNumber === day.weekNumber &&
        s.order === day.order &&
        !usedDayIds.has(s.id),
    );
    if (!match) continue;
    usedDayIds.add(match.id);
    dayIds.set(day.key, match.id);
    const usedItemIds = new Set<number>();
    for (const item of day.items) {
      const im =
        match.items.find((s) => s.order === item.order && !usedItemIds.has(s.id)) ??
        match.items.find((s) => !usedItemIds.has(s.id));
      if (!im) continue;
      usedItemIds.add(im.id);
      itemIds.set(item.key, im.id);
    }
  }
  return { dayIds, itemIds };
}

export function applySavedIdMap(
  days: BuilderDay[],
  dayIds: Map<string, number>,
  itemIds: Map<string, number>,
): BuilderDay[] {
  return days.map((d) => ({
    ...d,
    entityId: dayIds.get(d.key) ?? d.entityId,
    items: d.items.map((it) => ({
      ...it,
      entityId: itemIds.get(it.key) ?? it.entityId,
    })),
  }));
}
