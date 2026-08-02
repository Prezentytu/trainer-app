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
  const pct = `${Math.round(progress * 100)}%`;

  if (!rest.expanded) {
    return (
      <div className="fixed inset-x-3 bottom-3 z-50 rounded-2xl border border-border-strong bg-surface-raised p-3.5 shadow-[var(--shadow-raised)] sm:inset-x-auto sm:left-1/2 sm:w-full sm:max-w-lg sm:-translate-x-1/2">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            className="min-w-0 flex-1 text-left focus-visible:outline-none focus-visible:shadow-[var(--glow-accent)]"
            onClick={() => onExpand(true)}
            aria-label="Powiększ timer przerwy"
          >
            <p className="text-xs font-semibold uppercase tracking-caps text-muted">Odpoczynek</p>
            <p className="mt-0.5 font-mono text-3xl font-semibold tabular-nums text-foreground">
              {formatRest(rest.leftSeconds)}
            </p>
            {nextLabel ? (
              <p className="mt-0.5 truncate text-[13px] text-muted">Dalej: {nextLabel}</p>
            ) : null}
          </button>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              className="inline-flex min-h-11 min-w-[52px] items-center justify-center rounded-[10px] border border-border-strong font-mono text-[13px] tabular-nums text-foreground-secondary hover:bg-surface-hover focus-visible:outline-none focus-visible:shadow-[var(--glow-accent)] active:scale-[0.96]"
              onClick={() => onAdjust(-15)}
            >
              −15
            </button>
            <button
              type="button"
              className="inline-flex min-h-11 min-w-[52px] items-center justify-center rounded-[10px] border border-border-strong font-mono text-[13px] tabular-nums text-foreground-secondary hover:bg-surface-hover focus-visible:outline-none focus-visible:shadow-[var(--glow-accent)] active:scale-[0.96]"
              onClick={() => onAdjust(15)}
            >
              +15
            </button>
            <button
              type="button"
              className="inline-flex min-h-11 min-w-16 items-center justify-center rounded-[10px] bg-accent px-3 text-[15px] font-semibold text-accent-foreground hover:bg-accent-strong focus-visible:outline-none focus-visible:shadow-[var(--glow-accent)] active:scale-[0.96]"
              onClick={onDismiss}
            >
              Pomiń
            </button>
          </div>
        </div>
        <div className="mt-3 h-1 overflow-hidden rounded-full bg-surface-active">
          <div
            className="h-full rounded-full bg-accent transition-[width] duration-1000 ease-linear"
            style={{ width: pct }}
          />
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
          className="inline-flex h-11 w-11 items-center justify-center rounded-[10px] text-xl text-muted-strong hover:bg-surface-hover hover:text-foreground focus-visible:outline-none focus-visible:shadow-[var(--glow-accent)]"
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
