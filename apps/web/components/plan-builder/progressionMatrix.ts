import { formatRepRange } from "@/lib/measure";
import { BuilderDay, BuilderItem, BuilderSet } from "./types";

export type ProgressionCell = {
  weekNumber: number;
  dayKey: string;
  item: BuilderItem;
  /** Ciężar serii szczytowej — to on progresuje między tygodniami. */
  topKg: number | null;
  /** Objętość w skrócie, np. `4×5` — kontekst pod ciężarem. */
  volumeLabel: string;
};

export type ProgressionRow = {
  /** Klucz wiersza: ta sama pozycja dnia + to samo ćwiczenie w kolejnych tygodniach. */
  key: string;
  dayOrder: number;
  dayLabel: string;
  exerciseId: number;
  exerciseName: string;
  cellsByWeek: Map<number, ProgressionCell>;
};

/** Seria szczytowa: jawna rola `top`, inaczej ostatnia seria z ciężarem. */
export function findTopSet(item: BuilderItem): BuilderSet | null {
  const sets = item.prescribedSets ?? [];
  return (
    sets.find((s) => s.role === "top") ??
    [...sets].reverse().find((s) => s.loadKg != null) ??
    null
  );
}

export function readTopKg(item: BuilderItem): number | null {
  return findTopSet(item)?.loadKg ?? item.loadKg ?? null;
}

function volumeLabel(item: BuilderItem): string {
  const top = findTopSet(item);
  const reps = formatRepRange(top?.reps ?? item.reps ?? null, top?.repsMax ?? item.repsMax ?? null);
  const count = item.prescribedSets.length || item.sets || 0;
  if (reps === "") return count > 0 ? `${count}×` : "";
  return count > 0 ? `${count}×${reps}` : reps;
}

/**
 * Patch ustawiający ciężar serii szczytowej. Gdy pozycja ma rozpisane serie, zmieniamy
 * tę jedną serię; bez rozpisu wpisujemy ciężar całej pozycji. Serie procentowe zostają
 * procentowe — przeliczą się same od nowego topu.
 */
export function topLoadPatch(item: BuilderItem, kg: number | null): Partial<BuilderItem> {
  const top = findTopSet(item);
  if (!top) return { loadKg: kg };
  const sets = item.prescribedSets.map((s) =>
    s.key === top.key ? { ...s, loadKg: kg, loadPercent: null, percentOf: null } : s,
  );
  // Zbiorczy ciężar pozycji ma sens tylko wtedy, gdy wszystkie serie mają ten sam.
  const uniform = sets.every((s) => s.loadKg === sets[0].loadKg);
  return uniform ? { prescribedSets: sets, loadKg: sets[0].loadKg ?? null } : { prescribedSets: sets };
}

/** Wiersze macierzy: pozycja dnia × ćwiczenie, kolumny = tygodnie. */
export function buildProgressionRows(days: BuilderDay[]): ProgressionRow[] {
  const rows = new Map<string, ProgressionRow>();

  for (const day of [...days].sort((a, b) => a.weekNumber - b.weekNumber || a.order - b.order)) {
    // Ten sam ćwiczenie może wystąpić w dniu dwa razy — rozróżniamy je licznikiem.
    const seen = new Map<number, number>();
    for (const item of day.items) {
      const occurrence = (seen.get(item.exerciseId) ?? 0) + 1;
      seen.set(item.exerciseId, occurrence);
      const key = `${day.order}:${item.exerciseId}:${occurrence}`;
      const row =
        rows.get(key) ??
        {
          key,
          dayOrder: day.order,
          dayLabel: day.label.trim() || `Dzień ${day.order}`,
          exerciseId: item.exerciseId,
          exerciseName: item.exerciseName,
          cellsByWeek: new Map<number, ProgressionCell>(),
        };
      row.cellsByWeek.set(day.weekNumber, {
        weekNumber: day.weekNumber,
        dayKey: day.key,
        item,
        topKg: readTopKg(item),
        volumeLabel: volumeLabel(item),
      });
      rows.set(key, row);
    }
  }

  return [...rows.values()].sort(
    (a, b) => a.dayOrder - b.dayOrder || a.key.localeCompare(b.key),
  );
}
