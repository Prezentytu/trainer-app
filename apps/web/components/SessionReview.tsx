"use client";

import { useEffect, useState, Fragment } from "react";
import { api, SessionDetail, WorkoutSessionInput } from "@/lib/api";
import { refreshNavCounts } from "@/lib/navCounts";
import { Button, Card, ErrorBanner, Field, formatRest, inputClass, Marker } from "@/components/ui";
import { formatDurationMinutes } from "@/lib/estimateDuration";
import { formatKg } from "@/lib/plates";
import { formatSetLoadReps, isDumbbellPair } from "@/lib/weight";
import { buildSessionBlocks } from "@/lib/sessionRounds";

function toSessionInput(session: SessionDetail, performedOn: string): WorkoutSessionInput {
  return {
    clientId: session.clientId,
    performedOn,
    assignmentId: session.assignmentId,
    planDayId: session.planDayId,
    planId: session.planId,
    durationSeconds: session.durationSeconds,
    note: session.note,
    status: session.status,
    exercises: session.exercises.map((e) => ({
      id: e.id > 0 ? e.id : null,
      exerciseId: e.exerciseId,
      substitutedFromExerciseId: e.substitutedFromExerciseId ?? null,
      order: e.order,
      note: e.note,
      sets: e.sets.map((s) => ({
        id: s.id > 0 ? s.id : null,
        setNumber: s.setNumber,
        weightKg: s.weightKg,
        reps: s.reps,
        durationSeconds: s.durationSeconds,
        distanceMeters: s.distanceMeters,
        rir: s.rir,
        rpe: s.rpe,
        isWarmup: s.isWarmup,
        completed: s.completed,
        note: s.note ?? null,
        side: s.side ?? null,
      })),
    })),
  };
}

