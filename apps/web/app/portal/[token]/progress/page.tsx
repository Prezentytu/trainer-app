"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api, ClientRecord, PortalSessionSummary } from "@/lib/api";
import { ErrorBanner } from "@/components/ui";
import { WeeklyActivityBar } from "@/components/WeeklyActivityBar";

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

export default function PortalProgressPage() {
  const params = useParams<{ token: string }>();
  const token = params.token;
  const [sessions, setSessions] = useState<PortalSessionSummary[] | null>(null);
  const [records, setRecords] = useState<ClientRecord[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    Promise.all([api.portal.sessions(token), api.portal.records(token)])
      .then(([s, r]) => {
        setSessions(s);
        setRecords(r);
      })
      .catch((e: Error) => setError(e.message));
  }, [token]);

  useEffect(load, [load]);

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
    // Seria tygodni bez przerwy (ile kolejnych tygodni wstecz z ≥1 treningiem)
    let streak = 0;
    for (let i = 0; i < 52; i++) {
      const monday = new Date(thisMonday);
      monday.setDate(thisMonday.getDate() - i * 7);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      const a = toIso(monday);
      const b = toIso(sunday);
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

    return {
      weekCount: thisWeek.length,
      streak,
      monthVol,
      deltaPct,
      dates: list.map((s) => s.performedOn),
    };
  }, [sessions]);

  return (
    <div className="space-y-4 pb-8">
      <header>
        <h1 className="font-display text-3xl font-bold">Progres</h1>
      </header>
      <ErrorBanner message={error} />

      {!sessions || !records ? (
        <p className="text-sm text-muted">Ładowanie…</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            <Metric
              value={String(stats.weekCount)}
              label="Treningi · ten tydzień"
            />
            <Metric value={`${stats.streak} tyg.`} label="Seria bez przerwy" />
            <Metric
              value={`${Math.round(stats.monthVol).toLocaleString("pl-PL")} kg`}
              label="Objętość · miesiąc"
            />
            <Metric
              value={
                stats.deltaPct == null
                  ? "—"
                  : `${stats.deltaPct > 0 ? "+" : ""}${stats.deltaPct}%`
              }
              label="Objętość vs poprzedni"
            />
          </div>

          <div className="rounded-2xl border border-border bg-surface p-4 shadow-card">
            <p className="text-xs font-semibold uppercase tracking-caps text-muted">
              Objętość tygodniowa
            </p>
            <div className="mt-3">
              <WeeklyActivityBar dates={stats.dates} weeks={8} />
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-surface px-4 py-1.5 shadow-card">
            <p className="px-0 py-3 text-xs font-semibold uppercase tracking-caps text-muted">
              Rekordy · szacowany 1RM
            </p>
            {records.length === 0 ? (
              <div className="py-4 text-center">
                <p className="text-sm text-muted">
                  Tu zobaczysz rekordy per ćwiczenie — po zalogowaniu serii.
                </p>
                <Link
                  href={`/portal/${token}`}
                  className="mt-3 inline-block text-[15px] font-semibold text-accent"
                >
                  Rozpocznij trening
                </Link>
              </div>
            ) : (
              records.map((r) => (
                <div
                  key={r.exerciseId}
                  className="flex min-h-14 items-center gap-3 border-b border-border last:border-0"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-semibold text-foreground-secondary">
                      {r.exerciseName}
                    </p>
                    <p className="mt-0.5 text-[13px] text-muted-faint">{formatDay(r.performedOn)}</p>
                  </div>
                  <p className="font-mono text-xl font-semibold tabular-nums text-pr">
                    {r.estimated1Rm.toLocaleString("pl-PL", {
                      maximumFractionDigits: 1,
                    })}{" "}
                    kg
                  </p>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4 shadow-card">
      <p className="font-mono text-3xl font-semibold tabular-nums text-foreground">{value}</p>
      <p className="mt-1.5 text-xs font-semibold uppercase tracking-caps text-muted">{label}</p>
    </div>
  );
}
