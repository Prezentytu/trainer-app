"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  api,
  ClientIntake,
  ClientCheckIn,
  hasEssentialIntake,
  LoggedExercise,
  PortalExercise,
  PortalHome,
  PortalSessionSummary,
  PortalWeekDay,
  SessionDetail,
} from "@/lib/api";
import { Button, ErrorBanner } from "@/components/ui";
import { PortalHomeSkeleton } from "@/components/skeletons";
import { usePortalStickyCta } from "@/components/portal/PortalChrome";
import { estimateDayMinutes, formatDurationApprox } from "@/lib/estimateDuration";
import { buildWeekStrip, planDaysMapToWeekdays } from "@/lib/portalWeekStrip";
import { CheckInCard } from "@/components/portal/CheckInCard";
import { DayPreviewSheet } from "@/components/portal/DayPreviewSheet";
import { PwaInstallPrompt } from "@/components/portal/PwaInstallPrompt";
import {
  localWeekdayIndex,
  relativeDayFromLabel,
  todayIsoLocal,
  weekdayIndexFromLabel,
} from "@/lib/dates";
import { formatLoadDisplay } from "@/lib/weight";
import { previewRowsFromItems } from "@/lib/supersetPreview";

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

function schemeFromLogged(
  ex: LoggedExercise,
  exerciseMeta?: Pick<PortalExercise, "equipment" | "isUnilateral"> | null,
): string {
  const working = ex.sets.filter((s) => !s.isWarmup);
  const sets = working.length > 0 ? working : ex.sets;
  const n = sets.length;
  if (n === 0) return "—";
  const sample = sets.find((s) => s.targetReps != null || s.targetDurationSeconds != null) ?? sets[0];
  if (sample.targetDurationSeconds != null) {
    return `${n} × ${sample.targetDurationSeconds} s`;
  }
  if (sample.targetReps != null) {
    const load = sample.targetWeightKg;
    return load != null
      ? `${n} × ${sample.targetReps} @ ${formatLoadDisplay(load, exerciseMeta)}`
      : `${n} × ${sample.targetReps}`;
  }
  return `${n} serii`;
}

function setsProgressLabel(completed: number, total: number): string {
  if (total <= 0) return `${completed} serii`;
  return `${completed}/${total} serii`;
}

function exerciseCountLabel(n: number): string {
  if (n === 1) return "1 ćwiczenie";
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return `${n} ćwiczenia`;
  }
  return `${n} ćwiczeń`;
}

