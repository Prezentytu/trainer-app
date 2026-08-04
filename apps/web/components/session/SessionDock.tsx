"use client";

import type { ReactNode } from "react";
import { useKeyboardInset } from "@/components/session/useKeyboardInset";
import type { RestTimerState } from "@/components/session/useRestTimer";

type ActiveField = "weight" | "reps";

type Props = {
  /** Fokus na komórce kg/powt. — pokazuje pasek narzędzi. */
  activeField: ActiveField | null;
  isTime?: boolean;
  onStepWeight: (delta: number) => void;
  onStepReps: (delta: number) => void;
  onPlates: () => void;
  onPrev: () => void;
  onNext: () => void;
  onDone: () => void;
  /** Mini rest — gdy aktywny i nie fullscreen. */
  rest: RestTimerState | null;
  nextLabel?: string | null;
  onAdjustRest: (delta: number) => void;
  onDismissRest: () => void;
  onExpandRest: () => void;
};

function mmss(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function DockBtn({
  children,
  onClick,
  primary,
  mono,
  title,
}: {
  children: ReactNode;
  onClick: () => void;
  primary?: boolean;
  mono?: boolean;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      className={`inline-flex h-11 min-w-11 items-center justify-center rounded-[10px] px-2.5 text-[13px] font-semibold focus-visible:outline-none focus-visible:shadow-[var(--glow-accent)] active:scale-[0.96] ${
        primary
          ? "bg-accent text-accent-foreground"
          : "border border-border-strong bg-surface text-foreground-secondary hover:border-accent-border hover:text-accent-strong"
      } ${mono ? "font-mono tabular-nums" : ""}`}
    >
      {children}
    </button>
  );
}

/**
 * Przyklejony dok nad klawiaturą: [mini rest] + [pasek narzędzi zależny od pola].
 * Zastępuje wstawkę w przepływie dokumentu, która rozpychała wiersze serii.
 */
export function SessionDock({
  activeField,
  isTime = false,
  onStepWeight,
  onStepReps,
  onPlates,
  onPrev,
  onNext,
  onDone,
  rest,
  nextLabel,
  onAdjustRest,
  onDismissRest,
  onExpandRest,
}: Props) {
  const inset = useKeyboardInset();
  const showTools = activeField != null;
  const showRest = rest != null && !rest.expanded;

  if (!showTools && !showRest) return null;

  const progress =
    rest && rest.totalSeconds > 0
      ? Math.min(1, rest.leftSeconds / rest.totalSeconds)
      : 0;

  return (
    <div
      className="fixed inset-x-0 z-50 border-t border-border bg-background/95 px-3 pt-2 backdrop-blur-md"
      style={{
        bottom: inset,
        paddingBottom: `max(0.75rem, env(safe-area-inset-bottom))`,
      }}
    >
      <div className="mx-auto flex w-full max-w-lg flex-col gap-2">
        {showRest && rest ? (
          <div className="rounded-[10px] border border-dashed border-border-strong bg-surface-raised px-3 py-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="min-w-0 flex-1 text-left focus-visible:outline-none focus-visible:shadow-[var(--glow-accent)]"
                onClick={onExpandRest}
                aria-label="Powiększ timer przerwy"
              >
                <p className="font-mono text-[28px] font-semibold leading-none tabular-nums text-foreground">
                  {mmss(rest.leftSeconds)}
                </p>
                {nextLabel ? (
                  <p className="mt-0.5 truncate text-[12px] text-muted">Dalej: {nextLabel}</p>
                ) : null}
              </button>
              <DockBtn mono onClick={() => onAdjustRest(-15)}>
                −15
              </DockBtn>
              <DockBtn mono onClick={() => onAdjustRest(15)}>
                +15
              </DockBtn>
              <DockBtn primary onClick={onDismissRest}>
                Pomiń
              </DockBtn>
            </div>
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-surface-active">
              <div
                className="h-full rounded-full bg-accent transition-[width] duration-1000 ease-linear"
                style={{ width: `${Math.round(progress * 100)}%` }}
              />
            </div>
          </div>
        ) : null}

        {showTools ? (
          <div className="flex flex-wrap items-center gap-1.5">
            {activeField === "weight" && !isTime ? (
              <>
                <DockBtn mono onClick={() => onStepWeight(-2.5)}>
                  −2,5
                </DockBtn>
                <DockBtn mono onClick={() => onStepWeight(2.5)}>
                  +2,5
                </DockBtn>
                <DockBtn onClick={onPlates}>Talerze</DockBtn>
              </>
            ) : null}
            {activeField === "reps" ? (
              <>
                <DockBtn mono onClick={() => onStepReps(-1)}>
                  −1
                </DockBtn>
                <DockBtn mono onClick={() => onStepReps(1)}>
                  +1
                </DockBtn>
              </>
            ) : null}
            <div className="ml-auto flex items-center gap-1.5">
              <DockBtn onClick={onPrev} title="Poprzednie pole">
                ‹
              </DockBtn>
              <DockBtn onClick={onNext} title="Następne pole">
                ›
              </DockBtn>
              <DockBtn primary onClick={onDone}>
                Gotowe
              </DockBtn>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
