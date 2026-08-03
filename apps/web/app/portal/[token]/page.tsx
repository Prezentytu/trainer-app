"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  api,
  ClientIntake,
  ClientCheckIn,
  hasEssentialIntake,
  PortalHome,
  PortalSessionSummary,
  ProgressReport,
} from "@/lib/api";
import { Button, ErrorBanner } from "@/components/ui";
import { PortalHomeSkeleton } from "@/components/skeletons";
import { usePortalStickyCta } from "@/components/portal/PortalChrome";
import { estimateDayMinutes, formatDurationApprox } from "@/lib/estimateDuration";
import { buildWeekStrip } from "@/lib/portalWeekStrip";
import { CheckInCard } from "@/components/portal/CheckInCard";
import { PwaInstallPrompt } from "@/components/portal/PwaInstallPrompt";

function schemeLine(item: NonNullable<PortalHome["today"]>["day"]["items"][number]): string {
  const measure = item.measureType ?? "reps";
  if (measure === "time") {
    const sec = item.repDurationSeconds ?? 0;
    return `${item.sets} × ${sec} s`;
  }
  if (measure === "distance") {
    return `${item.sets} × ${item.distanceMeters ?? "—"} m`;
  }
  const load =
    item.computedLoadKg ?? item.loadKg ?? null;
  return load != null
    ? `${item.sets} × ${item.reps} @ ${load} kg`
    : `${item.sets} × ${item.reps}`;
}

