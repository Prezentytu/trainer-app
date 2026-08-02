"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api, PortalHome } from "@/lib/api";
import { Avatar, ErrorBanner, Switch } from "@/components/ui";
import { readAutoRest, writeAutoRest } from "@/lib/portalPrefs";

export default function PortalProfilePage() {
  const params = useParams<{ token: string }>();
  const token = params.token;
  const [home, setHome] = useState<PortalHome | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [autoRest, setAutoRest] = useState(() => readAutoRest());

  const load = useCallback(() => {
    api.portal
      .home(token)
      .then(setHome)
      .catch((e: Error) => setError(e.message));
  }, [token]);

  useEffect(load, [load]);

  if (!home) {
    return (
      <div>
        <ErrorBanner message={error} />
        <p className="text-sm text-muted">Ładowanie…</p>
      </div>
    );
  }

  const today = home.today;

  return (
    <div className="space-y-4 pb-8">
      <ErrorBanner message={error} />

      <div className="flex items-center gap-3.5">
        <Avatar name={home.client.name} size="lg" />
        <div className="min-w-0">
          <h1 className="truncate font-display text-3xl font-bold">{home.client.name}</h1>
          <p className="mt-0.5 text-[13px] text-muted">Portal klienta · Workout Alchemist</p>
        </div>
      </div>

      {today ? (
        <div className="rounded-2xl border border-border bg-surface px-5 py-4 shadow-card">
          <p className="text-xs font-semibold uppercase tracking-caps text-muted">Aktualny plan</p>
          <p className="mt-1.5 font-display text-lg font-semibold">{today.planName}</p>
          <p className="mt-0.5 text-[13px] text-muted">
            Tydzień {today.day.weekNumber} · {today.day.label}
          </p>
          <div className="mt-3 h-1 overflow-hidden rounded-full bg-surface-active">
            <div
              className="h-full rounded-full bg-accent"
              style={{ width: `${Math.min(100, today.percent)}%` }}
            />
          </div>
          <p className="mt-1.5 font-mono text-[13px] tabular-nums text-muted">
            {today.completed}/{today.total} sesji w bloku · {today.percent}%
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-surface px-5 py-4 text-[13px] text-muted shadow-card">
          Brak aktywnego planu. Poproś trenera o przypisanie.
        </div>
      )}

      <div className="rounded-2xl border border-border bg-surface px-5 py-1 shadow-card">
        <div className="flex min-h-14 items-center gap-3 border-b border-border">
          <div className="min-w-0 flex-1 text-[15px] text-foreground-secondary">
            Auto-timer odpoczynku
          </div>
          <Switch
            checked={autoRest}
            onChange={(v) => {
              setAutoRest(v);
              writeAutoRest(v);
            }}
          />
        </div>
        <div className="flex min-h-14 items-center gap-3">
          <div className="min-w-0 flex-1 text-[15px] text-foreground-secondary">Jednostki</div>
          <span className="rounded-full border border-border bg-surface-raised px-3 py-1 font-mono text-[13px] text-muted">
            kg
          </span>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-surface px-5 py-1 shadow-card">
        <Link
          href={`/portal/${token}/intake`}
          className="flex min-h-14 items-center text-[15px] font-semibold text-accent"
        >
          Ankieta startowa
        </Link>
        <Link
          href={`/portal/${token}/measurements`}
          className="flex min-h-14 items-center border-t border-border text-[15px] font-semibold text-accent"
        >
          Pomiary
        </Link>
      </div>
    </div>
  );
}
