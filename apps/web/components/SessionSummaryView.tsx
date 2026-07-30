"use client";

import { SessionDetail } from "@/lib/api";
import { ExerciseThumb } from "@/components/ExerciseThumb";
import { Badge, Button, formatRest } from "@/components/ui";
import { formatDurationMinutes } from "@/lib/estimateDuration";
import { demoMedia } from "@/lib/youtube";

function formatDay(iso: string): string {
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("pl-PL", { day: "numeric", month: "short", year: "numeric" });
}

function formatSetLine(s: SessionDetail["exercises"][0]["sets"][0]): string {
  const parts: string[] = [];
  if (s.weightKg != null && s.reps != null) parts.push(`${s.weightKg}×${s.reps}`);
  else if (s.reps != null) parts.push(`${s.reps} powt.`);
  else if (s.durationSeconds != null) parts.push(formatRest(s.durationSeconds));
  else parts.push("—");
  if (s.rir != null) parts.push(`RIR ${s.rir}`);
  else if (s.rpe != null) parts.push(`RPE ${s.rpe}`);
  return parts.join(" · ");
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
  const duration = formatDurationMinutes(session.durationSeconds) ?? formatRest(session.durationSeconds ?? 0);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-surface px-4 py-5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">Podgląd treningu</p>
            <h1 className="mt-1 break-words font-display text-2xl font-bold">
              {session.dayLabel ?? "Trening"}
            </h1>
            <p className="mt-1 font-mono text-sm tabular-nums text-muted">
              {formatDay(session.performedOn)}
              {session.planName ? ` · ${session.planName}` : ""}
            </p>
          </div>
          <Badge tone="positive">Ukończony</Badge>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Stat label="Czas" value={duration} />
        <Stat label="Serie" value={String(session.totalSets)} />
        <Stat label="Tonaż" value={`${Math.round(session.totalVolumeKg)} kg`} />
      </div>

      {session.prs.length > 0 ? (
        <div className="rounded-xl border border-pr/40 bg-pr-dim px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-pr">Rekordy w tej sesji</p>
          <ul className="mt-2 space-y-1">
            {session.prs.map((p) => (
              <li key={`${p.exerciseId}-${p.setNumber}`} className="text-sm">
                <Badge tone="pr">PR</Badge>{" "}
                <span className="break-words font-semibold">{p.exerciseName}</span>{" "}
                <span className="font-mono tabular-nums text-muted">
                  {p.weightKg != null && p.reps != null ? `${p.weightKg}×${p.reps}` : "—"}
                  {p.estimated1Rm != null ? ` · max ${p.estimated1Rm}` : ""}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <ul className="space-y-2">
        {session.exercises.map((ex) => {
          const thumb = demoMedia({ media: ex.media, category: ex.category });
          const doneSets = ex.sets.filter((s) => s.completed);
          return (
            <li key={ex.id} className="rounded-xl border border-border bg-surface px-3 py-3">
              <div className="flex items-start gap-3">
                <div className="h-12 w-12 shrink-0">
                  <ExerciseThumb
                    variant="square"
                    youtubeId={thumb.youtubeId}
                    category={ex.category}
                    alt={ex.exerciseName}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="break-words text-sm font-semibold">{ex.exerciseName}</p>
                  <ul className="mt-1 space-y-0.5">
                    {(doneSets.length > 0 ? doneSets : ex.sets).map((s) => (
                      <li
                        key={s.id || s.setNumber}
                        className="flex flex-wrap items-baseline gap-2 font-mono text-xs tabular-nums text-muted"
                      >
                        <span className="text-muted-faint">{s.setNumber}.</span>
                        <span className={s.isPr ? "text-pr" : ""}>{formatSetLine(s)}</span>
                        {s.isPr ? <span className="font-sans font-semibold text-pr">PR</span> : null}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

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

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface px-3 py-3 text-center">
      <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted">{label}</p>
      <p className="mt-1 font-mono text-base font-semibold tabular-nums">{value}</p>
    </div>
  );
}
