/** Pasek kalendarzowy tygodnia (P–N) dla ekranu Dziś. */

export type WeekStripDay = {
  label: string;
  done: boolean;
  today: boolean;
};

const LABELS = ["P", "W", "Ś", "C", "P", "S", "N"] as const;

function toIsoLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Poniedziałek bieżącego tygodnia (lokalnie). */
function mondayOf(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(12, 0, 0, 0);
  const day = copy.getDay(); // 0=nd
  const diff = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + diff);
  return copy;
}

/**
 * @param completedDates ISO YYYY-MM-dd ukończonych sesji
 * @param todayCompleted czy dzisiejszy trening jest już ukończony (np. po summary)
 */
export function buildWeekStrip(
  completedDates: string[],
  todayCompleted = false,
): WeekStripDay[] {
  const now = new Date();
  now.setHours(12, 0, 0, 0);
  const monday = mondayOf(now);
  const todayIso = toIsoLocal(now);
  const doneSet = new Set(completedDates);

  return LABELS.map((label, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const iso = toIsoLocal(d);
    const today = iso === todayIso;
    const done = doneSet.has(iso) || (today && todayCompleted);
    return { label, done, today };
  });
}
