"use client";

import { SessionDetail } from "@/lib/api";
import { Badge, Button } from "@/components/ui";
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

export function SessionSummaryView({
  session,
  onBack,
  onEdit,
}: {
  session: SessionDetail;
  onBack: () => void;
  onEdit: () => void;
}) {
  const doneTotal = session.exercises.reduce(
    (acc, ex) => {
      const done = ex.sets.filter((s) => s.completed).length;
      return { done: acc.done + done, total: acc.total + ex.sets.length };
    },
    { done: 0, total: 0 },
  );

  return (
    <div className="space-y-4 pb-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-caps text-muted-faint">
          Trening ukończony
        </p>
        <h1 className="mt-1 font-display text-3xl font-bold">
          {session.dayLabel ?? "Trening"}
        </h1>
        <p className="mt-0.5 text-[13px] text-muted">
          {formatDay(session.performedOn)}
          {session.planName ? ` · ${session.planName}` : ""}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Czas" value={formatDurationClock(session.durationSeconds)} />
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

      <div className="rounded-2xl border border-border bg-surface px-4 py-1 shadow-card">
        {session.exercises.map((ex) => {
          const done = ex.sets.filter((s) => s.completed).length;
          const isTime = ex.exerciseType === "time";
          const below = ex.sets.some((s) => isBelowTarget(s, isTime));
          const hasPr =
            ex.sets.some((s) => s.isPr && s.completed) ||
            session.prs.some((p) => p.exerciseId === ex.exerciseId);
          return (
            <div
              key={ex.id}
              className="flex min-h-12 items-center gap-2.5 border-b border-border last:border-0"
            >
              <div className="min-w-0 flex-1 truncate text-[15px] font-semibold text-foreground-secondary">
                {ex.exerciseName}
              </div>
              {hasPr ? <Badge tone="pr">PR</Badge> : null}
              <div
                className={`shrink-0 font-mono text-[13px] tabular-nums ${
                  done < ex.sets.length || below ? "text-muted" : "text-positive"
                }`}
              >
                {done}/{ex.sets.length}
                {below ? " · poniżej celu" : ""}
              </div>
            </div>
          );
        })}
      </div>

      {session.note ? (
        <div className="rounded-2xl border border-border bg-surface px-4 py-3 text-[13px] text-muted shadow-card">
          <p className="text-xs font-semibold uppercase tracking-caps text-muted">
            Wiadomość do trenera
          </p>
          <p className="mt-1.5 text-foreground-secondary">{session.note}</p>
        </div>
      ) : null}

      {session.prs.length > 0 ? (
        <div className="rounded-2xl border border-pr/40 bg-pr-dim px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-caps text-pr">Rekordy w tej sesji</p>
          <ul className="mt-2 space-y-1">
            {session.prs.map((p) => (
              <li key={`${p.exerciseId}-${p.setNumber}`} className="text-sm">
                <Badge tone="pr">PR</Badge>{" "}
                <span className="font-semibold">{p.exerciseName}</span>{" "}
                <span className="font-mono tabular-nums text-muted">
                  {p.weightKg != null && p.reps != null
                    ? `${formatKg(p.weightKg)}×${p.reps}`
                    : "—"}
                  {p.estimated1Rm != null ? ` · max ${p.estimated1Rm}` : ""}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button variant="ghost" full onClick={onBack}>
          Wróć
        </Button>
        <Button variant="secondary" full onClick={onEdit}>
          Popraw wyniki
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
