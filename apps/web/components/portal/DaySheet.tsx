"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  api,
  PortalDayPreview,
  PortalExercise,
  SessionDetail,
} from "@/lib/api";
import { Button, ErrorBanner, inputClass, Sheet } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { ExercisePreviewList } from "@/components/portal/ExercisePreviewList";
import { PerformedExerciseList } from "@/components/session/PerformedExerciseList";
import { estimateDayMinutes, formatDurationApprox, formatDurationMinutes } from "@/lib/estimateDuration";
import { polishExerciseCount, polishTrainingCount } from "@/lib/plural";
import type { WeekStripDay } from "@/lib/portalWeekStrip";
import type { PreviewItem } from "@/lib/supersetPreview";
import { todayIsoLocal } from "@/lib/dates";
import { compactSchemeLine } from "@/lib/schemeSummary";

function schemeLine(
  item: PortalDayPreview["day"]["items"][number],
  exerciseMeta?: Pick<PortalExercise, "equipment" | "isUnilateral"> | null,
): string {
  return compactSchemeLine(item, exerciseMeta);
}

function formatSheetTitle(iso: string, fallback: string): string {
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return fallback;
  const raw = d.toLocaleDateString("pl-PL", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

function sessionMetaLine(session: SessionDetail): string {
  const parts: string[] = [];
  const dur = formatDurationMinutes(session.durationSeconds);
  if (dur) parts.push(dur);
  if (session.totalVolumeKg > 0) {
    parts.push(`${Math.round(session.totalVolumeKg).toLocaleString("pl-PL")} kg`);
  }
  const prCount = session.prs?.length ?? 0;
  if (prCount > 0) parts.push(prCount === 1 ? "★ PR" : `★ ${prCount}× PR`);
  return parts.join(" · ");
}

export type DaySheetProps = {
  open: boolean;
  onClose: () => void;
  token: string;
  slot: WeekStripDay | null;
  exerciseById: Map<number, PortalExercise>;
  inProgressSessionId: number | null;
  busy: boolean;
  rescheduleOptions?: { iso: string; label: string }[];
  onStart: (dayId: number, opts: { outOfOrder: boolean; label: string }) => void;
  onRepeat: (sessionId: number) => void;
  onContinue: (sessionId: number) => void;
  onRescheduled?: () => void;
};

export function DaySheet({
  open,
  onClose,
  token,
  slot,
  exerciseById,
  inProgressSessionId,
  busy,
  rescheduleOptions = [],
  onStart,
  onRepeat,
  onContinue,
  onRescheduled,
}: DaySheetProps) {
  const iso = slot?.iso ?? null;
  const planDayId = slot?.planDay?.id ?? null;
  const sessionIds = slot?.sessions.map((s) => s.id) ?? [];
  const [preview, setPreview] = useState<PortalDayPreview | null>(null);
  const [details, setDetails] = useState<SessionDetail[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmAhead, setConfirmAhead] = useState(false);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [rescheduleBusy, setRescheduleBusy] = useState(false);
  const [otherDate, setOtherDate] = useState("");

  useEffect(() => {
    if (!open) return;
    if (!iso && planDayId == null && sessionIds.length === 0) return;
    let cancelled = false;

    const load = async () => {
      try {
        if (sessionIds.length > 0) {
          const rows = await Promise.all(
            sessionIds.map((id) => api.portal.getSession(token, id)),
          );
          if (cancelled) return;
          setDetails(rows);
          setError(null);
          return;
        }
        if (planDayId != null) {
          const d = await api.portal.day(token, planDayId);
          if (cancelled) return;
          setPreview(d);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, iso, planDayId, token, sessionIds.join(",")]);

  const hasSessions = sessionIds.length > 0;
  const showLoading =
    open &&
    !error &&
    ((hasSessions && details == null) || (!hasSessions && planDayId != null && preview == null));

  const day = preview?.day ?? null;
  const title = iso
    ? formatSheetTitle(iso, slot?.planDay?.label || "Trening")
    : slot?.planDay?.label || "Trening";
  const isDue = preview?.isDue ?? slot?.planDay?.isToday ?? false;
  const planLabel = day?.label?.trim() || slot?.planDay?.label || "Trening";
  const lastSessionId = sessionIds.length > 0 ? sessionIds[sessionIds.length - 1] : null;
  const estMin = day ? estimateDayMinutes(day.items) : null;
  const items = day?.items ?? [];
  const todayIso = todayIsoLocal();

  const moveTo = async (date: string) => {
    const id = day?.id ?? slot?.planDay?.id;
    if (id == null || date === iso) return;
    setRescheduleBusy(true);
    setError(null);
    try {
      await api.portal.rescheduleDay(token, id, { date });
      onRescheduled?.();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setRescheduleBusy(false);
    }
  };

  const planItems: PreviewItem[] = items.map((item) => ({
    id: item.id,
    name: item.exerciseName,
    detail: schemeLine(item, exerciseById.get(item.exerciseId)),
    supersetGroup: item.supersetGroup,
    restSeconds: item.restBetweenSetsSeconds,
    setCount: item.sets,
    exerciseId: item.exerciseId,
    notes: item.notes,
  }));

  const statusLabel = inProgressSessionId
    ? "Sesja w toku"
    : hasSessions
      ? sessionIds.length > 1
        ? polishTrainingCount(sessionIds.length)
        : "Zrobiony tego dnia"
      : isDue
        ? "Następny w kolejce"
        : slot?.hasPlanDay
          ? "Do przodu"
          : "Wolny dzień";

  let footer: ReactNode = null;
  if (inProgressSessionId) {
    footer = (
      <Button
        variant="primary"
        full
        disabled={busy}
        onClick={() => onContinue(inProgressSessionId)}
      >
        Kontynuuj trening
      </Button>
    );
  } else if (hasSessions && lastSessionId) {
    footer = (
      <Button
        variant="primary"
        full
        disabled={busy || showLoading}
        loading={busy}
        onClick={() => onRepeat(lastSessionId)}
      >
        {busy ? "Startuję…" : "Powtórz trening"}
      </Button>
    );
  } else if (confirmAhead && !isDue && (day || slot?.planDay)) {
    footer = (
      <div className="flex w-full flex-col gap-2">
        <p className="text-sm text-muted">
          To trening z {planLabel.toLowerCase()}. Zaczynasz go dziś — trener zobaczy tę zmianę.
        </p>
        <Button
          variant="primary"
          full
          disabled={busy || !day}
          loading={busy}
          onClick={() => {
            if (!day) return;
            onStart(day.id, { outOfOrder: true, label: planLabel });
          }}
        >
          {busy ? "Startuję…" : "Tak, zacznij dziś"}
        </Button>
        <Button variant="ghost" full disabled={busy} onClick={() => setConfirmAhead(false)}>
          Anuluj
        </Button>
      </div>
    );
  } else if (day || slot?.planDay) {
    footer = (
      <Button
        variant="primary"
        full
        disabled={busy || showLoading}
        loading={busy}
        onClick={() => {
          const id = day?.id ?? slot?.planDay?.id;
          if (id == null) return;
          if (!isDue) {
            setConfirmAhead(true);
            return;
          }
          onStart(id, { outOfOrder: false, label: planLabel });
        }}
      >
        {busy ? "Startuję…" : "Rozpocznij trening"}
      </Button>
    );
  }

  return (
    <Sheet open={open} onClose={busy ? undefined : onClose} title={title} footer={footer}>
      <div className="space-y-4">
        <ErrorBanner message={error} />
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="font-mono text-xs font-medium uppercase tracking-caps text-muted">
            {statusLabel}
          </p>
          {preview?.planName ? (
            <p className="text-sm text-muted">{preview.planName}</p>
          ) : details?.[0]?.planName ? (
            <p className="text-sm text-muted">{details[0].planName}</p>
          ) : null}
        </div>

        {showLoading ? (
          <p className="text-sm text-muted">
            {hasSessions ? "Wczytuję wyniki…" : "Wczytuję ćwiczenia…"}
          </p>
        ) : details && details.length > 0 ? (
          <div className="space-y-8">
            {details.map((session) => {
              const meta = sessionMetaLine(session);
              return (
                <article key={session.id} className="space-y-3">
                  <div>
                    <h3 className="break-words text-[15px] font-semibold leading-snug text-foreground">
                      {session.dayLabel?.trim() || "Trening"}
                    </h3>
                    {meta ? (
                      <p className="mt-0.5 font-mono text-sm tabular-nums text-muted">{meta}</p>
                    ) : null}
                  </div>
                  <PerformedExerciseList session={session} heading={false} />
                  <Link
                    href={`/portal/${token}/session/${session.id}?from=history`}
                    className="inline-flex min-h-11 items-center gap-1 text-sm font-medium text-foreground underline-offset-4 hover:underline focus-visible:outline-none focus-visible:shadow-[var(--focus-ring)]"
                  >
                    Zobacz cały trening
                    <Icon name="caret-right" size={16} decorative />
                  </Link>
                </article>
              );
            })}
          </div>
        ) : items.length > 0 ? (
          <>
            {estMin != null ? (
              <p className="font-mono text-sm tabular-nums text-muted">
                {polishExerciseCount(planItems.length)} · {formatDurationApprox(estMin)}
              </p>
            ) : (
              <p className="font-mono text-sm tabular-nums text-muted">
                {polishExerciseCount(planItems.length)}
              </p>
            )}
            <ExercisePreviewList
              items={planItems}
              exerciseById={exerciseById}
              fallbackYoutubeId={(exerciseId) =>
                items.find((it) => it.exerciseId === exerciseId)?.demoYoutubeId ?? null
              }
            />
          </>
        ) : !error ? (
          <p className="text-sm text-muted">Tego dnia nie trenowałeś.</p>
        ) : null}

        {!hasSessions && !inProgressSessionId && (day || slot?.planDay) ? (
          <div className="border-t border-border pt-4">
            {rescheduleOpen ? (
              <div className="space-y-3">
                <p className="text-sm text-muted">
                  Wybierz dzień. Trening w inny termin bez przekładania też jest w porządku.
                </p>
                {rescheduleOptions.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {rescheduleOptions.map((opt) => {
                      const selected = opt.iso === iso;
                      return (
                        <button
                          key={opt.iso}
                          type="button"
                          disabled={rescheduleBusy || selected}
                          onClick={() => void moveTo(opt.iso)}
                          className={`inline-flex min-h-11 min-w-11 items-center justify-center rounded-[10px] px-3 font-mono text-xs font-medium tabular-nums transition-colors duration-[var(--dur-fast)] focus-visible:outline-none focus-visible:shadow-[var(--focus-ring)] ${
                            selected
                              ? "bg-invert-bg text-invert-fg"
                              : "border border-border-strong text-foreground-secondary hover:bg-surface-hover"
                          }`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                ) : null}
                <label className="block">
                  <span className="font-mono text-xs font-medium uppercase tracking-caps text-muted">
                    Inna data
                  </span>
                  <input
                    type="date"
                    className={`${inputClass} mt-1`}
                    value={otherDate}
                    min={todayIso}
                    onChange={(e) => {
                      const value = e.target.value;
                      setOtherDate(value);
                      if (value) void moveTo(value);
                    }}
                    disabled={rescheduleBusy}
                  />
                </label>
                <Button variant="ghost" full disabled={rescheduleBusy} onClick={() => setRescheduleOpen(false)}>
                  Anuluj
                </Button>
              </div>
            ) : (
              <Button variant="ghost" full disabled={busy} onClick={() => setRescheduleOpen(true)}>
                Przełóż na inny dzień
              </Button>
            )}
          </div>
        ) : null}
      </div>
    </Sheet>
  );
}