function formatSet(
  weightKg: number | null | undefined,
  reps: number | null | undefined,
  durationSeconds: number | null | undefined,
  isTime: boolean,
  pairDb = false,
): string {
  if (isTime && durationSeconds != null) return `${durationSeconds} s`;
  if (weightKg != null && reps != null) {
    return pairDb
      ? formatSetLoadReps(weightKg, reps, { equipment: ["dumbbell"], isUnilateral: false })
      : `${formatKg(weightKg)}×${reps}`;
  }
  if (reps != null) return `${reps}`;
  if (weightKg != null) {
    return pairDb ? `2×${formatKg(weightKg)} kg` : `${formatKg(weightKg)} kg`;
  }
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
  /** Lokalny draft daty — po udanym zapisie równa się `session.performedOn`. */
  const [performedOn, setPerformedOn] = useState(session.performedOn);
  const [saving, setSaving] = useState(false);
  const [savingDate, setSavingDate] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inProgress = session.status === "in_progress";
  const dateDirty = performedOn !== session.performedOn;
  const doneTotal = session.exercises.reduce(
    (acc, ex) => {
      const done = ex.sets.filter((s) => s.completed).length;
      return { done: acc.done + done, total: acc.total + ex.sets.length };
    },
    { done: 0, total: 0 },
  );

  useEffect(() => {
    let cancelled = false;
    api.sessions
      .markReplyRead(session.id)
      .then((updated) => {
        if (cancelled) return;
        onUpdated(updated);
        void refreshNavCounts();
      })
      .catch(() => {
        /* ignore */
      });
    return () => {
      cancelled = true;
    };
  }, [session.id, onUpdated]);

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

  const saveDate = async () => {
    if (!performedOn || !dateDirty) return;
    setSavingDate(true);
    setError(null);
    try {
      const updated = await api.sessions.update(session.id, toSessionInput(session, performedOn));
      setPerformedOn(updated.performedOn);
      onUpdated(updated);
    } catch (e) {
      setError((e as Error).message);
      setPerformedOn(session.performedOn);
    } finally {
      setSavingDate(false);
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

      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="Czas"
          value={
            inProgress && session.durationSeconds == null
              ? "—"
              : (formatDurationMinutes(session.durationSeconds) ?? "—")
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
        {buildSessionBlocks(session.exercises).map((block) => {
          const indices = block.kind === "single" ? [block.exIdx] : block.members;
          const cards = indices.map((exIdx) => {
          const ex = session.exercises[exIdx];
          if (!ex) return null;
          const isTime = ex.exerciseType === "time";
          const pairDb = isDumbbellPair(ex);
          const done = ex.sets.filter((s) => s.completed).length;
          const hasPr =
            ex.sets.some((s) => s.isPr && s.completed) ||
            session.prs.some((p) => p.exerciseId === ex.exerciseId);
          const restMeta =
            ex.restSeconds != null
              ? ` · ${formatRest(ex.restSeconds)}${ex.supersetLabel ? " po superserii" : ""}`
              : "";
          return (
            <Card
              key={ex.id}
              title={`${ex.supersetLabel ? `${ex.supersetLabel} ` : ""}${ex.exerciseName}`}
              meta={`${done}/${ex.sets.length} serii${restMeta}`}
              headerAction={hasPr ? <Marker tone="pr">PR</Marker> : undefined}
            >
              {ex.substitutedFromName ? (
                <p className="mb-2 text-xs text-muted">zamieniono z {ex.substitutedFromName}</p>
              ) : null}
              {ex.planNote ? (
                <p className="mb-2 text-[13px] text-muted">Trener: {ex.planNote}</p>
              ) : null}

              <div className="grid grid-cols-[2rem_1fr_1fr] gap-x-2 gap-y-1 border-b border-border pb-1 font-mono text-xs font-medium uppercase tracking-caps text-muted">
                <div>#</div>
                <div>Cel</div>
                <div>Wynik</div>
              </div>
              {ex.sets.map((s) => {
                const isPr = s.isPr && s.completed;
                // PR nigdy nie malujemy na czerwono — rekord > „poniżej celu planu”.
                const below = !isPr && isBelowTarget(s, isTime);
                const target = formatSet(
                  s.targetWeightKg,
                  s.targetReps,
                  s.targetDurationSeconds,
                  isTime,
                  pairDb,
                );
                const actual = s.completed
                  ? formatSet(s.weightKg, s.reps, s.durationSeconds, isTime, pairDb)
                  : "—";
                const setNote = s.note?.trim() || null;
                return (
                  <div key={s.id} className="border-b border-border py-1.5 last:border-0">
                    <div className="grid min-h-10 grid-cols-[2rem_1fr_1fr] items-center gap-x-2">
                      <span className="font-mono text-[13px] tabular-nums text-muted">
                        {String(s.setNumber).padStart(2, "0")}
                        {s.isWarmup ? (
                          <span className="block text-xs text-muted-faint">W</span>
                        ) : null}
                      </span>
                      <span className="font-mono text-[13px] tabular-nums text-muted-faint">
                        {target}
                      </span>
                      <span
                        className={`flex flex-wrap items-center gap-1.5 font-mono text-[13px] tabular-nums ${
                          isPr
                            ? "text-foreground"
                            : below
                              ? "text-danger-hover"
                              : s.completed
                                ? "text-foreground"
                                : "text-muted"
                        }`}
                      >
                        {actual}
                        {isPr ? <Marker tone="pr">PR</Marker> : null}
                        {below ? (
                          <span className="text-xs text-danger-hover" title="Poniżej celu z planu">
                            ▾
                          </span>
                        ) : null}
                      </span>
                    </div>
                    {setNote ? (
                      <p className="mt-1 pl-10 whitespace-pre-wrap text-[13px] leading-snug text-foreground-secondary">
                        <span className="mr-1.5 font-mono text-xs font-medium uppercase tracking-caps text-fg-ghost">
                          Notatka
                        </span>
                        {setNote}
                      </p>
                    ) : null}
                  </div>
                );
              })}
              {ex.note?.trim() ? (
                <p className="mt-2 whitespace-pre-wrap text-[13px] leading-snug text-foreground-secondary">
                  <span className="mr-1.5 font-mono text-xs font-medium uppercase tracking-caps text-fg-ghost">
                    Notatka do ćwiczenia
                  </span>
                  {ex.note.trim()}
                </p>
              ) : null}
            </Card>
          );
          });
          if (block.kind === "single") {
            return <Fragment key={`ex-${block.exIdx}`}>{cards}</Fragment>;
          }
          const pos = session.exercises[block.members[0]]?.supersetLabel?.replace(/[a-z]+$/i, "") ?? "";
          return (
            <div
              key={`ss-${block.group}-${block.members.join("-")}`}
              className="overflow-hidden rounded-[10px] border border-border-strong"
            >
              <div className="border-b border-border bg-surface-raised px-3 py-1.5">
                <span className="font-mono text-xs font-semibold uppercase tracking-[0.08em] text-muted">
                  Superseria {pos}
                </span>
              </div>
              <div className="space-y-3 p-3">{cards}</div>
            </div>
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

      {!inProgress ? (
        <Card title="Data treningu" meta="Popraw, gdy klient zapomniał odhaczyć we właściwym dniu.">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="min-w-0 flex-1">
              <Field label="Data">
                <input
                  type="date"
                  className={inputClass}
                  value={performedOn}
                  onChange={(e) => setPerformedOn(e.target.value)}
                />
              </Field>
            </div>
            <Button
              variant="secondary"
              disabled={savingDate || !dateDirty || !performedOn}
              loading={savingDate}
              onClick={() => void saveDate()}
            >
              Zapisz datę
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
    <div className="rounded-[var(--r-card)] border border-border bg-surface px-4 py-4">
      <p
        className={`font-mono text-3xl font-semibold tabular-nums ${
          highlight ? "text-pr" : "text-foreground"
        }`}
      >
        {highlight ? `★ ${value}` : value}
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
