"use client";

import { Button } from "@/components/ui";

export function SelectionBar({
  count,
  onLink,
  onClear,
}: {
  count: number;
  onLink: () => void;
  onClear: () => void;
}) {
  if (count === 0) return null;
  return (
    <div className="mb-2 flex items-center justify-between gap-2 rounded-[10px] border border-border-strong bg-surface-sunken px-3 py-2">
      <span className="text-sm text-foreground-secondary">
        Zaznaczono <span className="font-mono font-semibold tabular-nums text-foreground">{count}</span>
      </span>
      <div className="flex items-center gap-2">
        <button type="button" onClick={onClear} className="text-xs text-muted hover:text-foreground-secondary">
          Anuluj
        </button>
        <Button size="sm" onClick={onLink} disabled={count < 2}>
          Połącz w superserię
        </Button>
      </div>
    </div>
  );
}
