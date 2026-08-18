"use client";

import { PlanItem } from "@/lib/api";
import { ExerciseName } from "@/components/ExerciseName";
import { schemeParts } from "./summary";

export function PlanItemCard({
  item,
  label,
  selected,
  panelId,
  onSelect,
  nested = false,
}: {
  item: PlanItem;
  label: string | null;
  selected: boolean;
  panelId: string;
  onSelect: () => void;
  /** Wewnątrz klamry superserii — bez własnej ramki, separacja przez divide-y rodzica. */
  nested?: boolean;
}) {
  const { primary, meta } = schemeParts(item);

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-expanded={selected}
      aria-controls={panelId}
      className={[
        "w-full min-h-[var(--tap-min)] min-w-0 px-3 py-2.5 text-left transition-[background-color,border-color,transform] duration-[var(--dur-fast)] active:scale-[0.98]",
        "focus-visible:outline-none focus-visible:[box-shadow:var(--focus-ring)]",
        nested
          ? selected
            ? "bg-surface-active"
            : "bg-transparent hover:bg-surface-hover"
          : selected
            ? "rounded-[10px] border border-border-strong bg-surface-active"
            : "rounded-[10px] border border-border bg-surface hover:border-border-strong hover:bg-surface-hover",
      ].join(" ")}
    >
      <div className="flex min-w-0 items-baseline gap-x-2">
        {label ? (
          <span className="shrink-0 font-mono text-xs font-semibold uppercase tracking-[0.08em] text-muted-faint">
            {label}
          </span>
        ) : null}
        <span className="min-w-0 text-[15px] font-medium text-foreground">
          <ExerciseName name={item.exerciseName} />
        </span>
      </div>
      <p className="mt-1 min-w-0 break-words font-mono text-[12px] tabular-nums">
        <span className="font-semibold text-foreground-secondary">{primary}</span>
        {meta ? <span className="text-muted-faint"> · {meta}</span> : null}
      </p>
    </button>
  );
}
