"use client";

import { SessionDetail } from "@/lib/api";
import { formatKg } from "@/lib/plates";
import { formatSetLoadReps } from "@/lib/weight";
import { buildSessionBlocks } from "@/lib/sessionRounds";

type SummarySet = SessionDetail["exercises"][0]["sets"][0];
type SummaryExercise = SessionDetail["exercises"][0];

function isBelowTarget(set: SummarySet, isTime: boolean): boolean {
  if (!set.completed) return false;
  if (isTime) {
    const t = set.targetDurationSeconds;
    return t != null && (set.durationSeconds ?? set.reps ?? 0) < t;
  }
  if (set.targetReps != null && (set.reps ?? 0) < set.targetReps) return true;
  if (set.targetWeightKg != null && (set.weightKg ?? 0) < set.targetWeightKg) return true;
  return false;
}

function formatSetResult(
  set: SummarySet,
  ex: SummaryExercise,
  isTime: boolean,
): string {
  if (!set.completed) return "—";
  if (isTime) {
    const sec = set.durationSeconds ?? set.reps;
    return sec != null ? `${sec} s` : "—";
  }
  if (set.weightKg != null && set.reps != null) {
    return formatSetLoadReps(set.weightKg, set.reps, ex);
  }
  if (set.reps != null) return `${set.reps}`;
  if (set.weightKg != null) return `${formatKg(set.weightKg)} kg`;
  if (set.distanceMeters != null) return `${set.distanceMeters} m`;
  return "—";
}

function formatSetTarget(set: SummarySet, ex: SummaryExercise, isTime: boolean): string | null {
  if (isTime && set.targetDurationSeconds != null) {
    return `${set.targetDurationSeconds} s`;
  }
  if (set.targetWeightKg != null && set.targetReps != null) {
    return formatSetLoadReps(set.targetWeightKg, set.targetReps, ex);
  }
  if (set.targetReps != null) return `${set.targetReps}`;
  if (set.targetWeightKg != null) return `${formatKg(set.targetWeightKg)} kg`;
  return null;
}

function setIndexLabel(set: SummarySet): string {
  if (set.isWarmup) return "W";
  const side = set.side === "left" ? "L" : set.side === "right" ? "P" : null;
  const num = String(set.setNumber);
  return side ? `${num}${side}` : num;
}

export function PerformedExerciseList({
  session,
  heading = true,
}: {
  session: SessionDetail;
  heading?: boolean;
}) {
  const sessionBlocks = buildSessionBlocks(session.exercises);

  return (
    <section aria-label="Ćwiczenia">
      {heading ? (
        <p className="mb-1 font-mono text-xs font-medium uppercase tracking-caps text-muted">
          Ćwiczenia
        </p>
      ) : null}
      <ul className="divide-y divide-border">
        {sessionBlocks.map((block) => {
          const indices = block.kind === "single" ? [block.exIdx] : block.members;
          const pos =
            block.kind === "superset"
              ? session.exercises[block.members[0]]?.supersetLabel?.replace(/[a-z]+$/i, "") ?? ""
              : "";
          return (
            <li key={block.kind === "single" ? `ex-${block.exIdx}` : `ss-${block.group}`}>
              {block.kind === "superset" ? (
                <p className="pt-3 font-mono text-xs font-medium uppercase tracking-caps text-muted">
                  Superseria {pos}
                </p>
              ) : null}
              {indices.map((exIdx) => {
                const ex = session.exercises[exIdx];
                if (!ex) return null;
                const done = ex.sets.filter((s) => s.completed).length;
                const incomplete = done < ex.sets.length;
                const isTime = ex.exerciseType === "time";
                const exerciseNote = ex.note?.trim() || null;
                return (
                  <div key={ex.id} className="py-3.5">
                    <div className="flex min-h-7 items-start justify-between gap-3">
                      <p className="min-w-0 flex-1 break-words text-[15px] font-medium leading-snug text-foreground">
                        {ex.supersetLabel ? `${ex.supersetLabel} ` : ""}
                        {ex.exerciseName}
                      </p>
                      {incomplete ? (
                        <span className="shrink-0 pt-0.5 font-mono text-sm tabular-nums text-muted">
                          {done}/{ex.sets.length}
                        </span>
                      ) : null}
                    </div>
                    {exerciseNote ? (
                      <p className="mt-1 whitespace-pre-wrap text-[13px] leading-snug text-muted">
                        {exerciseNote}
                      </p>
                    ) : null}
                    <ul className="mt-2 space-y-1.5">
                      {ex.sets.map((s) => {
                        const isPr = s.isPr && s.completed;
                        const below = !isPr && isBelowTarget(s, isTime);
                        const result = formatSetResult(s, ex, isTime);
                        const target = below ? formatSetTarget(s, ex, isTime) : null;
                        const setNote = s.note?.trim() || null;
                        return (
                          <li key={s.id}>
                            <div className="flex min-h-7 items-baseline gap-3">
                              <span className="w-8 shrink-0 font-mono text-[13px] tabular-nums text-muted">
                                {setIndexLabel(s)}
                              </span>
                              <span
                                className={`min-w-0 flex-1 font-mono text-[15px] tabular-nums tracking-tight ${
                                  s.completed ? "text-foreground" : "text-muted-faint"
                                }`}
                              >
                                {result}
                                {isPr ? (
                                  <span className="ml-2 font-mono text-xs font-medium tracking-caps text-pr">
                                    ★ PR
                                  </span>
                                ) : null}
                                {target ? (
                                  <span className="ml-2 text-[13px] text-muted-faint">
                                    cel {target}
                                  </span>
                                ) : null}
                              </span>
                            </div>
                            {setNote ? (
                              <p className="ml-11 mt-0.5 whitespace-pre-wrap text-[13px] leading-snug text-muted">
                                {setNote}
                              </p>
                            ) : null}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                );
              })}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
