"use client";

import { useEffect, useState } from "react";
import { api, SessionDetail } from "@/lib/api";
import { Badge, Button, Card, ErrorBanner, formatRest, inputClass } from "@/components/ui";
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

function formatSet(
  weightKg: number | null | undefined,
  reps: number | null | undefined,
  durationSeconds: number | null | undefined,
  isTime: boolean,
): string {
  if (isTime && durationSeconds != null) return `${durationSeconds} s`;
  if (weightKg != null && reps != null) return `${formatKg(weightKg)}×${reps}`;
  if (reps != null) return `${reps}`;
  if (weightKg != null) return `${formatKg(weightKg)} kg`;
  return "—";
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

export function SessionReview({
  session,
  clientName,
  onEdit,
  onUpdated,
}: {
  session: SessionDetail;
  clientName?: string;
  onEdit: () => void;
  onUpdated: (session: SessionDetail) => void;
}) {
  const [trainerComment, setTrainerComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inProgress = session.status === "in_progress";
  const doneTotal = session.exercises.reduce(
    (acc, ex) => {
      const done = ex.sets.filter((s) => s.completed).length;
      return { done: acc.done + done, total: acc.total + ex.sets.length };
    },
    { done: 0, total: 0 },
  );

  useEffect(() => {
    if (!session.hasUnreadClientReply) return;
    api.sessions.markReplyRead(session.id).then(onUpdated).catch(() => {
      /* ignore */
    });
  }, [session.hasUnreadClientReply, session.id, onUpdated]);

  const saveComment = async () => {
    if (!trainerComment.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await api.sessions.comment(session.id, trainerComment.trim());
      setTrainerComment("");
      onUpdated(updated);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 pb-8">
      <ErrorBanner message={error} />

      {inProgress ? (
        <div
          role="status"
          className="rounded-[10px] border border-accent-border bg-accent-dim/40 px-3 py-2.5 text-sm text-foreground-secondary"
        >
          {clientName ? `${clientName} trenuje teraz` : "Klient trenuje teraz"}
          {" — "}
          <span className="font-mono tabular-nums">
            {doneTotal.done}/{doneTotal.total} serii
          </span>
        </div>
      ) : null}

      <div>
        <p className="text-xs font-semibold uppercase tracking-caps text-muted-faint">
          {inProgress ? "Sesja w toku" : "Trening ukończony"}
        </p>
        <h1 className="mt-1 break-words font-display text-2xl font-bold sm:text-3xl">
          {session.dayLabel ?? "Trening"}
        </h1>
        <p className="mt-0.5 text-[13px] text-muted">
          {formatDay(session.performedOn)}
          {session.planName ? ` · ${session.planName}` : ""}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="Czas"
          value={
            inProgress && session.durationSeconds == null
              ? "—"
              : formatDurationClock(session.durationSeconds)
          }
        />
        <StatCard
          label="Objętość"
          value={`${Math.round(session.totalVolumeKg).toLocaleString("pl-PL")} kg`}
        />
        <StatCard label="Serie" value={`${doneTotal.done}/${doneTotal.total}`} />
        <StatCard
          label="Rekordy"
          value={String(session.prs.length)}
          highlight={session.prs.length > 0}
        />
      </div>

      <div className="space-y-3">
        {session.exercises.map((ex) => {
          const isTime = ex.exerciseType === "time";
          const done = ex.sets.filter((s) => s.completed).length;
          const hasPr =
            ex.sets.some((s) => s.isPr && s.completed) ||
            session.prs.some((p) => p.exerciseId === ex.exerciseId);
          return (
            <Card
              key={ex.id}
              title={ex.exerciseName}
              meta={`${done}/${ex.sets.length} serii${ex.restSeconds != null ? ` · ${formatRest(ex.restSeconds)}` : ""}`}
              headerAction={hasPr ? <Badge tone="pr">PR</Badge> : undefined}
            >
              {ex.substitutedFromName ? (
                <p className="mb-2 text-xs text-muted">zamieniono z {ex.substitutedFromName}</p>
              ) : null}
              {ex.planNote ? (
                <p className="mb-2 text-[13px] text-muted">Trener: {ex.planNote}</p>
              ) : null}

              <div className="grid grid-cols-[2rem_1fr_1fr] gap-x-2 gap-y-1 border-b border-border pb-1 font-mono text-[10px] font-medium uppercase tracking-caps text-muted">
                <div>#</div>
                <div>Cel</div>
                <div>Wynik</div>
              </div>
              {ex.sets.map((s) => {
                const below = isBelowTarget(s, isTime);
                const target = formatSet(
                  s.targetWeightKg,
                  s.targetReps,
                  s.targetDurationSeconds,
                  isTime,
                );
                const actual = s.completed
                  ? formatSet(s.weightKg, s.reps, s.durationSeconds, isTime)
                  : "—";
                return (
                  <div
                    key={s.id}
                    className="grid min-h-10 grid-cols-[2rem_1fr_1fr] items-center gap-x-2 border-b border-border py-1.5 last:border-0"
                  >
                    <span className="font-mono text-[13px] tabular-nums text-muted">
                      {String(s.setNumber).padStart(2, "0")}
                      {s.isWarmup ? (
                        <span className="block text-[10px] text-muted-faint">W</span>
                      ) : null}
                    </span>
                    <span className="font-mono text-[13px] tabular-nums text-muted-faint">
                      {target}
                    </span>
                    <span
                      className={`flex items-center gap-1.5 font-mono text-[13px] tabular-nums ${
                        below
                          ? "text-danger-hover"
                          : s.completed
                            ? "text-foreground"
                            : "text-muted"
                      }`}
                    >
                      {actual}
                      {s.isPr && s.completed ? <Badge tone="pr">PR</Badge> : null}
                      {below ? <span className="text-xs">▾</span> : null}
                    </span>
                  </div>
                );
              })}
              {ex.note ? (
                <p className="mt-2 text-[13px] text-foreground-secondary">{ex.note}</p>
              ) : null}
            </Card>
          );
        })}
      </div>

      {(session.feelingScore != null ||
        session.sleepScore != null ||
        session.energyScore != null) && (
        <Card title="Check-in klienta">
          <div className="grid grid-cols-3 gap-3">
            <ScoreReadout label="Samopoczucie" value={session.feelingScore} />
            <ScoreReadout label="Sen" value={session.sleepScore} />
            <ScoreReadout label="Energia" value={session.energyScore} />
          </div>
        </Card>
      )}

      {session.note ? (
        <Card title="Wiadomość od klienta">
          <p className="whitespace-pre-wrap text-sm text-foreground-secondary">{session.note}</p>
        </Card>
      ) : null}

      {session.trainerComment ? (
        <Card title="Twój komentarz">
          <p className="whitespace-pre-wrap text-sm text-foreground-secondary">
            {session.trainerComment}
          </p>
        </Card>
      ) : null}

      {session.clientReply ? (
        <Card title="Odpowiedź klienta">
          <p className="whitespace-pre-wrap text-sm text-foreground-secondary">
            {session.clientReply}
          </p>
        </Card>
      ) : null}

      {!inProgress ? (
        <Card title="Komentarz dla klienta" meta="Klient zobaczy go przy podsumowaniu treningu.">
          <textarea
            className={`${inputClass} min-h-[88px] resize-none py-3`}
            value={trainerComment}
            onChange={(e) => setTrainerComment(e.target.value)}
            placeholder="Krótka wskazówka do kolejnego treningu…"
            rows={3}
          />
          <div className="mt-3">
            <Button disabled={saving || !trainerComment.trim()} onClick={() => void saveComment()}>
              Dodaj komentarz
            </Button>
          </div>
        </Card>
      ) : null}

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button variant="secondary" full onClick={onEdit}>
          {inProgress ? "Wpisz wynik za klienta" : "Popraw wyniki"}
        </Button>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border bg-surface px-4 py-4 shadow-card ${
        highlight ? "border-pr" : "border-border"
      }`}
    >
      <p
        className={`font-mono text-3xl font-semibold tabular-nums ${
          highlight ? "text-pr" : "text-foreground"
        }`}
      >
        {value}
      </p>
      <p className="mt-1.5 text-xs font-semibold uppercase tracking-caps text-muted">{label}</p>
    </div>
  );
}

function ScoreReadout({ label, value }: { label: string; value: number | null }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-caps text-muted">{label}</p>
      <p className="mt-1 font-mono text-xl font-semibold tabular-nums">
        {value != null ? value : "—"}
      </p>
    </div>
  );
}
