"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  api,
  PortalDayPreview,
  PortalExercise,
  SessionDetail,
} from "@/lib/api";
import { Button, ErrorBanner, Sheet } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { ExercisePreviewList } from "@/components/portal/ExercisePreviewList";
import { PerformedExerciseList } from "@/components/session/PerformedExerciseList";
import { estimateDayMinutes, formatDurationApprox, formatDurationMinutes } from "@/lib/estimateDuration";
import { polishExerciseCount, polishTrainingCount } from "@/lib/plural";
import type { WeekStripDay } from "@/lib/portalWeekStrip";
import type { PreviewItem } from "@/lib/supersetPreview";
import { formatLoadDisplay } from "@/lib/weight";

function schemeLine(
  item: PortalDayPreview["day"]["items"][number],
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
  onStart: (dayId: number, opts: { outOfOrder: boolean; label: string }) => void;
  onRepeat: (sessionId: number) => void;
  onContinue: (sessionId: number) => void;
};

export function DaySheet({
  open,
  onClose,
  token,
  slot,
  exerciseById,
  inProgressSessionId,
  busy,
  onStart,
  onRepeat,
  onContinue,
}: DaySheetProps) {
  const iso = slot?.iso ?? null;
  const planDayId = slot?.planDay?.id ?? null;
  const sessionIds = slot?.sessions.map((s) => s.id) ?? [];
  const [preview, setPreview] = useState<PortalDayPreview | null>(null);
  const [details, setDetails] = useState<SessionDetail[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmAhead, setConfirmAhead] = useState(false);

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
      </div>
    </Sheet>
  );
}
