import { PlanItem } from "@/lib/api";
import { groupConsecutiveBySuperset } from "@/lib/supersets";

const OPEN_RAMP_SET_FALLBACK = 5;

export type DurationLike = {
  setScheme?: string | null;
  prescribedSets?: { role?: string | null; restSeconds?: number | null }[];
  overrides?: { sets?: number | null } | null;
  sets?: number | null;
  restBetweenSetsSeconds?: number | null;
  restAfterExerciseSeconds?: number | null;
  repDurationSeconds?: number | null;
};

function isRampScheme(setScheme: string | null | undefined): boolean {
  return !!setScheme && /rampa/i.test(setScheme);
}

function itemSetCount(item: DurationLike): number {
  if (isRampScheme(item.setScheme)) {
    const boCount = (item.prescribedSets ?? []).filter(
      (s) => (s.role ?? "").toLowerCase() === "backoff",
    ).length;
    const rampSets = item.overrides?.sets ?? item.sets ?? OPEN_RAMP_SET_FALLBACK;
    return rampSets + boCount;
  }
  if ((item.prescribedSets?.length ?? 0) > 0) return item.prescribedSets!.length;
  return item.sets || 3;
}

function itemWorkSeconds(item: DurationLike): number {
  return item.repDurationSeconds ?? 40;
}

function itemRestSeconds(item: DurationLike): number {
  return item.restBetweenSetsSeconds ?? 60;
}

/**
 * Suma przerw ćwiczenia. Rozpisane serie mogą mieć własne przerwy (rozgrzewka 45 s,
 * robocze 180 s), więc sumujemy je zamiast mnożyć jedną wartość przez liczbę serii.
 * `count` to liczba przerw do policzenia (bez przerwy po ostatniej serii, gdy to koniec).
 */
function itemRestTotal(item: DurationLike, count: number): number {
  if (count <= 0) return 0;
  const fallback = itemRestSeconds(item);
  const sets = item.prescribedSets ?? [];
  if (sets.length === 0) return fallback * count;
  let total = 0;
  for (let i = 0; i < count; i++) {
    total += sets[i]?.restSeconds ?? fallback;
  }
  return total;
}

function roundMinutes(seconds: number): number {
  const minutes = Math.round(seconds / 60);
  if (minutes <= 0) return 5;
  return Math.max(5, Math.round(minutes / 5) * 5);
}

/** Heurystyka czasu. Superseria: seria pary = suma pracy członków + 1 przerwa (bez restu po ostatniej pracy). */
export function estimateItemsMinutes(
  items: DurationLike[],
  groupOf: (item: DurationLike, index: number) => number | null,
): number {
  const tagged = items.map((item, index) => ({ item, group: groupOf(item, index) }));
  const blocks = groupConsecutiveBySuperset(tagged, (row) => row.group);
  let seconds = 0;

  for (let b = 0; b < blocks.length; b++) {
    const block = blocks[b];
    const isLastBlock = b === blocks.length - 1;
    const blockItems = block.items.map((row) => row.item);

    if (!block.multi) {
      const item = blockItems[0];
      const work = itemWorkSeconds(item);
      const sets = itemSetCount(item);
      seconds += sets * work;
      seconds += itemRestTotal(item, isLastBlock ? Math.max(0, sets - 1) : sets);
      seconds += item.restAfterExerciseSeconds ?? 0;
      continue;
    }

    const rounds = Math.max(...blockItems.map(itemSetCount), 0);
    const groupRest = Math.max(...blockItems.map(itemRestSeconds), 0);
    for (const item of blockItems) {
      seconds += itemSetCount(item) * itemWorkSeconds(item);
    }
    const restAfterRounds = isLastBlock ? Math.max(0, rounds - 1) : rounds;
    seconds += groupRest * restAfterRounds;
  }
  return roundMinutes(seconds);
}

export function estimateDayMinutes(items: PlanItem[]): number {
  return estimateItemsMinutes(items, (_item, index) => items[index]?.supersetGroup ?? null);
}

export function formatDurationApprox(minutes: number): string {
  if (minutes < 60) return `~${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `~${h} h` : `~${h} h ${m} min`;
}

/** Realny czas sesji → „42 min" / „1 h 5 min". */
export function formatDurationMinutes(seconds: number | null | undefined): string | null {
  if (seconds == null || seconds <= 0) return null;
  const minutes = Math.max(1, Math.round(seconds / 60));
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}
