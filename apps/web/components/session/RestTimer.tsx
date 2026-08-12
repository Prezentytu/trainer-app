"use client";

import { Button } from "@/components/ui";
import type { RestTimerState } from "@/components/session/useRestTimer";

type Props = {
  rest: RestTimerState;
  /** Nazwa ćwiczenia, które robi się po przerwie. */
  nextExerciseName?: string | null;
  /** Numer następnej serii w tym ćwiczeniu (1-based). */
  nextSetNumber?: number | null;
  /** Ile serii ma to ćwiczenie. */
  nextSetsInExercise?: number | null;
  onAdjust: (deltaSeconds: number) => void;
  onDismiss: () => void;
  onExpand: (expanded: boolean) => void;
};

function mmss(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/** Cienki pierścień + hero typografia — mono epic, nie chunky ProgressRing. */
function RestRing({
  progress,
  label,
}: {
  progress: number;
  label: string;
}) {
  const size = 280;
  const stroke = 2.5;
  const cx = size / 2;
  const cy = size / 2;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  // progress = pozostały czas (1 → 0). Luka rośnie od 12:00 zgodnie z zegarem.
  const remaining = Math.max(0, Math.min(1, progress));
  const elapsed = 1 - remaining;

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
      aria-hidden
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="var(--line-faint)"
          strokeWidth={stroke}
        />
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="var(--fg)"
          strokeWidth={stroke}
          strokeLinecap="round"
          // Start ścieżki na 12:00, rysowanie zgodnie z zegarem
          transform={`rotate(-90 ${cx} ${cy})`}
          strokeDasharray={`${remaining * c} ${c}`}
          strokeDashoffset={-elapsed * c}
          className="transition-[stroke-dasharray,stroke-dashoffset] duration-1000 ease-linear"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono text-[64px] font-semibold leading-none tracking-tight tabular-nums text-foreground">
          {label}
        </span>
      </div>
    </div>
  );
}

/** Pełnoekranowy timer przerwy — mini-widok żyje w SessionDock. */
export function RestTimer({
  rest,
  nextExerciseName,
  nextSetNumber,
  nextSetsInExercise,
  onAdjust,
  onDismiss,
  onExpand,
}: Props) {
  const progress =
    rest.totalSeconds > 0 ? Math.min(1, rest.leftSeconds / rest.totalSeconds) : 0;
  const hasNext =
    Boolean(nextExerciseName) &&
    nextSetNumber != null &&
    nextSetsInExercise != null &&
    nextSetsInExercise > 0;

  if (!rest.expanded) return null;

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-background px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] isolate">
      <div className="flex items-center justify-between">
        <p className="font-mono text-xs font-medium uppercase tracking-caps text-muted">
          Przerwa
        </p>
        <button
          type="button"
          className="inline-flex h-11 items-center justify-center rounded-[10px] px-3 text-[13px] font-semibold text-muted-strong transition-[background-color,color,transform] duration-[var(--dur-fast)] ease-[var(--ease-out)] hover:bg-surface-hover hover:text-foreground focus-visible:outline-none focus-visible:shadow-[var(--focus-ring)] active:scale-[0.98]"
          onClick={() => onExpand(false)}
          aria-label="Zminimalizuj timer — pokaż ćwiczenia"
        >
          Zwiń
        </button>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-8">
        <RestRing progress={progress} label={mmss(rest.leftSeconds)} />
        {hasNext ? (
          <div className="flex max-w-[32ch] flex-col items-center gap-1.5 px-4 text-center">
            <p className="font-mono text-xs font-medium uppercase tracking-caps text-muted">
              Następna seria
            </p>
            <p className="break-words text-[17px] font-semibold leading-snug tracking-tight text-foreground">
              {nextExerciseName}
            </p>
            <p className="font-mono text-sm tabular-nums text-muted">
              Seria {nextSetNumber} z {nextSetsInExercise}
            </p>
          </div>
        ) : null}
      </div>

      <div className="mx-auto grid w-full max-w-sm grid-cols-3 gap-2">
        <Button variant="secondary" onClick={() => onAdjust(-15)}>
          −15 s
        </Button>
        <Button variant="secondary" onClick={() => onAdjust(15)}>
          +15 s
        </Button>
        <Button variant="ghost" onClick={onDismiss}>
          Pomiń
        </Button>
      </div>
    </div>
  );
}
