import { PlanItem } from "@/lib/api";
import { groupConsecutiveBySuperset } from "@/lib/supersets";

const OPEN_RAMP_SET_FALLBACK = 5;

function isRampScheme(setScheme: string | null | undefined): boolean {
  return !!setScheme && /rampa/i.test(setScheme);
}

function itemSetCount(item: PlanItem): number {
  if (isRampScheme(item.setScheme)) {
    const boCount = item.prescribedSets.filter(
      (s) => (s.role ?? "").toLowerCase() === "backoff",
    ).length;
    const rampSets = item.overrides?.sets ?? OPEN_RAMP_SET_FALLBACK;
    return rampSets + boCount;
  }
  if (item.prescribedSets.length > 0) return item.prescribedSets.length;
  return item.sets || 3;
}

function itemWorkSeconds(item: PlanItem): number {
  return item.repDurationSeconds ?? 40;
}

function itemRestSeconds(item: PlanItem): number {
  return item.restBetweenSetsSeconds ?? 60;
}

/** Heurystyka czasu dnia. Superseria: seria pary = suma pracy członków + 1 przerwa (bez restu po ostatniej pracy dnia). */
export function estimateDayMinutes(items: PlanItem[]): number {
  const blocks = groupConsecutiveBySuperset(items, (it) => it.supersetGroup);
  let seconds = 0;

  for (let b = 0; b < blocks.length; b++) {
    const block = blocks[b];
    const isLastBlock = b === blocks.length - 1;

    if (!block.multi) {
      const item = block.items[0];
      const rest = itemRestSeconds(item);
      const work = itemWorkSeconds(item);
      const sets = itemSetCount(item);
      seconds += sets * work;
      seconds += rest * (isLastBlock ? Math.max(0, sets - 1) : sets);
      seconds += item.restAfterExerciseSeconds ?? 0;
      continue;
    }

    const rounds = Math.max(...block.items.map(itemSetCount), 0);
    const groupRest = Math.max(...block.items.map(itemRestSeconds), 0);
    for (const item of block.items) {
      seconds += itemSetCount(item) * itemWorkSeconds(item);
    }
    const restAfterRounds = isLastBlock ? Math.max(0, rounds - 1) : rounds;
    seconds += groupRest * restAfterRounds;
  }
  const minutes = Math.round(seconds / 60);
  if (minutes <= 0) return 5;
  return Math.max(5, Math.round(minutes / 5) * 5);
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
