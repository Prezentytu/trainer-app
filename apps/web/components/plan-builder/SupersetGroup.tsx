"use client";

import { ReactNode } from "react";

export function SupersetGroup({
  letter,
  count,
  onUnlink,
  children,
}: {
  letter: string;
  count: number;
  onUnlink: () => void;
  children: ReactNode;
}) {
  const chain =
    count === 2
      ? `${letter}1→${letter}2 bez przerwy`
      : Array.from({ length: count }, (_, i) => `${letter}${i + 1}`).join("→");

  return (
    <div className="rounded-xl border border-accent-border bg-accent-dim p-2">
      <div className="mb-2 flex items-center justify-between gap-2 px-1">
        <div className="flex flex-wrap items-baseline gap-2">
          <span className="font-mono text-xs font-semibold uppercase tracking-[0.08em] text-accent-strong">
            Superseria {letter}
          </span>
          <span className="text-xs text-muted-faint">{chain}</span>
        </div>
        <button
          type="button"
          onClick={onUnlink}
          className="text-xs font-medium text-muted hover:text-foreground-secondary"
        >
          Rozłącz
        </button>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}
