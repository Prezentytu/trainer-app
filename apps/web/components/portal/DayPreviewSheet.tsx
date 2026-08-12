"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  api,
  PortalDayPreview,
  PortalExercise,
  PortalWeekDay,
} from "@/lib/api";
import { Button, ErrorBanner, Sheet } from "@/components/ui";
import { estimateDayMinutes, formatDurationApprox } from "@/lib/estimateDuration";
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

function exerciseCountLabel(n: number): string {
  if (n === 1) return "1 ćwiczenie";
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return `${n} ćwiczenia`;
  }
  return `${n} ćwiczeń`;
}

export type DayPreviewSheetProps = {
  open: boolean;
  onClose: () => void;
  token: string;
  /** Lekkie meta z home.week — sheet dociąga pełny dzień. */
  weekDay: PortalWeekDay | null;
  exerciseById: Map<number, PortalExercise>;
  /** Świeża sesja w toku — wtedy CTA = Kontynuuj. */
  inProgressSessionId: number | null;
  busy: boolean;
  onStart: (dayId: number, opts: { outOfOrder: boolean; label: string }) => void;
  onRepeat: (sessionId: number) => void;
  onContinue: (sessionId: number) => void;
};

export function DayPreviewSheet({
  open,
  onClose,
  token,
  weekDay,
  exerciseById,
  inProgressSessionId,
  busy,
  onStart,
  onRepeat,
  onContinue,
}: DayPreviewSheetProps) {
  const dayId = weekDay?.id;
  const [preview, setPreview] = useState<PortalDayPreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmAhead, setConfirmAhead] = useState(false);

  useEffect(() => {
    if (!open || dayId == null) return;
    let cancelled = false;
    api.portal
      .day(token, dayId)
      .then((d) => {
        if (!cancelled) {
          setPreview(d);
          setError(null);
        }
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message);
      });
    return () => {
      cancelled = true;
    };
  }, [open, dayId, token]);

  const showLoading = open && dayId != null && preview == null && !error;
  const day = preview?.day ?? null;
  const label = day?.label?.trim() || weekDay?.label || "Trening";
  const isDue = preview?.isDue ?? weekDay?.isToday ?? false;
  const completed = preview?.completed ?? weekDay?.completed ?? false;
  const lastCompletedId =
    preview?.lastCompletedSessionId ?? weekDay?.lastCompletedSessionId ?? null;
  const estMin = day ? estimateDayMinutes(day.items) : null;
  const items = day?.items ?? [];

  const statusLabel = inProgressSessionId
    ? "Sesja w toku"
    : completed
      ? "Zrobiony w tym cyklu"
      : isDue
        ? "Następny w kolejce"
        : "Do przodu";

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
  } else if (completed && lastCompletedId) {
    footer = (
      <Button
        variant="primary"
        full
        disabled={busy || showLoading}
        loading={busy}
        onClick={() => onRepeat(lastCompletedId)}
      >
        {busy ? "Startuję…" : "Powtórz trening"}
      </Button>
    );
  } else if (confirmAhead && !isDue) {
    footer = (
      <div className="flex w-full flex-col gap-2">
        <p className="text-sm text-muted">
          To trening z {label.toLowerCase()}. Zaczynasz go dziś — trener zobaczy tę zmianę.
        </p>
        <Button
          variant="primary"
          full
          disabled={busy || !day}
          loading={busy}
          onClick={() => {
            if (!day) return;
            onStart(day.id, { outOfOrder: true, label });
          }}
        >
          {busy ? "Startuję…" : "Tak, zacznij dziś"}
        </Button>
        <Button variant="ghost" full disabled={busy} onClick={() => setConfirmAhead(false)}>
          Anuluj
        </Button>
      </div>
    );
  } else if (day || weekDay) {
    footer = (
      <Button
        variant="primary"
        full
        disabled={busy || showLoading}
        loading={busy}
        onClick={() => {
          const id = day?.id ?? weekDay?.id;
          if (id == null) return;
          if (!isDue) {
            setConfirmAhead(true);
            return;
          }
          onStart(id, { outOfOrder: false, label });
        }}
      >
        {busy ? "Startuję…" : "Rozpocznij trening"}
      </Button>
    );
  }

  return (
    <Sheet open={open} onClose={busy ? undefined : onClose} title={label} footer={footer}>
      <div className="space-y-4 pb-[env(safe-area-inset-bottom)]">
        <ErrorBanner message={error} />
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="font-mono text-xs font-medium uppercase tracking-caps text-muted">
            {statusLabel}
          </p>
          {preview?.planName ? (
            <p className="text-sm text-muted">{preview.planName}</p>
          ) : null}
        </div>
        {estMin != null && items.length > 0 ? (
          <p className="font-mono text-sm tabular-nums text-muted">
            {exerciseCountLabel(items.length)} · {formatDurationApprox(estMin)}
          </p>
        ) : items.length > 0 ? (
          <p className="font-mono text-sm tabular-nums text-muted">
            {exerciseCountLabel(items.length)}
          </p>
        ) : null}

        {showLoading ? (
          <p className="text-sm text-muted">Wczytuję ćwiczenia…</p>
        ) : items.length > 0 ? (
          <ul className="divide-y divide-border border-y border-border">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex min-h-11 items-start justify-between gap-3 py-3"
              >
                <p className="min-w-0 flex-1 break-words text-[15px] font-semibold leading-snug text-foreground">
                  {item.exerciseName}
                </p>
                <p className="shrink-0 font-mono text-[15px] tabular-nums text-muted">
                  {schemeLine(item, exerciseById.get(item.exerciseId))}
                </p>
              </li>
            ))}
          </ul>
        ) : !error ? (
          <p className="text-sm text-muted">Brak ćwiczeń w tym dniu.</p>
        ) : null}
      </div>
    </Sheet>
  );
}
