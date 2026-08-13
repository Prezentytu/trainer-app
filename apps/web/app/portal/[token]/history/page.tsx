"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api, PortalSessionSummary } from "@/lib/api";
import { Button, EmptyState, ErrorBanner } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { PortalPageSkeleton } from "@/components/skeletons";
import { formatDurationMinutes } from "@/lib/estimateDuration";
import { todayIsoLocal } from "@/lib/dates";

/** Kiedy trenowałem — oś skanu dla bywalca. */
function formatWhen(iso: string, todayIso: string): string {
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  const today = new Date(`${todayIso}T12:00:00`);
  const diff = Math.round((today.getTime() - d.getTime()) / 86_400_000);
  if (diff === 0) return "Dziś";
  if (diff === 1) return "Wczoraj";
  if (diff > 1 && diff < 7) {
    return d.toLocaleDateString("pl-PL", { weekday: "long" });
  }
  return d.toLocaleDateString("pl-PL", { day: "numeric", month: "short" });
}

function monthKey(iso: string): string {
  return iso.slice(0, 7);
}

function monthHeading(ym: string): string {
  const d = new Date(`${ym}-01T12:00:00`);
  if (Number.isNaN(d.getTime())) return ym;
  return d.toLocaleDateString("pl-PL", { month: "long", year: "numeric" });
}

function sessionTitle(s: PortalSessionSummary): string {
  return s.dayLabel ?? s.planName ?? "Trening";
}

function sessionMeta(s: PortalSessionSummary): string {
  const parts: string[] = [];
  const dur = formatDurationMinutes(s.durationSeconds);
  if (dur) parts.push(dur);
  if (s.totalVolumeKg > 0) {
    parts.push(`${Math.round(s.totalVolumeKg).toLocaleString("pl-PL")} kg`);
  }
  if (s.totalSets > 0) {
    parts.push(`${s.totalSets} ${s.totalSets === 1 ? "seria" : s.totalSets < 5 ? "serie" : "serii"}`);
  }
  return parts.join(" · ");
}