export default function PortalTodayPage() {
  const params = useParams<{ token: string }>();
  const token = params.token;
  const router = useRouter();
  const [home, setHome] = useState<PortalHome | null>(null);
  const [history, setHistory] = useState<PortalSessionSummary[]>([]);
  const [intake, setIntake] = useState<ClientIntake | null>(null);
  const [checkIns, setCheckIns] = useState<ClientCheckIn[]>([]);
  const [exercises, setExercises] = useState<PortalExercise[]>([]);
  const [liveSession, setLiveSession] = useState<SessionDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [repeating, setRepeating] = useState(false);
  const [staleBusy, setStaleBusy] = useState<"save" | "discard" | null>(null);
  const [selectedWeekDay, setSelectedWeekDay] = useState<PortalWeekDay | null>(null);
  const { setStickyCta } = usePortalStickyCta();
  const heroCtaRef = useRef<HTMLDivElement>(null);
  const [heroCtaLeftView, setHeroCtaLeftView] = useState(false);
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
      api.portal.getIntake(token).catch(() => null),
      api.portal.checkIns(token).catch(() => [] as ClientCheckIn[]),
      api.portal.exercises(token).catch(() => [] as PortalExercise[]),
    ])
      .then(([h, s, intk, checkinRows, exs]) => {
        setHome(h);
        setHistory(s);
        setIntake(intk);
        setCheckIns(checkinRows);
        setExercises(exs);
      })
      .catch((e: Error) => setError(e.message));
  }, [token, todayIso]);

  useEffect(load, [load]);

  // Szczegóły sesji w toku — markery postępu na liście ćwiczeń.
  // Stary liveSession jest ignorowany, dopóki id nie zgadza się z fresh (heroRows).
  useEffect(() => {
    const id = home?.inProgressSession?.id;
    if (id == null) return;
    let cancelled = false;
    api.portal
      .getSession(token, id)
      .then((detail) => {
        if (!cancelled) setLiveSession(detail);
      })
      .catch(() => {
        /* fallback: heroRows używa listy z planu */
      });
    return () => {
      cancelled = true;
    };
  }, [home?.inProgressSession?.id, token]);

  const weekMapsToCalendar = useMemo(
    () => planDaysMapToWeekdays(home?.week),
    [home?.week],
  );

  const weekStrip = useMemo(
    () => buildWeekStrip(history.map((s) => s.performedOn), false, home?.week),
    [history, home?.week],
  );

  /** Historia z API to już tylko ukończone, sortowane od najnowszej. */
  const lastCompleted = history[0] ?? null;

  const startDay = useCallback(
    async (planDayId: number) => {
      if (!home?.today && !home) return;
      if (!home) return;
      setStarting(true);
      setError(null);
      try {
        if (home.inProgressSession) {
          router.push(`/portal/${token}/session/${home.inProgressSession.id}`);
          return;
        }
        const assignmentId = home.today?.assignmentId;
        const planId = home.today?.planId;
        if (assignmentId == null || planId == null) {
          setError("Brak aktywnego planu.");
          setStarting(false);
          return;
        }
        const session = await api.portal.startSession(token, {
          clientId: home.client.id,
          assignmentId,
          planId,
          planDayId,
          performedOn: todayIso,
        });
        router.push(`/portal/${token}/session/${session.id}`);
      } catch (e) {
        setError((e as Error).message);
        setStarting(false);
      }
    },
    [home, router, token, todayIso],
  );

  const start = useCallback(async () => {
    if (!home?.today) return;
    await startDay(home.today.day.id);
  }, [home, startDay]);

  const repeatSession = useCallback(
    async (sessionId: number) => {
      if (!home) return;
      if (home.inProgressSession) {
        router.push(`/portal/${token}/session/${home.inProgressSession.id}`);
        return;
      }
      setRepeating(true);
      setError(null);
      try {
        const session = await api.portal.startSession(token, {
          clientId: home.client.id,
          repeatSessionId: sessionId,
          assignmentId: home.today?.assignmentId ?? null,
          planId: home.today?.planId ?? null,
          performedOn: todayIso,
        });
        router.push(`/portal/${token}/session/${session.id}`);
      } catch (e) {
        setError((e as Error).message);
        setRepeating(false);
      }
    },
    [home, router, token, todayIso],
  );

  const repeatLast = useCallback(async () => {
    if (!lastCompleted) return;
    await repeatSession(lastCompleted.id);
  }, [lastCompleted, repeatSession]);

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

  // Jeden invert: sticky tylko gdy CTA nad listą wyjedzie z kadru (albo gdy go nie ma).
  useEffect(() => {
    const el = heroCtaRef.current;
    if (!el) {
      setHeroCtaLeftView(false);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) =>
        setHeroCtaLeftView(!(entry.isIntersecting && entry.intersectionRatio >= 0.35)),
      { threshold: [0, 0.35, 1] },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [home?.inProgressSession?.id, home?.today?.day.id]);

  useEffect(() => {
    const hasInFlow = Boolean(home?.inProgressSession || home?.today);
    if (hasInFlow && !heroCtaLeftView) {
      setStickyCta(null);
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
    heroCtaLeftView,
    setStickyCta,
    start,
    starting,
    repeating,
    repeatLast,
    router,
    token,
  ]);

  const today = home?.today ?? null;
  const fresh = home?.inProgressSession ?? null;
  const stale = home?.staleSession ?? null;

  const heroRows = useMemo(() => {
    if (fresh && liveSession && liveSession.id === fresh.id) {
      return previewRowsFromItems(
        liveSession.exercises.map((ex) => {
          const doneCount = ex.sets.filter((s) => s.completed).length;
          const total = ex.sets.length;
          const done = total > 0 && doneCount === total;
          const partial = doneCount > 0 && !done;
          const meta = exerciseById.get(ex.exerciseId);
          const detail = done
            ? "✓"
            : partial
              ? `${doneCount}/${total}`
              : schemeFromLogged(ex, meta);
          return {
            id: ex.id,
            name: ex.exerciseName,
            detail,
            supersetGroup: ex.supersetGroup ?? null,
            restSeconds: ex.restSeconds,
            setCount: ex.sets.filter((s) => !s.isWarmup).length,
            done,
            partial,
          };
        }),
      );
    }
    if (today) {
      return previewRowsFromItems(
        today.day.items.map((item) => ({
          id: item.id,
          name: item.exerciseName,
          detail: schemeLine(item, exerciseById.get(item.exerciseId)),
          supersetGroup: item.supersetGroup,
          restSeconds: item.restBetweenSetsSeconds,
          setCount: item.sets,
        })),
      );
    }
    return [];
  }, [fresh, liveSession, today, exerciseById]);

  if (!home) {
    return (
      <div>
        <ErrorBanner message={error} />
        {error ? null : <PortalHomeSkeleton />}
      </div>
    );
  }

  const estMin = today ? estimateDayMinutes(today.day.items) : null;
  const weekMeta = today?.day ? `tydzień ${today.day.weekNumber}` : null;
  const hasTodayCheckIn = checkIns.some((checkIn) => checkIn.date.slice(0, 10) === todayIso);
  const needsIntake = Boolean(intake && !hasEssentialIntake(intake));

  // Gdy świeża sesja trwa — karta pokazuje dzień tej sesji (spójność z CTA).
  const cardTitle = fresh?.dayLabel?.trim() || today?.day.label || null;
  const cardSubtitle = today
    ? `${today.planName}${weekMeta ? ` · ${weekMeta}` : ""}`
    : null;
  const dueWeekday = today ? weekdayIndexFromLabel(today.day.label) : null;
  const heroSectionLabel = fresh
    ? "Trening w toku"
    : dueWeekday != null && dueWeekday !== localWeekdayIndex()
      ? "Następny trening"
      : "Dzisiejszy trening";
  const sheetBusy = starting || repeating;

  const exerciseCount = heroRows.length;
  const metaRight = fresh
    ? setsProgressLabel(fresh.completedSets, fresh.totalSets)
    : estMin != null && exerciseCount > 0
      ? `${exerciseCountLabel(exerciseCount)} · ${formatDurationApprox(estMin)}`
      : exerciseCount > 0
        ? exerciseCountLabel(exerciseCount)
        : estMin != null
          ? formatDurationApprox(estMin)
          : null;

  const goToLiveSession = () => {
    if (fresh) router.push(`/portal/${token}/session/${fresh.id}`);
  };

  return (
    <div className="mx-auto max-w-lg space-y-8">
      <header>
        <p className="text-xs font-medium uppercase tracking-caps text-muted">
          {heroSectionLabel}
        </p>
        <h1 className="mt-2 break-words text-[1.75rem] font-semibold leading-tight tracking-tight text-foreground sm:text-3xl">
          {cardTitle || (fresh ? "Trening w toku" : "Trening")}
        </h1>
        {cardSubtitle ? (
          <p className="mt-1.5 text-[15px] text-muted">{cardSubtitle}</p>
        ) : null}
        {metaRight ? (
          <p className="mt-1 font-mono text-sm tabular-nums text-muted">{metaRight}</p>
        ) : null}
      </header>

      <ErrorBanner message={error} />

      <section aria-label="Tydzień" className="flex gap-1.5">
        {weekStrip.map((d, i) => {
          const clickable = weekMapsToCalendar && d.hasPlanDay && d.planDay != null;
          const inner = (
            <>
              <div
                className={`font-mono text-xs font-medium uppercase tracking-caps ${
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
                      : d.hasPlanDay && weekMapsToCalendar
                        ? "border border-border text-muted"
                        : "text-muted-faint"
                }`}
              >
                {d.done ? "✓" : d.today ? "·" : d.hasPlanDay && weekMapsToCalendar ? "·" : ""}
              </div>
            </>
          );
          if (clickable) {
            return (
              <button
                key={i}
                type="button"
                aria-label={`Podgląd: ${d.planDay!.label}`}
                onClick={() => setSelectedWeekDay(d.planDay!)}
                className="flex flex-1 flex-col items-center gap-1.5 rounded-lg py-1 transition-[transform,opacity] duration-[var(--dur-fast)] ease-[var(--ease-out)] hover:bg-surface-hover/40 focus-visible:outline-none focus-visible:shadow-[var(--glow-accent)] active:scale-[0.97]"
              >
                {inner}
              </button>
            );
          }
          return (
            <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
              {inner}
            </div>
          );
        })}
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
        <section aria-label={heroSectionLabel} className="space-y-1">
          {today?.cycleRestart && !fresh ? (
            <p className="text-sm text-muted">Cykl ukończony — zaczynasz od nowa.</p>
          ) : null}

          {fresh ? (
            <div ref={heroCtaRef} className="pt-2">
              <Button full size="lg" onClick={goToLiveSession}>
                Kontynuuj trening
              </Button>
            </div>
          ) : today ? (
            <div ref={heroCtaRef} className="pt-2">
              <Button
                full
                size="lg"
                disabled={starting}
                loading={starting}
                onClick={() => void start()}
              >
                {starting ? "Startuję…" : "Rozpocznij trening"}
              </Button>
            </div>
          ) : null}

          {heroRows.length > 0 ? (
            <ul className="mt-4 divide-y divide-border">
              {heroRows.map((row) => (
                <li key={row.key}>
                  {fresh ? (
                    <button
                      type="button"
                      onClick={goToLiveSession}
                      className="flex min-h-11 w-full items-start justify-between gap-3 py-4 text-left transition-colors duration-[var(--dur-fast)] hover:bg-surface-hover/40 focus-visible:outline-none focus-visible:shadow-[var(--glow-accent)] active:scale-[0.99]"
                    >
                      <p
                        className={`min-w-0 flex-1 break-words text-[15px] font-semibold leading-snug ${
                          row.done ? "text-muted" : "text-foreground"
                        }`}
                      >
                        {row.name}
                      </p>
                      <p className="shrink-0 font-mono text-[15px] tabular-nums text-muted">
                        {row.detail}
                      </p>
                    </button>
                  ) : (
                    <div className="flex min-h-11 items-start justify-between gap-3 py-4">
                      <p className="min-w-0 flex-1 break-words text-[15px] font-semibold leading-snug text-foreground">
                        {row.name}
                      </p>
                      <p className="shrink-0 font-mono text-[15px] tabular-nums text-muted">
                        {row.detail}
                      </p>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          ) : null}

          {lastCompleted && !fresh && !stale && !today ? (
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

      {/* Fallback: plan bez etykiet dni tygodnia — lista wszystkich dni cyklu. */}
      {!weekMapsToCalendar && home.week && home.week.length > 0 && !fresh ? (
        <section aria-label="Wszystkie treningi" className="space-y-2">
          <p className="font-mono text-xs font-medium uppercase tracking-caps text-muted">
            Wszystkie treningi
          </p>
          <ul className="divide-y divide-border border-y border-border">
            {home.week.map((d) => (
              <li key={d.id}>
                <button
                  type="button"
                  onClick={() => setSelectedWeekDay(d)}
                  className="flex min-h-11 w-full items-center justify-between gap-3 py-3.5 text-left transition-colors duration-[var(--dur-fast)] hover:bg-surface-hover/40 focus-visible:outline-none focus-visible:shadow-[var(--glow-accent)] active:scale-[0.99]"
                >
                  <span className="min-w-0">
                    <span className="block break-words text-[15px] font-semibold text-foreground">
                      {d.label || `Dzień ${d.order + 1}`}
                    </span>
                    <span className="mt-0.5 block font-mono text-xs text-muted">
                      {d.isToday
                        ? "Następny"
                        : d.completed
                          ? "Zrobiony"
                          : "Do przodu"}
                      {` · tydzień ${d.weekNumber}`}
                    </span>
                  </span>
                  <span className="shrink-0 font-mono text-sm tabular-nums text-muted">
                    {d.completed ? "✓" : d.isToday ? "→" : ""}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <DayPreviewSheet
        key={selectedWeekDay?.id ?? "closed"}
        open={selectedWeekDay != null}
        onClose={() => setSelectedWeekDay(null)}
        token={token}
        weekDay={selectedWeekDay}
        exerciseById={exerciseById}
        inProgressSessionId={fresh?.id ?? null}
        busy={sheetBusy}
        onStart={(dayId) => {
          setSelectedWeekDay(null);
          void startDay(dayId);
        }}
        onRepeat={(sessionId) => {
          setSelectedWeekDay(null);
          void repeatSession(sessionId);
        }}
        onContinue={(sessionId) => {
          setSelectedWeekDay(null);
          router.push(`/portal/${token}/session/${sessionId}`);
        }}
      />

      {/* Poniżej foldu — nie konkurują z CTA „Rozpocznij trening". */}
      <div className="space-y-6 pt-10">
        {!hasTodayCheckIn ? (
          <CheckInCard
            token={token}
            defaultCollapsed
            onSaved={() => {
              void api.portal
                .checkIns(token)
                .then(setCheckIns)
                .catch((e: Error) => setError(e.message));
            }}
          />
        ) : null}

        {needsIntake ? (
          <Link
            href={`/portal/${token}/intake`}
            className="flex min-h-11 w-full items-center gap-3 rounded-xl border border-dashed border-border-strong bg-surface-raised px-4 py-3 text-left transition-[background-color,transform] duration-[var(--dur-fast)] ease-[var(--ease-out)] hover:bg-surface-hover focus-visible:outline-none focus-visible:shadow-[var(--glow-accent)] active:scale-[0.98]"
          >
            <div className="min-w-0 flex-1">
              <p className="font-mono text-xs font-medium uppercase tracking-caps text-muted">
                Ankieta startowa
              </p>
              <p className="mt-1 text-sm text-muted">Kilka informacji dla trenera</p>
            </div>
          </Link>
        ) : null}

        <PwaInstallPrompt token={token} defaultCollapsed />
      </div>
    </div>
  );
}
