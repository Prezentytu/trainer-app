"use client";

import { useState } from "react";
import { api, SessionDetail } from "@/lib/api";
import { Button, StatBlock } from "@/components/ui";
import { formatKg } from "@/lib/plates";

function formatDay(iso: string): string {
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("pl-PL", { day: "numeric", month: "short", year: "numeric" });
}

function formatDurationClock(seconds: number | null): string {
  const sec = seconds ?? 0;
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function isBelowTarget(
  set: SessionDetail["exercises"][0]["sets"][0],
  isTime: boolean,
): boolean {
  if (!set.completed) return false;
  if (isTime) {
    const t = set.targetDurationSeconds;
    return t != null && (set.durationSeconds ?? set.reps ?? 0) < t;
  }
  if (set.targetReps != null && (set.reps ?? 0) < set.targetReps) return true;
  if (set.targetWeightKg != null && (set.weightKg ?? 0) < set.targetWeightKg) return true;
  return false;
}

function prHeadline(count: number): string {
  if (count === 1) return "Rekord osobisty";
  if (count >= 2 && count <= 4) return `${count} rekordy`;
  return `${count} rekordów`;
}

async function shareSessionCard(shareImageUrl: string, title: string) {
  const blob = await api.shareSessionCardBlob(shareImageUrl);
  const file = new File([blob], "trening-repmaxer.png", { type: "image/png" });
  const canFiles =
    typeof navigator !== "undefined" &&
    typeof navigator.canShare === "function" &&
    navigator.canShare({ files: [file] });
  if (canFiles && typeof navigator.share === "function") {
    await navigator.share({ files: [file], title, text: title });
    return;
  }
  // Fallback: pobranie pliku — nigdy nie udostępniamy URL z tokenem.
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = "trening-repmaxer.png";
  a.click();
  URL.revokeObjectURL(objectUrl);
}

export function SessionSummaryView({
  session,
  onBack,
  onEdit,
  shareImageUrl,
}: {
  session: SessionDetail;
  onBack: () => void;
  onEdit: () => void;
  /** Relative path do PNG (bez ujawniania tokenu przez share URL). */
  shareImageUrl?: string | null;
}) {
  const [sharing, setSharing] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);
  const doneTotal = session.exercises.reduce(
    (acc, ex) => {
      const done = ex.sets.filter((s) => s.completed).length;
      return { done: acc.done + done, total: acc.total + ex.sets.length };
    },
    { done: 0, total: 0 },
  );
  const hasPrs = session.prs.length > 0;
  const volume = Math.round(session.totalVolumeKg).toLocaleString("pl-PL");
  const shareTitle = `${session.dayLabel ?? "Trening"}${session.planName ? ` · ${session.planName}` : ""}`;

  return (
    <div className="mx-auto max-w-lg space-y-8 pb-10">
      <header>
        <p className="text-xs font-medium uppercase tracking-caps text-muted">Trening ukończony</p>
        <h1 className="mt-2 break-words font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          {session.dayLabel ?? "Trening"}
        </h1>
        <p className="mt-1.5 text-sm text-muted">
          {formatDay(session.performedOn)}
          {session.planName ? ` · ${session.planName}` : ""}
        </p>
      </header>

      {hasPrs ? (
        <section
          aria-label={prHeadline(session.prs.length)}
          className="rounded-xl border border-pr-border bg-pr-dim px-4 py-4"
        >
          <p className="font-mono text-xs font-medium uppercase tracking-caps text-pr">
            {prHeadline(session.prs.length)}
          </p>
          <ul className="mt-3 space-y-4">
            {session.prs.map((p) => (
              <li key={`${p.exerciseId}-${p.setNumber}`}>
                <p className="break-words text-base font-semibold text-foreground">{p.exerciseName}</p>
                <p className="mt-0.5 font-mono text-xl font-semibold tabular-nums tracking-tight text-foreground">
                  {p.weightKg != null && p.reps != null
                    ? `${formatKg(p.weightKg)}×${p.reps}`
                    : "—"}
                  {p.estimated1Rm != null ? (
                    <span className="text-base font-medium text-muted">
                      {" "}
                      · est. {formatKg(p.estimated1Rm)}
                      {p.previousBest1Rm != null
                        ? ` (poprz. ${formatKg(p.previousBest1Rm)})`
                        : ""}
                    </span>
                  ) : null}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section
        aria-label="Podsumowanie"
        className="grid grid-cols-3 gap-3 border-y border-border py-5"
      >
        <StatBlock label="Czas" value={formatDurationClock(session.durationSeconds)} />
        <StatBlock label="Objętość" value={volume} unit="kg" />
        <StatBlock label="Serie" value={`${doneTotal.done}/${doneTotal.total}`} />
      </section>

      <section aria-label="Ćwiczenia">
        <p className="mb-1 font-mono text-xs font-medium uppercase tracking-caps text-muted">
          Ćwiczenia
        </p>
        <ul className="divide-y divide-border">
          {session.exercises.map((ex) => {
            const done = ex.sets.filter((s) => s.completed).length;
            const isTime = ex.exerciseType === "time";
            const below = ex.sets.some((s) => isBelowTarget(s, isTime));
            const hasPr =
              ex.sets.some((s) => s.isPr && s.completed) ||
              session.prs.some((p) => p.exerciseId === ex.exerciseId);
            const complete = done === ex.sets.length && !below;
            return (
              <li key={ex.id} className="flex min-h-12 items-start justify-between gap-3 py-3.5">
                <div className="min-w-0 flex-1">
                  <p className="break-words text-[15px] font-medium leading-snug text-foreground">
                    {ex.exerciseName}
                  </p>
                  {hasPr ? (
                    <p className="mt-0.5 font-mono text-xs font-medium tracking-caps text-pr">PR</p>
                  ) : null}
                </div>
                <div
                  className={`shrink-0 pt-0.5 text-right font-mono text-sm tabular-nums ${
                    complete ? "text-foreground-secondary" : "text-muted"
                  }`}
                >
                  {done}/{ex.sets.length}
                  {below ? (
                    <span className="mt-0.5 block text-xs text-muted-faint">poniżej celu</span>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {session.note ? (
        <section>
          <p className="font-mono text-xs font-medium uppercase tracking-caps text-muted">
            Wiadomość do trenera
          </p>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground-secondary">
            {session.note}
          </p>
        </section>
      ) : null}

      {shareError ? <p className="text-sm text-danger">{shareError}</p> : null}

      <div className="flex flex-col gap-2 pt-1">
        <Button full onClick={onBack}>
          Gotowe
        </Button>
        {shareImageUrl ? (
          <Button
            variant="secondary"
            full
            disabled={sharing}
            onClick={() => {
              setSharing(true);
              setShareError(null);
              void shareSessionCard(shareImageUrl, shareTitle)
                .catch((e: Error) => setShareError(e.message || "Nie udało się udostępnić."))
                .finally(() => setSharing(false));
            }}
          >
            {sharing ? "Przygotowuję…" : "Udostępnij"}
          </Button>
        ) : null}
        <Button variant="ghost" full onClick={onEdit}>
          Popraw wyniki
        </Button>
      </div>
    </div>
  );
}
