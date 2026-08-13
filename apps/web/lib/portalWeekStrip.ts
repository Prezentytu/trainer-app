/** Pasek kalendarzowy tygodnia (P–N) dla ekranu Dziś. Slot = data, nie dzień planu. */

import type { PortalSessionSummary, PortalWeekDay } from "@/lib/api";
import { weekdayIndexFromLabel } from "@/lib/dates";

export type WeekStripDay = {
  label: string;
  iso: string;
  dayOfMonth: number;
  done: boolean;
  today: boolean;
  isFuture: boolean;
  /** Ukończone sesje z tej daty (kolejność wykonania). */
  sessions: PortalSessionSummary[];
  /** Dzień planu przypięty do tego slotu kalendarza (gdy etykiety to dni tygodnia). */
  planDay?: PortalWeekDay | null;
  /** Czy slot ma przypisany trening z planu. */
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

function dateKey(iso: string): string {
  return iso.slice(0, 10);
}

/**
 * Czy lista dni planu da się zmapować na dni tygodnia (co najmniej jeden rozpoznany label).
 */
export function planDaysMapToWeekdays(week: PortalWeekDay[] | null | undefined): boolean {
  if (!week?.length) return false;
  return week.some((d) => weekdayIndexFromLabel(d.label) != null);
}

/**
 * @param sessions ukończone sesje klienta (dowolna kolejność)
 * @param week dni planu z home (opcjonalnie — mapowanie na sloty P–N jako zapowiedź)
 * @param now punkt „dziś” (testy)
 */
export function buildWeekStrip(
  sessions: PortalSessionSummary[],
  week?: PortalWeekDay[] | null,
  now: Date = new Date(),
): WeekStripDay[] {
  const cursor = new Date(now);
  cursor.setHours(12, 0, 0, 0);
  const monday = mondayOf(cursor);
  const todayIso = toIsoLocal(cursor);

  const byDate = new Map<string, PortalSessionSummary[]>();
  for (const s of sessions) {
    const key = dateKey(s.performedOn);
    const bucket = byDate.get(key);
    if (bucket) bucket.push(s);
    else byDate.set(key, [s]);
  }
  for (const bucket of byDate.values()) {
    bucket.sort((a, b) => a.id - b.id);
  }

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
    const daySessions = byDate.get(iso) ?? [];
    return {
      label,
      iso,
      dayOfMonth: d.getDate(),
      done: daySessions.length > 0,
      today,
      isFuture: iso > todayIso,
      sessions: daySessions,
      planDay,
      hasPlanDay: planDay != null,
    };
  });
}

/** Czy slot otwiera panel (wyniki, rozpis albo pusty dzień w przeszłości). */
export function weekStripDayClickable(d: WeekStripDay): boolean {
  if (d.sessions.length > 0 || d.hasPlanDay) return true;
  return !d.isFuture;
}

/** Slot z listy dni planu (gdy etykiety nie mapują się na P–N). */
export function weekStripDayFromPlanDay(
  d: PortalWeekDay,
  sessions: PortalSessionSummary[],
): WeekStripDay {
  const last = d.lastCompletedSessionId
    ? sessions.find((s) => s.id === d.lastCompletedSessionId)
    : undefined;
  const key = last?.performedOn.slice(0, 10) ?? "";
  const daySessions = key
    ? sessions.filter((s) => s.performedOn.slice(0, 10) === key).sort((a, b) => a.id - b.id)
    : [];
  return {
    label: d.label,
    iso: key,
    dayOfMonth: key ? Number(key.slice(8, 10)) || 0 : 0,
    done: daySessions.length > 0,
    today: d.isToday,
    isFuture: false,
    sessions: daySessions,
    planDay: d,
    hasPlanDay: true,
  };
}
