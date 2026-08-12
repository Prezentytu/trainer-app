/** Pasek kalendarzowy tygodnia (P–N) dla ekranu Dziś. */

import type { PortalWeekDay } from "@/lib/api";
import { weekdayIndexFromLabel } from "@/lib/dates";

export type WeekStripDay = {
  label: string;
  done: boolean;
  today: boolean;
  /** Dzień planu przypięty do tego slotu kalendarza (gdy etykiety to dni tygodnia). */
  planDay?: PortalWeekDay | null;
  /** Czy slot ma przypisany trening z planu (klikalny). */
  hasPlanDay: boolean;
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
 * Czy lista dni planu da się zmapować na dni tygodnia (co najmniej jeden rozpoznany label).
 */
export function planDaysMapToWeekdays(week: PortalWeekDay[] | null | undefined): boolean {
  if (!week?.length) return false;
  return week.some((d) => weekdayIndexFromLabel(d.label) != null);
}

/**
 * @param completedDates ISO YYYY-MM-dd ukończonych sesji
 * @param todayCompleted czy dzisiejszy trening jest już ukończony (np. po summary)
 * @param week dni planu z home (opcjonalnie — mapowanie na sloty P–N)
 */
export function buildWeekStrip(
  completedDates: string[],
  todayCompleted = false,
  week?: PortalWeekDay[] | null,
): WeekStripDay[] {
  const now = new Date();
  now.setHours(12, 0, 0, 0);
  const monday = mondayOf(now);
  const todayIso = toIsoLocal(now);
  const doneSet = new Set(completedDates);

  const due = week?.find((d) => d.isToday) ?? null;
  const focusWeekNumber = due?.weekNumber ?? week?.[0]?.weekNumber ?? null;
  const planByWeekday = new Map<number, PortalWeekDay>();
  if (week && focusWeekNumber != null) {
    for (const d of week) {
      if (d.weekNumber !== focusWeekNumber) continue;
      const idx = weekdayIndexFromLabel(d.label);
      if (idx == null) continue;
      // Pierwszy wygrywa — unika nadpisania przy duplikatach etykiet.
      if (!planByWeekday.has(idx)) planByWeekday.set(idx, d);
    }
  }

  return LABELS.map((label, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const iso = toIsoLocal(d);
    const today = iso === todayIso;
    const planDay = planByWeekday.get(i) ?? null;
    const done =
      planDay != null
        ? planDay.completed || doneSet.has(iso) || (today && todayCompleted)
        : doneSet.has(iso) || (today && todayCompleted);
    return {
      label,
      done,
      today,
      planDay,
      hasPlanDay: planDay != null,
    };
  });
}
