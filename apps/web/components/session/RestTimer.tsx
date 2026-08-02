"use client";

import { Button, ProgressRing, formatRest } from "@/components/ui";
import type { RestTimerState } from "@/components/session/useRestTimer";

type Props = {
  rest: RestTimerState;
  nextLabel?: string | null;
  onAdjust: (deltaSeconds: number) => void;
  onDismiss: () => void;
  onExpand: (expanded: boolean) => void;
};

function mmss(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function RestTimer({ rest, nextLabel, onAdjust, onDismiss, onExpand }: Props) {
  const progress =
    rest.totalSeconds > 0 ? Math.min(1, rest.leftSeconds / rest.totalSeconds) : 0;

  if (!rest.expanded) {
    return (
      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-accent-border bg-accent-dim px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-3">
          <button
            type="button"
            className="min-w-0 flex-1 text-left focus-visible:outline-none focus-visible:shadow-[var(--glow-accent)]"
            onClick={() => onExpand(true)}
            aria-label="Powiększ timer przerwy"
          >
            <p className="font-mono text-2xl font-semibold tabular-nums text-accent-strong">
              Przerwa {formatRest(rest.leftSeconds)}
            </p>
            {nextLabel ? (
              <p className="mt-0.5 truncate text-xs text-muted">Dalej: {nextLabel}</p>
            ) : null}
          </button>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              className="min-h-11 rounded-md px-3 text-sm font-semibold text-accent-strong hover:text-accent focus-visible:outline-none focus-visible:shadow-[var(--glow-accent)]"
              onClick={() => onAdjust(30)}
            >
              +30 s
            </button>
            <button
              type="button"
              className="min-h-11 rounded-md px-3 text-xs font-semibold uppercase tracking-[0.08em] text-muted-strong hover:text-foreground focus-visible:outline-none focus-visible:shadow-[var(--glow-accent)]"
              onClick={onDismiss}
            >
              Pomiń
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-background px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))]">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-caps text-muted">Przerwa</p>
        <button
          type="button"
          className="inline-flex h-11 w-11 items-center justify-center rounded-md text-xl text-muted-strong hover:bg-surface-hover hover:text-foreground focus-visible:outline-none focus-visible:shadow-[var(--glow-accent)]"
          onClick={() => onExpand(false)}
          aria-label="Zwiń timer — pokaż ćwiczenia"
        >
          ×
        </button>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-6">
        <ProgressRing
          value={progress}
          size={200}
          stroke={10}
          label={mmss(rest.leftSeconds)}
          sub="pozostało"
        />
        {nextLabel ? (
          <p className="max-w-[28ch] text-center text-sm text-muted">
            Dalej: <span className="font-medium text-accent-strong">{nextLabel}</span>
          </p>
        ) : null}
      </div>

      <div className="mx-auto grid w-full max-w-sm grid-cols-3 gap-2">
        <Button variant="secondary" onClick={() => onAdjust(-15)}>
          −15 s
        </Button>
        <Button variant="secondary" onClick={() => onAdjust(30)}>
          +30 s
        </Button>
        <Button variant="ghost" onClick={onDismiss}>
          Pomiń
        </Button>
      </div>
    </div>
  );
}
