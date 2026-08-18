"use client";

import { ReactNode } from "react";

export function SupersetGroup({
  letter,
  onUnlink,
  children,
}: {
  letter: string;
  count: number;
  onUnlink: () => void;
  children: ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-[10px] border border-border-strong">
      <div className="flex items-baseline justify-between gap-2 border-b border-border bg-surface-raised px-3 py-1.5">
        <span className="min-w-0 truncate font-mono text-xs font-semibold uppercase tracking-[0.08em] text-muted">
          Superseria {letter}
        </span>
        <button
          type="button"
          onClick={onUnlink}
          className="shrink-0 text-xs font-medium text-muted hover:text-foreground"
        >
          Rozłącz
        </button>
      </div>
      <div className="divide-y divide-border">{children}</div>
    </div>
  );
}
