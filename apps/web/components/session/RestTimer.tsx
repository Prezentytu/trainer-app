"use client";

import { Button, ProgressRing } from "@/components/ui";
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

/** Pełnoekranowy timer przerwy — mini-widok żyje w SessionDock. */
export function RestTimer({ rest, nextLabel, onAdjust, onDismiss, onExpand }: Props) {
  const progress =
    rest.totalSeconds > 0 ? Math.min(1, rest.leftSeconds / rest.totalSeconds) : 0;

  if (!rest.expanded) return null;

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-background px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] isolate">
      <div className="flex items-center justify-between">
        <p className="eyebrow">Przerwa</p>
        <button
          type="button"
          className="inline-flex h-11 items-center justify-center rounded-[10px] px-3 text-[13px] font-semibold text-muted-strong hover:bg-surface-hover hover:text-foreground focus-visible:outline-none focus-visible:shadow-[var(--glow-accent)]"
          onClick={() => onExpand(false)}
          aria-label="Zminimalizuj timer — pokaż ćwiczenia"
        >
          Zwiń
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
            Dalej: <span className="font-medium text-foreground">{nextLabel}</span>
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