export default function PortalHistoryPage() {
  const params = useParams<{ token: string }>();
  const token = params.token;
  const router = useRouter();
  const [history, setHistory] = useState<PortalSessionSummary[] | null>(null);
  const [clientId, setClientId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [repeatingId, setRepeatingId] = useState<number | null>(null);
  const todayIso = useMemo(() => todayIsoLocal(), []);

  const load = useCallback(() => {
    Promise.all([
      api.portal.sessions(token),
      api.portal.home(token, todayIso).catch(() => null),
    ])
      .then(([sessions, home]) => {
        setHistory(sessions);
        setClientId(home?.client.id ?? sessions[0]?.clientId ?? null);
      })
      .catch((e: Error) => setError(e.message));
  }, [token, todayIso]);

  useEffect(load, [load]);

  const repeat = useCallback(
    async (s: PortalSessionSummary) => {
      if (clientId == null) return;
      setRepeatingId(s.id);
      setError(null);
      try {
        const session = await api.portal.startSession(token, {
          clientId,
          repeatSessionId: s.id,
          assignmentId: s.assignmentId,
          planId: s.planId,
          performedOn: todayIso,
        });
        router.push(`/portal/${token}/session/${session.id}`);
      } catch (e) {
        setError((e as Error).message);
        setRepeatingId(null);
      }
    },
    [clientId, router, todayIso, token],
  );

  const thisMonthIso = todayIso.slice(0, 7);
  const monthSessions = (history ?? []).filter((s) => monthKey(s.performedOn) === thisMonthIso);
  const monthVolume = monthSessions.reduce((a, s) => a + s.totalVolumeKg, 0);

  const groups = useMemo(() => {
    if (!history?.length) return [];
    const map = new Map<string, PortalSessionSummary[]>();
    for (const s of history) {
      const key = monthKey(s.performedOn);
      const bucket = map.get(key);
      if (bucket) bucket.push(s);
      else map.set(key, [s]);
    }
    return [...map.entries()];
  }, [history]);

  return (
    <div className="mx-auto max-w-lg space-y-8 pb-24">
      <header>
        <p className="text-xs font-medium uppercase tracking-caps text-muted">Historia</p>
        <h1 className="mt-2 text-[1.75rem] font-semibold leading-tight tracking-tight text-foreground sm:text-3xl">
          Ostatnie sesje
        </h1>
        {history && history.length > 0 ? (
          <p className="mt-1.5 text-sm text-muted">
            W tym miesiącu{" "}
            <span className="font-mono tabular-nums text-foreground-secondary">
              {monthSessions.length}
            </span>{" "}
            {monthSessions.length === 1
              ? "trening"
              : monthSessions.length < 5
                ? "treningi"
                : "treningów"}
            {monthVolume > 0 ? (
              <>
                {" · "}
                <span className="font-mono tabular-nums text-foreground-secondary">
                  {Math.round(monthVolume).toLocaleString("pl-PL")} kg
                </span>
              </>
            ) : null}
          </p>
        ) : null}
      </header>

      <ErrorBanner message={error} />

      {!history ? (
        <PortalPageSkeleton label="Wczytuję historię…" />
      ) : history.length === 0 ? (
        <EmptyState
          title="Historia pojawi się po pierwszym treningu"
          action={
            <div className="flex flex-col items-center gap-2">
              <Link
                href={`/portal/${token}/import`}
                className="inline-flex min-h-11 items-center text-sm font-medium text-foreground underline-offset-4 hover:underline"
              >
                Wrzuć screeny z poprzedniej apki
              </Link>
              <Link
                href={`/portal/${token}`}
                className="inline-flex min-h-11 items-center text-sm font-medium text-muted underline-offset-4 hover:underline"
              >
                Idź do dzisiejszego treningu
              </Link>
            </div>
          }
        >
          Tu zobaczysz ukończone treningi — od najnowszego. Jeśli trenowałeś w innej apce, wrzuć screeny, a trener przepisze je za Ciebie.
        </EmptyState>
      ) : (
        <div className="space-y-8">
          {groups.map(([ym, sessions]) => (
            <section key={ym} aria-label={monthHeading(ym)}>
              {groups.length > 1 || ym !== thisMonthIso ? (
                <p className="mb-2 font-mono text-xs font-medium uppercase tracking-caps text-muted">
                  {monthHeading(ym)}
                </p>
              ) : null}
              <ul className="divide-y divide-border border-y border-border">
                {sessions.map((s) => {
                  const prCount = (s.prs ?? []).length;
                  const meta = sessionMeta(s);
                  const busy = repeatingId === s.id;
                  return (
                    <li key={s.id} className="py-3.5">
                      <div className="flex items-start gap-3">
                        <Link
                          href={`/portal/${token}/session/${s.id}?from=history`}
                          className="flex min-h-11 min-w-0 flex-1 items-center gap-3 transition-colors duration-[var(--dur-fast)] ease-[var(--ease-out)] hover:bg-surface-raised/50 focus-visible:outline-none focus-visible:shadow-[var(--glow-accent)] active:bg-surface-hover active:scale-[0.995]"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-baseline gap-2">
                              <p className="text-[15px] font-semibold tracking-tight text-foreground">
                                {formatWhen(s.performedOn, todayIso)}
                              </p>
                              {prCount > 0 ? (
                                <span className="font-mono text-xs font-medium tracking-caps text-pr">
                                  {prCount === 1 ? "★ PR" : `★ ${prCount}× PR`}
                                </span>
                              ) : null}
                            </div>
                            <p className="mt-0.5 break-words text-sm text-foreground-secondary">
                              {sessionTitle(s)}
                              {s.planName && s.dayLabel && s.planName !== s.dayLabel ? (
                                <span className="text-muted"> · {s.planName}</span>
                              ) : null}
                            </p>
                            {meta ? (
                              <p className="mt-1 font-mono text-sm tabular-nums text-muted">{meta}</p>
                            ) : null}
                          </div>
                          <Icon name="caret-right" size={18} className="shrink-0 text-muted-faint" decorative />
                        </Link>
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={repeatingId != null || clientId == null}
                          loading={busy}
                          onClick={() => void repeat(s)}
                          className="shrink-0"
                        >
                          {busy ? "…" : "Powtórz"}
                        </Button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
