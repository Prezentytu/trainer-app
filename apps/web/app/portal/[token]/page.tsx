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
  const load = item.computedLoadKg ?? item.loadKg ?? null;
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
  const [repeating, setRepeating] = useState(false);
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

  const weekStrip = useMemo(
    () => buildWeekStrip(history.map((s) => s.performedOn)),
    [history],
  );

  /** Historia z API to już tylko ukończone, sortowane od najnowszej. */
  const lastCompleted = history[0] ?? null;

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

  const repeatLast = useCallback(async () => {
    if (!home || !lastCompleted) return;
    if (home.inProgressSession) {
      router.push(`/portal/${token}/session/${home.inProgressSession.id}`);
      return;
    }
    setRepeating(true);
    setError(null);
    try {
      const session = await api.portal.startSession(token, {
        clientId: home.client.id,
        repeatSessionId: lastCompleted.id,
        assignmentId: home.today?.assignmentId ?? null,
        planId: home.today?.planId ?? lastCompleted.planId ?? null,
      });
      router.push(`/portal/${token}/session/${session.id}`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setRepeating(false);
    }
  }, [home, lastCompleted, router, token]);

  // CTA w dolnym pasku — plan = primary; bez planu = Powtórz ostatni jako primary.
  useEffect(() => {
    if (home?.today) {
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
    }
    if (home && lastCompleted && !home.inProgressSession) {
      setStickyCta({
        label: repeating ? "Startuję…" : "Powtórz ostatni trening",
        disabled: repeating,
        onClick: () => void repeatLast(),
      });
      return () => setStickyCta(null);
    }
    if (home?.inProgressSession) {
      setStickyCta({
        label: "Kontynuuj trening",
        disabled: false,
        onClick: () => router.push(`/portal/${token}/session/${home.inProgressSession!.id}`),
      });
      return () => setStickyCta(null);
    }
    setStickyCta(null);
    return () => setStickyCta(null);
  }, [home, lastCompleted, setStickyCta, start, starting, repeating, repeatLast, router, token]);

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
  const weekMeta = today?.day ? `tydzień ${today.day.weekNumber}` : null;
  const todayIso = new Date().toISOString().slice(0, 10);
  const hasTodayCheckIn = checkIns.some((checkIn) => checkIn.date.slice(0, 10) === todayIso);
  const needsIntake = Boolean(intake && !hasEssentialIntake(intake));

  const showSticky = Boolean(today || lastCompleted || home.inProgressSession);

  return (
    <div className={`mx-auto max-w-lg space-y-8 ${showSticky ? "pb-36" : "pb-24"}`}>
      <header>
        <p className="text-xs font-medium uppercase tracking-caps text-muted">Dziś</p>
        <h1 className="mt-2 text-[1.75rem] font-semibold leading-tight tracking-tight text-foreground sm:text-3xl">
          Cześć, {firstName}
        </h1>
      </header>

      <ErrorBanner message={error} />

      <section aria-label="Tydzień" className="flex gap-1.5">
        {weekStrip.map((d, i) => (
          <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
            <div
              className={`font-mono text-[10px] font-medium uppercase tracking-caps ${
                d.today ? "text-foreground-secondary" : "text-muted-faint"
              }`}
            >
              {d.label}
            </div>
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full font-mono text-[13px] tabular-nums ${
                d.done
                  ? "bg-surface-active text-foreground"
                  : d.today
                    ? "border border-dashed border-border-strong text-muted"
                    : "text-muted-faint"
              }`}
            >
              {d.done ? "✓" : d.today ? "·" : ""}
            </div>
          </div>
        ))}
      </section>

      {!today ? (
        <section className="rounded-xl border border-border bg-surface-raised px-4 py-5">
          <p className="text-[15px] font-semibold text-foreground">Brak aktywnego planu</p>
          <p className="mt-1 text-sm text-muted">
            {lastCompleted
              ? "Możesz powtórzyć ostatni trening albo poprosić trenera o plan."
              : "Poproś trenera o przypisanie dnia treningowego."}
          </p>
        </section>
      ) : (
        <section aria-label="Dzisiejszy trening" className="space-y-1">
          <div className="flex items-baseline justify-between gap-3">
            <p className="font-mono text-xs font-medium uppercase tracking-caps text-muted">
              Dzisiejszy trening
            </p>
            {estMin != null ? (
              <p className="shrink-0 font-mono text-xs tabular-nums text-muted">
                {formatDurationApprox(estMin)}
              </p>
            ) : null}
          </div>
          <h2 className="break-words text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            {today.day.label}
          </h2>
          <p className="mt-1 text-[15px] text-muted">
            {today.planName}
            {weekMeta ? ` · ${weekMeta}` : ""}
          </p>

          <ul className="mt-6 divide-y divide-border border-y border-border">
            {today.day.items.map((item) => (
              <li key={item.id} className="py-4">
                <p className="break-words text-[15px] font-semibold leading-snug text-foreground">
                  {item.exerciseName}
                </p>
                <p className="mt-1 font-mono text-[15px] tabular-nums text-muted">
                  {schemeLine(item)}
                </p>
              </li>
            ))}
          </ul>

          {tip ? <p className="pt-3 text-sm text-muted">Ostatnio: {tip}</p> : null}

          {lastCompleted && !home.inProgressSession ? (
            <div className="pt-4">
              <Button
                variant="secondary"
                full
                disabled={repeating}
                onClick={() => void repeatLast()}
              >
                {repeating ? "Startuję…" : "Powtórz ostatni trening"}
              </Button>
            </div>
          ) : null}
        </section>
      )}

      {/* Poniżej foldu — nie konkurują z CTA „Rozpocznij trening". */}
      <div className="space-y-6 border-t border-border pt-8">
        {!hasTodayCheckIn ? (
          <CheckInCard
            token={token}
            onSaved={() => {
              void api.portal
                .checkIns(token)
                .then(setCheckIns)
                .catch((e: Error) => setError(e.message));
            }}
          />
        ) : null}

        {needsIntake ? (
          <section className="rounded-xl border border-dashed border-border-strong bg-surface-raised px-4 py-4">
            <p className="font-mono text-xs font-medium uppercase tracking-caps text-muted">
              Ankieta startowa
            </p>
            <p className="mt-2 text-[15px] font-semibold text-foreground">
              Uzupełnij kilka informacji o sobie
            </p>
            <p className="mt-1 text-sm text-muted">
              Cele, zdrowie i styl życia — dzięki temu trener ułoży bezpieczny plan.
            </p>
            <div className="mt-4">
              <Link href={`/portal/${token}/intake`} className="block">
                <Button variant="secondary" full>
                  Uzupełnij ankietę
                </Button>
              </Link>
            </div>
          </section>
        ) : null}

        <PwaInstallPrompt token={token} />
      </div>
    </div>
  );
}