export default function PortalTodayPage() {
  const params = useParams<{ token: string }>();
  const token = params.token;
  const router = useRouter();
  const [home, setHome] = useState<PortalHome | null>(null);
  const [history, setHistory] = useState<PortalSessionSummary[]>([]);
  const [progress, setProgress] = useState<ProgressReport | null>(null);
  const [intake, setIntake] = useState<ClientIntake | null>(null);
  const [checkIns, setCheckIns] = useState<ClientCheckIn[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const { setStickyCta } = usePortalStickyCta();

  const load = useCallback(() => {
    Promise.all([
      api.portal.home(token),
      api.portal.sessions(token).catch(() => [] as PortalSessionSummary[]),
      api.portal.progressReport(token).catch(() => null),
      api.portal.getIntake(token).catch(() => null),
      api.portal.checkIns(token).catch(() => [] as ClientCheckIn[]),
    ])
      .then(([h, s, p, intk, checkinRows]) => {
        setHome(h);
        setHistory(s);
        setProgress(p);
        setIntake(intk);
        setCheckIns(checkinRows);
      })
      .catch((e: Error) => setError(e.message));
  }, [token]);

  useEffect(load, [load]);

  useEffect(() => {
    const href = `/portal/${token}/manifest.webmanifest`;
    let link = document.querySelector<HTMLLinkElement>('link[data-portal-manifest="1"]');
    if (!link) {
      link = document.createElement("link");
      link.rel = "manifest";
      link.dataset.portalManifest = "1";
      document.head.appendChild(link);
    }
    link.href = href;
  }, [token]);

  const weekStrip = useMemo(
    () => buildWeekStrip(history.map((s) => s.performedOn)),
    [history],
  );

  const start = useCallback(async () => {
    if (!home?.today) return;
    setStarting(true);
    setError(null);
    try {
      if (home.inProgressSession) {
        router.push(`/portal/${token}/session/${home.inProgressSession.id}`);
        return;
      }
      const session = await api.portal.startSession(token, {
        clientId: home.client.id,
        assignmentId: home.today.assignmentId,
        planId: home.today.planId,
        planDayId: home.today.day.id,
      });
      router.push(`/portal/${token}/session/${session.id}`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setStarting(false);
    }
  }, [home, router, token]);

  // CTA w dolnym pasku razem z nawigacją — nic nie nachodzi na przycisk.
  useEffect(() => {
    if (!home?.today) {
      setStickyCta(null);
      return () => setStickyCta(null);
    }
    setStickyCta({
      label: home.inProgressSession
        ? "Kontynuuj trening"
        : starting
          ? "Startuję…"
          : "Rozpocznij trening",
      disabled: starting,
      onClick: () => void start(),
    });
    return () => setStickyCta(null);
  }, [home, setStickyCta, start, starting]);

  if (!home) {
    return (
      <div>
        <ErrorBanner message={error} />
        {error ? null : <PortalHomeSkeleton />}
      </div>
    );
  }

  const today = home.today;
  const firstName = home.client.name.split(" ")[0];
  const tip = progress?.facts[0]?.text;
  const estMin = today ? estimateDayMinutes(today.day.items) : null;
  const weekMeta = today?.day
    ? `tydzień ${today.day.weekNumber}`
    : null;
  const todayIso = new Date().toISOString().slice(0, 10);
  const hasTodayCheckIn = checkIns.some((checkIn) => checkIn.date.slice(0, 10) === todayIso);

  return (
    <div className={`space-y-5 ${today ? "pb-36" : "pb-24"}`}>
      <header>
        <p className="text-xs font-semibold uppercase tracking-caps text-muted-faint">
          Workout Alchemist
        </p>
        <h1 className="mt-1 font-display text-3xl font-bold">Cześć, {firstName}</h1>
      </header>
      <ErrorBanner message={error} />
      <PwaInstallPrompt token={token} />

      <div className="flex gap-2">
        {weekStrip.map((d, i) => (
          <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
            <div
              className={`text-xs font-semibold ${
                d.today ? "text-foreground-secondary" : "text-muted-faint"
              }`}
            >
              {d.label}
            </div>
            <div
              className={`flex h-[30px] w-[30px] items-center justify-center rounded-full font-mono text-[13px] tabular-nums ${
                d.done
                  ? "border border-accent-border bg-accent-dim text-positive"
                  : d.today
                    ? "border border-accent text-muted-faint"
                    : "border border-border text-muted-faint"
              }`}
            >
              {d.done ? "✓" : "·"}
            </div>
          </div>
        ))}
      </div>

      {intake && !hasEssentialIntake(intake) ? (
        <section className="rounded-2xl border border-border-strong bg-surface p-4 shadow-card">
          <p className="text-xs font-semibold uppercase tracking-caps text-muted-strong">
            Ankieta startowa
          </p>
          <p className="mt-1 text-[15px] font-semibold">Uzupełnij kilka informacji o sobie</p>
          <p className="mt-1 text-[13px] text-muted">
            Cele, zdrowie i styl życia — dzięki temu trener ułoży bezpieczny plan.
          </p>
          <div className="mt-3">
            <Link href={`/portal/${token}/intake`}>
              <Button>Uzupełnij ankietę</Button>
            </Link>
          </div>
        </section>
      ) : null}

      {!hasTodayCheckIn ? (
        <CheckInCard
          token={token}
          onSaved={() => {
            void api.portal.checkIns(token).then(setCheckIns).catch((e: Error) => setError(e.message));
          }}
        />
      ) : null}

      {!today ? (
        <div className="rounded-2xl border border-border bg-surface p-5 text-muted shadow-card">
          Nie masz aktywnego planu. Poproś trenera o przypisanie.
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-surface p-5 shadow-card">
          <div className="flex items-baseline justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-caps text-muted">
              Dzisiejszy trening
            </p>
            {estMin != null ? (
              <p className="font-mono text-[13px] tabular-nums text-muted">
                {formatDurationApprox(estMin)}
              </p>
            ) : null}
          </div>
          <h2 className="mt-1.5 font-display text-lg font-semibold">{today.day.label}</h2>
          <p className="mt-0.5 text-[13px] text-muted">
            {today.planName}
            {weekMeta ? ` · ${weekMeta}` : ""}
          </p>

          <ul className="mt-3.5 border-t border-border">
            {today.day.items.map((item) => (
              <li
                key={item.id}
                className="flex min-h-12 items-center gap-3 border-b border-border last:border-0"
              >
                <div className="min-w-0 flex-1 truncate text-[15px] font-semibold text-foreground-secondary">
                  {item.exerciseName}
                </div>
                <div className="shrink-0 font-mono text-[13px] tabular-nums text-muted">
                  {schemeLine(item)}
                </div>
              </li>
            ))}
          </ul>

          {tip ? <p className="mt-3.5 text-[13px] text-muted">Ostatnio: {tip}</p> : null}
        </div>
      )}
    </div>
  );
}
