"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  api,
  ClientIntake,
  ClientCheckIn,
  hasEssentialIntake,
  PortalExercise,
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
import { relativeDayFromLabel, todayIsoLocal } from "@/lib/dates";
import { formatLoadDisplay } from "@/lib/weight";

function schemeLine(
  item: NonNullable<PortalHome["today"]>["day"]["items"][number],
  exerciseMeta?: Pick<PortalExercise, "equipment" | "isUnilateral"> | null,
): string {
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
    ? `${item.sets} × ${item.reps} @ ${formatLoadDisplay(load, exerciseMeta)}`
    : `${item.sets} × ${item.reps}`;
}

function setsProgressLabel(completed: number, total: number): string {
  if (total <= 0) return `${completed} serii`;
  return `${completed}/${total} serii`;
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
  const [exercises, setExercises] = useState<PortalExercise[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [repeating, setRepeating] = useState(false);
  const [staleBusy, setStaleBusy] = useState<"save" | "discard" | null>(null);
  const { setStickyCta } = usePortalStickyCta();
  const todayIso = useMemo(() => todayIsoLocal(), []);

  const exerciseById = useMemo(() => {
    const map = new Map<number, PortalExercise>();
    for (const ex of exercises) map.set(ex.id, ex);
    return map;
  }, [exercises]);

  const load = useCallback(() => {
    Promise.all([
      api.portal.home(token, todayIso),
      api.portal.sessions(token).catch(() => [] as PortalSessionSummary[]),
      api.portal.progressReport(token).catch(() => null),
      api.portal.getIntake(token).catch(() => null),
      api.portal.checkIns(token).catch(() => [] as ClientCheckIn[]),
      api.portal.exercises(token).catch(() => [] as PortalExercise[]),
    ])
      .then(([h, s, p, intk, checkinRows, exs]) => {
        setHome(h);
        setHistory(s);
        setProgress(p);
        setIntake(intk);
        setCheckIns(checkinRows);
        setExercises(exs);
      })
      .catch((e: Error) => setError(e.message));
  }, [token, todayIso]);

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
        performedOn: todayIso,
      });
      router.push(`/portal/${token}/session/${session.id}`);
      // starting zostaje true do odmontowania — unikamy migania „Rozpocznij” przed nawigacją
    } catch (e) {
      setError((e as Error).message);
      setStarting(false);
    }
  }, [home, router, token, todayIso]);

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
        performedOn: todayIso,
      });
      router.push(`/portal/${token}/session/${session.id}`);
    } catch (e) {
      setError((e as Error).message);
      setRepeating(false);
    }
  }, [home, lastCompleted, router, token, todayIso]);

  const saveStale = useCallback(async () => {
    if (!home?.staleSession) return;
    setStaleBusy("save");
    setError(null);
    try {
      await api.portal.completeSession(token, home.staleSession.id);
      load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setStaleBusy(null);
    }
  }, [home, token, load]);

  const discardStale = useCallback(async () => {
    if (!home?.staleSession) return;
    const label = home.staleSession.dayLabel ?? "trening";
    if (
      !window.confirm(
        `Odrzucić niedokończony ${label}? Zapisane serie nie trafią do historii.`,
      )
    ) {
      return;
    }
    setStaleBusy("discard");
    setError(null);
    try {
      await api.portal.abandonSession(token, home.staleSession.id);
      load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setStaleBusy(null);
    }
  }, [home, token, load]);

  // CTA w dolnym pasku — świeża sesja = Kontynuuj z kontekstem; inaczej Rozpocznij / Powtórz.
  useEffect(() => {
    if (home?.inProgressSession) {
      const label = home.inProgressSession.dayLabel?.trim() || "trening";
      setStickyCta({
        label: `Kontynuuj: ${label}`,
        disabled: false,
        onClick: () => router.push(`/portal/${token}/session/${home.inProgressSession!.id}`),
      });
      return () => setStickyCta(null);
    }
    if (home?.today) {
      setStickyCta({
        label: starting ? "Startuję…" : "Rozpocznij trening",
        disabled: starting,
        loading: starting,
        onClick: () => void start(),
      });
      return () => setStickyCta(null);
    }
    if (home && lastCompleted) {
      setStickyCta({
        label: repeating ? "Startuję…" : "Powtórz ostatni trening",
        disabled: repeating,
        loading: repeating,
        onClick: () => void repeatLast(),
      });
      return () => setStickyCta(null);
    }
    setStickyCta(null);
    return () => setStickyCta(null);
  }, [
    home,
    lastCompleted,
    setStickyCta,
    start,
    starting,
    repeating,
    repeatLast,
    router,
    token,
  ]);

  if (!home) {
    return (
      <div>
        <ErrorBanner message={error} />
        {error ? null : <PortalHomeSkeleton />}
      </div>
    );
  }

  const today = home.today;
  const fresh = home.inProgressSession;
  const stale = home.staleSession;
  const firstName = home.client.name.split(" ")[0];
  const tip = progress?.facts[0]?.text;
  const estMin = today ? estimateDayMinutes(today.day.items) : null;
  const weekMeta = today?.day ? `tydzień ${today.day.weekNumber}` : null;
  const hasTodayCheckIn = checkIns.some((checkIn) => checkIn.date.slice(0, 10) === todayIso);
  const needsIntake = Boolean(intake && !hasEssentialIntake(intake));

  const showSticky = Boolean(today || lastCompleted || fresh);
  // Gdy świeża sesja trwa — karta pokazuje dzień tej sesji (spójność z CTA).
  const cardTitle = fresh?.dayLabel?.trim() || today?.day.label || null;
  const cardSubtitle = today
    ? `${today.planName}${weekMeta ? ` · ${weekMeta}` : ""}`
    : null;

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

      {stale ? (
        <section
          aria-label="Niedokończony trening"
          className="rounded-xl border border-border-strong bg-surface-raised px-4 py-4"
        >
          <p className="font-mono text-xs font-medium uppercase tracking-caps text-muted">
            Niedokończony trening
          </p>
          <h2 className="mt-2 break-words text-lg font-semibold tracking-tight text-foreground">
            {stale.dayLabel?.trim() || "Trening"}{" "}
            <span className="font-normal text-muted">
              {relativeDayFromLabel(stale.performedOn, todayIso)}
            </span>
          </h2>
          <p className="mt-1 font-mono text-sm tabular-nums text-muted">
            {setsProgressLabel(stale.completedSets, stale.totalSets)}
          </p>
          <p className="mt-2 text-sm text-muted">
            Zapisz to, co zrobiłeś, albo odrzuć i zacznij dzisiejszy trening.
          </p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <Button
              variant="primary"
              full
              disabled={staleBusy !== null}
              onClick={() => void saveStale()}
            >
              {staleBusy === "save" ? "Zapisuję…" : "Zapisz trening"}
            </Button>
            <Button
              variant="secondary"
              full
              disabled={staleBusy !== null}
              onClick={() => void discardStale()}
            >
              {staleBusy === "discard" ? "Odrzucam…" : "Odrzuć"}
            </Button>
          </div>
        </section>
      ) : null}

      {!today && !fresh ? (
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
              {fresh ? "Trening w toku" : "Dzisiejszy trening"}
            </p>
            {fresh ? (
              <p className="shrink-0 font-mono text-xs tabular-nums text-muted">
                {setsProgressLabel(fresh.completedSets, fresh.totalSets)}
              </p>
            ) : estMin != null ? (
              <p className="shrink-0 font-mono text-xs tabular-nums text-muted">
                {formatDurationApprox(estMin)}
              </p>
            ) : null}
          </div>
          {cardTitle ? (
            <h2 className="break-words text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              {cardTitle}
            </h2>
          ) : null}
          {cardSubtitle ? (
            <p className="mt-1 text-[15px] text-muted">{cardSubtitle}</p>
          ) : null}

          {today?.cycleRestart && !fresh ? (
            <p className="mt-3 text-sm text-muted">
              Cykl ukończony — zaczynasz od nowa.
            </p>
          ) : null}

          {today && !fresh ? (
            <ul className="mt-6 divide-y divide-border border-y border-border">
              {today.day.items.map((item) => (
                <li key={item.id} className="py-4">
                  <p className="break-words text-[15px] font-semibold leading-snug text-foreground">
                    {item.exerciseName}
                  </p>
                  <p className="mt-1 font-mono text-[15px] tabular-nums text-muted">
                    {schemeLine(item, exerciseById.get(item.exerciseId))}
                  </p>
                </li>
              ))}
            </ul>
          ) : null}

          {tip && !fresh ? <p className="pt-3 text-sm text-muted">Ostatnio: {tip}</p> : null}

          {lastCompleted && !fresh && !stale ? (
            <div className="pt-4">
              <Button
                variant="secondary"
                full
                disabled={repeating}
                loading={repeating}
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
