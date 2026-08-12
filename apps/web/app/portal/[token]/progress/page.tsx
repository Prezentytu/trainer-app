"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  api,
  ClientRecord,
  ClientTrendsResponse,
  ExerciseStats,
  MostImproved,
  MuscleVolumeResponse,
  PortalSessionSummary,
  StagnationResponse,
} from "@/lib/api";
import { Card, EmptyState, ErrorBanner, SegmentedControl, StatBlock } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { PortalPageSkeleton } from "@/components/skeletons";
import { WeeklyActivityBar } from "@/components/WeeklyActivityBar";
import { MuscleVolumeBars } from "@/components/MuscleVolumeBars";
import { LineChart } from "@/components/charts/LineChart";
import { TrendSparkline } from "@/components/TrendSparkline";
import { RepMaxList } from "@/components/RepMaxList";
import { formatDayShort } from "@/lib/dates";
import { formatKg } from "@/lib/plates";

function startOfWeekMonday(d: Date): Date {
  const day = d.getDay();
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

function formatDay(iso: string): string {
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("pl-PL", { day: "numeric", month: "short", year: "numeric" });
}

function formatAvgDuration(seconds: number | null): { value: string; unit: string } {
  if (seconds == null || seconds <= 0) return { value: "—", unit: "" };
  const mins = Math.round(seconds / 60);
  if (mins < 60) return { value: String(mins), unit: "min" };
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? { value: String(h), unit: "h" } : { value: `${h}:${String(m).padStart(2, "0")}`, unit: "h" };
}

function SectionHeader({
  title,
  window,
  action,
}: {
  title: string;
  /** Sufiks okna czasowego, np. „12 TYG." — mono caps po prawej. */
  window?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-3 flex min-w-0 flex-wrap items-baseline justify-between gap-x-3 gap-y-2">
      <h2 className="font-display text-sm font-semibold text-foreground">{title}</h2>
      {action ??
        (window ? (
          <span className="font-mono text-xs font-medium uppercase tracking-caps text-muted">
            {window}
          </span>
        ) : null)}
    </div>
  );
}

const WEEKDAY_LABELS = ["Pn", "Wt", "Śr", "Cz", "Pt", "So", "Nd"] as const;

function MonthCalendar({ dates, year, month }: { dates: string[]; year: number; month: number }) {
  const trained = useMemo(() => new Set(dates), [dates]);
  const first = new Date(year, month, 1, 12);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  // Poniedziałek = 0 … niedziela = 6
  const startPad = (first.getDay() + 6) % 7;
  const cells: (number | null)[] = [
    ...Array.from({ length: startPad }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const title = first.toLocaleDateString("pl-PL", { month: "long", year: "numeric" });

  return (
    <div>
      <p className="mb-3 font-mono text-xs font-medium uppercase tracking-caps text-muted">
        {title}
      </p>
      <div className="grid grid-cols-7 gap-1" role="grid" aria-label={`Dni treningowe · ${title}`}>
        {WEEKDAY_LABELS.map((d) => (
          <div
            key={d}
            className="pb-1 text-center font-mono text-xs font-medium uppercase tracking-caps text-muted-faint"
          >
            {d}
          </div>
        ))}
        {cells.map((day, i) => {
          if (day == null) {
            return <div key={`e-${i}`} className="aspect-square" aria-hidden />;
          }
          const iso = toIso(new Date(year, month, day, 12));
          const hit = trained.has(iso);
          const isToday = iso === toIso(new Date());
          return (
            <div
              key={iso}
              role="gridcell"
              aria-label={`${day}${hit ? ", trening" : ""}`}
              className={[
                "flex aspect-square items-center justify-center rounded-md font-mono text-xs tabular-nums",
                hit
                  ? "bg-invert-bg font-semibold text-invert-fg"
                  : isToday
                    ? "border border-border-strong text-foreground"
                    : "text-muted",
              ].join(" ")}
            >
              {hit ? "✓" : day}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function PortalProgressPage() {
  const params = useParams<{ token: string }>();
  const token = params.token;
  const [sessions, setSessions] = useState<PortalSessionSummary[] | null>(null);
  const [records, setRecords] = useState<ClientRecord[] | null>(null);
  const [muscleVolume, setMuscleVolume] = useState<MuscleVolumeResponse | null>(null);
  const [trends, setTrends] = useState<ClientTrendsResponse | null>(null);
  const [mostImproved, setMostImproved] = useState<MostImproved | null | undefined>(undefined);
  const [stagnation, setStagnation] = useState<StagnationResponse | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [expandedRecordId, setExpandedRecordId] = useState<number | null>(null);
  const [statsCache, setStatsCache] = useState<Record<number, ExerciseStats | "loading" | "error">>({});
  const [consistencyView, setConsistencyView] = useState<"weeks" | "calendar">("weeks");

  const load = useCallback(() => {
    Promise.all([
      api.portal.sessions(token),
      api.portal.records(token),
      api.portal.muscleVolume(token, 4),
      api.portal.trends(token, 12),
      api.portal.mostImproved(token, 90).catch(() => null),
      api.portal.stagnation(token).catch(() => null),
    ])
      .then(([s, r, mv, tr, mi, st]) => {
        setSessions(s);
        setRecords(r);
        setMuscleVolume(mv);
        setTrends(tr);
        setMostImproved(mi);
        setStagnation(st);
      })
      .catch((e: Error) => setError(e.message));
  }, [token]);

  useEffect(load, [load]);

  const toggleRecord = (exerciseId: number) => {
    if (expandedRecordId === exerciseId) {
      setExpandedRecordId(null);
      return;
    }
    setExpandedRecordId(exerciseId);
    if (statsCache[exerciseId]) return;
    setStatsCache((prev) => ({ ...prev, [exerciseId]: "loading" }));
    api.portal
      .exerciseStats(token, exerciseId)
      .then((stats) => setStatsCache((prev) => ({ ...prev, [exerciseId]: stats })))
      .catch(() => setStatsCache((prev) => ({ ...prev, [exerciseId]: "error" })));
  };

  const stats = useMemo(() => {
    const list = sessions ?? [];
    const now = new Date();
    now.setHours(12, 0, 0, 0);
    const thisMonday = startOfWeekMonday(now);
    const thisSunday = new Date(thisMonday);
    thisSunday.setDate(thisMonday.getDate() + 6);
    const monIso = toIso(thisMonday);
    const sunIso = toIso(thisSunday);

    const thisWeek = list.filter((s) => s.performedOn >= monIso && s.performedOn <= sunIso);

    // Streak kroczący: kolejne okna 7 dni kończące się dziś (nie tydzień kalendarzowy).
    let streak = 0;
    for (let i = 0; i < 52; i++) {
      const windowEnd = new Date(now);
      windowEnd.setDate(now.getDate() - i * 7);
      const windowStart = new Date(windowEnd);
      windowStart.setDate(windowEnd.getDate() - 6);
      const a = toIso(windowStart);
      const b = toIso(windowEnd);
      const hit = list.some((s) => s.performedOn >= a && s.performedOn <= b);
      if (!hit) break;
      streak++;
    }

    const month = now.getMonth();
    const year = now.getFullYear();
    const monthSessions = list.filter((s) => {
      const d = new Date(`${s.performedOn}T12:00:00`);
      return d.getMonth() === month && d.getFullYear() === year;
    });
    const monthVol = monthSessions.reduce((a, s) => a + s.totalVolumeKg, 0);

    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    const prevVol = list
      .filter((s) => {
        const d = new Date(`${s.performedOn}T12:00:00`);
        return d.getMonth() === prevMonth && d.getFullYear() === prevYear;
      })
      .reduce((a, s) => a + s.totalVolumeKg, 0);

    const deltaPct =
      prevVol > 0 ? Math.round(((monthVol - prevVol) / prevVol) * 100) : null;

    const cutoff = new Date(now);
    cutoff.setDate(now.getDate() - 30);
    const cutoffIso = toIso(cutoff);
    const withDur = list.filter(
      (s) =>
        s.status === "completed" &&
        s.performedOn >= cutoffIso &&
        s.durationSeconds != null &&
        s.durationSeconds > 0,
    );
    const avgDurationSec =
      withDur.length === 0
        ? null
        : withDur.reduce((a, s) => a + (s.durationSeconds ?? 0), 0) / withDur.length;

    return {
      weekCount: thisWeek.length,
      streak,
      monthVol,
      deltaPct,
      dates: list.map((s) => s.performedOn),
      avgDurationSec,
      calendarYear: year,
      calendarMonth: month,
    };
  }, [sessions]);

  const volumeDelta =
    stats.deltaPct == null
      ? undefined
      : `${stats.deltaPct > 0 ? "+" : ""}${stats.deltaPct}% vs poprz.`;

  const avgDur = formatAvgDuration(stats.avgDurationSec);

  return (
    <div className="mx-auto max-w-lg space-y-8 pb-24">
      <header>
        <p className="text-xs font-medium uppercase tracking-caps text-muted">Progres</p>
        <h1 className="mt-2 text-[1.75rem] font-semibold leading-tight tracking-tight text-foreground sm:text-3xl">
          Twoje wyniki
        </h1>
      </header>

      <ErrorBanner message={error} />

      {!sessions || !records || mostImproved === undefined || stagnation === undefined ? (
        <PortalPageSkeleton label="Wczytuję progres…" />
      ) : (
        <>
          <section
            aria-label="Podsumowanie"
            className="grid grid-cols-2 gap-3 border-y border-border py-5 sm:grid-cols-4"
          >
            <StatBlock label="Ten tydzień" value={String(stats.weekCount)} unit="tren." />
            <StatBlock label="Seria tygodni" value={String(stats.streak)} unit="tyg." />
            <StatBlock
              label="Objętość"
              value={Math.round(stats.monthVol).toLocaleString("pl-PL")}
              unit="kg"
              delta={volumeDelta}
            />
            <StatBlock label="Śr. czas" value={avgDur.value} unit={avgDur.unit || undefined} />
          </section>

          {mostImproved && mostImproved.percentGain > 0 ? (
            <section aria-label="Największy progres">
              <Card
                eyebrow={`Największy progres · ${mostImproved.days} dni`}
                title={mostImproved.exerciseName}
              >
                <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <p className="font-mono text-2xl font-semibold tabular-nums tracking-tight text-gain">
                    ▲ +{String(mostImproved.percentGain).replace(".", ",")}%
                  </p>
                  <p className="font-mono text-sm tabular-nums text-muted">
                    {formatKg(mostImproved.startE1Rm)} → {formatKg(mostImproved.endE1Rm)} kg
                    {mostImproved.deltaKg > 0
                      ? ` (+${formatKg(mostImproved.deltaKg)} kg)`
                      : ""}
                  </p>
                </div>
              </Card>
            </section>
          ) : null}

          {stagnation && stagnation.items.length > 0 ? (
            <section aria-label="Warto ruszyć" className="border-y border-border py-5">
              <SectionHeader title="Warto ruszyć" />
              <ul className="space-y-2">
                {stagnation.items.slice(0, 3).map((item) => (
                  <li key={item.exerciseId} className="text-[15px] text-foreground-secondary">
                    <span className="font-medium text-foreground">{item.exerciseName}</span>
                    {" — "}
                    {item.reason === "volume_drop"
                      ? `tonaż spada ${item.volumeDropWeeks ?? 2} tyg. z rzędu`
                      : `brak progresu e1RM przez ${item.sessionsWithoutProgress ?? 3} sesje`}
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-sm text-muted">
                Napisz do trenera — razem ustawicie następny bodziec.
              </p>
            </section>
          ) : null}

          <section aria-label="Spójność">
            <SectionHeader
              title="Spójność"
              action={
                <SegmentedControl
                  value={consistencyView}
                  onChange={(v) => setConsistencyView(v as "weeks" | "calendar")}
                  items={[
                    { value: "weeks", label: "Tygodnie" },
                    { value: "calendar", label: "Kalendarz" },
                  ]}
                />
              }
            />
            {consistencyView === "weeks" ? (
              <WeeklyActivityBar dates={stats.dates} weeks={8} showHeader={false} />
            ) : (
              <MonthCalendar
                dates={stats.dates}
                year={stats.calendarYear}
                month={stats.calendarMonth}
              />
            )}
          </section>

          <section aria-label="Tonaż">
            <SectionHeader title="Tonaż" window="12 tyg." />
            <LineChart
              points={(trends?.weeks ?? []).map((w) => ({
                label: formatDayShort(w.weekStart),
                value: w.volumeKg,
              }))}
              unit="kg"
              emptyHint="Za mało treningów na trend tonażu."
              ariaLabel="Tonaż tygodniowy"
            />
          </section>

          <section aria-label="Objętość mięśniowa">
            <SectionHeader title="Objętość mięśniowa" window="4 tyg." />
            <MuscleVolumeBars
              groups={muscleVolume?.groups ?? []}
              mode="sets"
              emptyHint="Tu zobaczysz balans mięśniowy po zapisanych seriach."
            />
          </section>

          <section aria-label="Rekordy">
            <SectionHeader title="Rekordy" window="est. 1RM" />
            {records.length === 0 ? (
              <div className="pt-1">
                <EmptyState
                  title="Jeszcze bez rekordów"
                  action={
                    <Link
                      href={`/portal/${token}`}
                      className="inline-flex min-h-11 items-center text-sm font-medium text-foreground underline-offset-4 hover:underline"
                    >
                      Rozpocznij trening
                    </Link>
                  }
                >
                  Tu zobaczysz rekordy per ćwiczenie — po zapisaniu serii z ciężarem.
                </EmptyState>
              </div>
            ) : (
              <ul className="divide-y divide-border border-y border-border">
                {records.map((r) => {
                  const open = expandedRecordId === r.exerciseId;
                  const exStats = statsCache[r.exerciseId];
                  return (
                    <li key={r.exerciseId}>
                      <button
                        type="button"
                        onClick={() => toggleRecord(r.exerciseId)}
                        aria-expanded={open}
                        className="flex min-h-14 w-full items-baseline justify-between gap-3 py-3.5 text-left transition-colors hover:bg-surface-hover focus-visible:outline-none focus-visible:shadow-[var(--focus-ring)]"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="break-words text-[15px] font-medium leading-snug text-foreground">
                            {r.exerciseName}
                          </p>
                          <p className="mt-0.5 text-xs text-muted">{formatDay(r.performedOn)}</p>
                        </div>
                        <div className="flex shrink-0 items-baseline gap-2">
                          <p className="font-mono text-lg font-semibold tabular-nums tracking-tight text-pr">
                            {formatKg(r.estimated1Rm)}
                            <span className="ml-1 text-sm font-medium text-muted">kg</span>
                          </p>
                          <span
                            className={`text-muted transition-transform duration-150 ${open ? "rotate-180" : ""}`}
                            aria-hidden
                          >
                            ▾
                          </span>
                        </div>
                      </button>
                      {open ? (
                        <div className="border-t border-border pb-4 pt-3">
                          {exStats === "loading" || exStats == null ? (
                            <p className="text-sm text-muted">Ładowanie trendu…</p>
                          ) : exStats === "error" ? (
                            <p className="text-sm text-danger">Nie udało się wczytać trendu.</p>
                          ) : (
                            <>
                              <TrendSparkline points={exStats.trend} />
                              <p className="mt-4 font-mono text-xs font-medium uppercase tracking-caps text-muted">
                                Rep-maxy
                              </p>
                              <RepMaxList items={exStats.repMaxes} />
                            </>
                          )}
                        </div>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section aria-label="Narzędzia">
            <SectionHeader title="Narzędzia" />
            <Link
              href={`/portal/${token}/calculator`}
              className="flex min-h-11 w-full items-center gap-3 rounded-[var(--r-card)] border border-border bg-surface px-3 py-3 text-left transition-[background-color,transform] duration-[var(--dur-fast)] ease-[var(--ease-out)] hover:bg-surface-hover active:scale-[0.98] focus-visible:outline-none focus-visible:shadow-[var(--focus-ring)]"
            >
              <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-md bg-surface-raised text-foreground">
                <Icon name="calculator" size={18} decorative />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-medium text-foreground">
                  Kalkulator %1RM
                </span>
                <span className="mt-0.5 block text-sm text-muted">
                  Strefy ciężaru z twojego rekordu
                </span>
              </span>
              <Icon name="caret-right" size={16} className="shrink-0 text-muted" decorative />
            </Link>
          </section>
        </>
      )}
    </div>
  );
}
