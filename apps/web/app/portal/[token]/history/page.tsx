"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api, PortalSessionSummary } from "@/lib/api";
import { Badge, ErrorBanner } from "@/components/ui";
import { PortalPageSkeleton } from "@/components/skeletons";
import { formatDurationMinutes } from "@/lib/estimateDuration";

function formatDay(iso: string): string {
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("pl-PL", { weekday: "short", day: "numeric", month: "short" });
}

export default function PortalHistoryPage() {
  const params = useParams<{ token: string }>();
  const token = params.token;
  const [history, setHistory] = useState<PortalSessionSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    api.portal
      .sessions(token)
      .then(setHistory)
      .catch((e: Error) => setError(e.message));
  }, [token]);

  useEffect(load, [load]);

  const monthLabel = new Date().toLocaleDateString("pl-PL", { month: "long" });
  const volume = (history ?? []).reduce((a, s) => a + s.totalVolumeKg, 0);

  return (
    <div className="space-y-4 pb-8">
      <header>
        <h1 className="font-display text-3xl font-bold">Historia</h1>
        {history ? (
          <p className="mt-0.5 text-[13px] capitalize text-muted">
            {monthLabel} · {history.length} treningów ·{" "}
            <span className="font-mono tabular-nums">
              {Math.round(volume).toLocaleString("pl-PL")} kg
            </span>{" "}
            objętości
          </p>
        ) : null}
      </header>
      <ErrorBanner message={error} />

      {!history ? (
        <PortalPageSkeleton label="Wczytuję historię…" />
      ) : history.length === 0 ? (
        <div className="rounded-2xl border border-border bg-surface px-4 py-6 text-center shadow-card">
          <p className="text-sm text-muted">Brak ukończonych treningów.</p>
          <Link
            href={`/portal/${token}`}
            className="mt-3 inline-block text-[15px] font-semibold text-accent hover:text-accent-strong"
          >
            Idź do dzisiejszego treningu
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {history.map((s) => {
            const prs = s.prs ?? [];
            return (
              <li key={s.id}>
                <Link
                  href={`/portal/${token}/session/${s.id}`}
                  className="block rounded-2xl border border-border bg-surface p-4 shadow-card transition-colors hover:bg-surface-hover focus-visible:outline-none focus-visible:shadow-[var(--glow-accent)]"
                >
                  <div className="flex items-center gap-2">
                    <p className="min-w-0 flex-1 truncate text-[15px] font-semibold">
                      {s.dayLabel ?? s.planName ?? "Trening"}
                    </p>
                    {prs.length > 0 ? <Badge tone="pr">PR</Badge> : null}
                    <p className="shrink-0 font-mono text-[13px] tabular-nums text-muted-faint">
                      {formatDay(s.performedOn)}
                    </p>
                  </div>
                  <div className="mt-3 flex gap-6">
                    <Stat
                      v={formatDurationMinutes(s.durationSeconds) ?? "—"}
                      l="Czas"
                    />
                    <Stat
                      v={`${Math.round(s.totalVolumeKg).toLocaleString("pl-PL")} kg`}
                      l="Objętość"
                    />
                    <Stat v={`${s.totalSets}`} l="Serie" />
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function Stat({ v, l }: { v: string; l: string }) {
  return (
    <div>
      <div className="font-mono text-[15px] tabular-nums text-foreground-secondary">{v}</div>
      <div className="mt-0.5 text-xs font-semibold uppercase tracking-caps text-muted-faint">
        {l}
      </div>
    </div>
  );
}
