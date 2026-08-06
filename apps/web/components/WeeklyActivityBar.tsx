"use client";

import { formatDayShort } from "@/lib/dates";

function startOfWeekMonday(d: Date): Date {
  const day = d.getDay(); // 0=nd
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setHours(12, 0, 0, 0);
  monday.setDate(monday.getDate() + diff);
  return monday;
}

function toIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function workoutsLabel(n: number): string {
  if (n === 1) return "1 trening";
  const lastDigit = n % 10;
  const lastTwo = n % 100;
  if (lastDigit >= 2 && lastDigit <= 4 && (lastTwo < 12 || lastTwo > 14)) {
    return `${n} treningi`;
  }
  return `${n} treningów`;
}

/** Mini-słupki aktywności: ostatnie N tygodni (pn–nd) z liczbą ukończonych treningów. */
export function WeeklyActivityBar({
  dates,
  weeks = 8,
}: {
  /** Daty ukończonych sesji (ISO YYYY-MM-DD). */
  dates: string[];
  weeks?: number;
}) {
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const thisMonday = startOfWeekMonday(today);

  const weekCounts: { mondayIso: string; count: number; isCurrent: boolean }[] = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const monday = new Date(thisMonday);
    monday.setDate(thisMonday.getDate() - i * 7);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    const mondayIso = toIso(monday);
    const sundayIso = toIso(sunday);
    const count = dates.filter((d) => d >= mondayIso && d <= sundayIso).length;
    weekCounts.push({ mondayIso, count, isCurrent: i === 0 });
  }

  const max = Math.max(1, ...weekCounts.map((w) => w.count));
  const thisWeek = weekCounts[weekCounts.length - 1]?.count ?? 0;
  const first = weekCounts[0];
  const last = weekCounts[weekCounts.length - 1];

  return (
    <div className="min-w-0">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-display text-sm font-semibold text-foreground">Aktywność</h3>
        <span className="text-sm text-muted">
          {workoutsLabel(thisWeek)} w tym tygodniu
        </span>
      </div>

      <div className="flex h-28 items-end gap-1.5 sm:gap-2">
        {weekCounts.map((w) => {
          const heightPct = w.count === 0 ? 0 : Math.max(12, Math.round((w.count / max) * 100));
          return (
            <div key={w.mondayIso} className="flex min-w-0 flex-1 flex-col items-center gap-1">
              <span className="font-mono text-xs tabular-nums text-muted">
                {w.count > 0 ? w.count : "\u00a0"}
              </span>
              <div className="flex h-20 w-full items-end justify-center">
                <div
                  title={`${formatDayShort(w.mondayIso)}: ${workoutsLabel(w.count)}`}
                  className={`w-full max-w-8 rounded-md transition-[height] duration-[var(--dur-fast)] ${
                    w.count === 0
                      ? "h-1 bg-surface-active"
                      : w.isCurrent
                        ? "bg-invert-bg"
                        : "bg-surface-active"
                  }`}
                  style={w.count > 0 ? { height: `${heightPct}%` } : undefined}
                />
              </div>
            </div>
          );
        })}
      </div>

      {first && last ? (
        <div className="mt-2 flex justify-between text-xs text-muted">
          <span>{formatDayShort(first.mondayIso)}</span>
          <span>{formatDayShort(last.mondayIso)}</span>
        </div>
      ) : null}
    </div>
  );
}
