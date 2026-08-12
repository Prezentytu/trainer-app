"use client";

import { useRef } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Exercise } from "@/lib/api";
import { OverflowMenu, OverflowMenuItem } from "@/components/ui";
import { cardLine } from "./summaryText";
import { BuilderItem } from "./types";

const DRAG_CLICK_THRESHOLD = 4;

export function ExerciseCard({
  item,
  exercise,
  badge,
  nested,
  selected,
  active,
  showCheckbox,
  panelId,
  onSelect,
  onToggleSelect,
  onMove,
  onRemove,
  onDuplicate,
  onToggleWarmup,
}: {
  item: BuilderItem;
  exercise?: Exercise;
  badge?: string | null;
  nested?: boolean;
  selected?: boolean;
  /** Otwarty w panelu bocznym. */
  active?: boolean;
  showCheckbox?: boolean;
  panelId: string;
  onSelect: () => void;
  onToggleSelect?: () => void;
  onMove: (dir: -1 | 1) => void;
  onRemove: () => void;
  onDuplicate: () => void;
  onToggleWarmup: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.key,
  });
  const pointerStart = useRef<{ x: number; y: number } | null>(null);

  const line = cardLine(item, exercise);
  const highlighted = active || selected;

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={[
        "group relative min-w-0 touch-none transition-[background-color,border-color,opacity,transform] duration-[var(--dur-fast)]",
        nested
          ? highlighted
            ? "bg-surface-active"
            : "bg-transparent hover:bg-surface-hover"
          : highlighted
            ? "rounded-[10px] border border-border-strong bg-surface-active"
            : "rounded-[10px] border border-border bg-surface hover:border-border-strong hover:bg-surface-hover",
        isDragging ? "opacity-40" : "",
      ].join(" ")}
      {...attributes}
      {...listeners}
      onPointerDown={(e) => {
        pointerStart.current = { x: e.clientX, y: e.clientY };
        listeners?.onPointerDown?.(e);
      }}
    >
      <div className="flex min-h-[var(--tap-min)] items-start gap-2 px-3 py-2.5">
        {showCheckbox && onToggleSelect ? (
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onToggleSelect();
            }}
            aria-label={selected ? "Odznacz" : "Zaznacz"}
            className={`mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-md border text-xs ${
              selected
                ? "border-invert-bg bg-invert-bg text-invert-fg"
                : "border-border-strong bg-surface-sunken"
            }`}
          >
            {selected ? "✓" : ""}
          </button>
        ) : null}

        <button
          type="button"
          onClick={(e) => {
            const start = pointerStart.current;
            if (start) {
              const dx = Math.abs(e.clientX - start.x);
              const dy = Math.abs(e.clientY - start.y);
              if (dx > DRAG_CLICK_THRESHOLD || dy > DRAG_CLICK_THRESHOLD) return;
            }
            onSelect();
          }}
          aria-expanded={active}
          aria-controls={panelId}
          className="min-w-0 flex-1 text-left focus-visible:outline-none focus-visible:[box-shadow:var(--focus-ring)] active:scale-[0.98]"
        >
          <div className="flex min-w-0 items-baseline gap-x-2 pr-7">
            {badge ? (
              <span className="shrink-0 font-mono text-xs font-semibold uppercase tracking-[0.08em] text-muted-faint">
                {badge}
              </span>
            ) : null}
            <span className="min-w-0 break-words text-[15px] font-medium text-foreground">
              {item.exerciseName}
            </span>
            {item.notes ? (
              <span
                title={item.notes}
                className="h-1.5 w-1.5 shrink-0 rounded-full bg-muted"
                aria-label="Notatka dla klienta"
              />
            ) : null}
            {item.isWarmup ? (
              <span className="shrink-0 font-mono text-xs uppercase tracking-[0.08em] text-muted-faint">
                rozg.
              </span>
            ) : null}
          </div>
          <p
            title={line}
            className="mt-1 min-w-0 truncate font-mono text-[12px] tabular-nums text-foreground-secondary"
          >
            {line}
          </p>
        </button>
      </div>

      <div
        className="absolute right-1 top-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
        onPointerDown={(e) => e.stopPropagation()}
      >
        <OverflowMenu label="Akcje ćwiczenia" align="right">
          {({ close }) => (
            <>
              <OverflowMenuItem
                onClick={() => {
                  onMove(-1);
                  close();
                }}
              >
                Wyżej
              </OverflowMenuItem>
              <OverflowMenuItem
                onClick={() => {
                  onMove(1);
                  close();
                }}
              >
                Niżej
              </OverflowMenuItem>
              <OverflowMenuItem
                onClick={() => {
                  onDuplicate();
                  close();
                }}
              >
                Duplikuj
              </OverflowMenuItem>
              <OverflowMenuItem
                onClick={() => {
                  onToggleWarmup();
                  close();
                }}
              >
                {item.isWarmup ? "Usuń rozgrzewkę" : "Rozgrzewka"}
              </OverflowMenuItem>
              {onToggleSelect ? (
                <OverflowMenuItem
                  onClick={() => {
                    onToggleSelect();
                    close();
                  }}
                >
                  {selected ? "Odznacz" : "Zaznacz do superserii"}
                </OverflowMenuItem>
              ) : null}
              <OverflowMenuItem
                danger
                onClick={() => {
                  onRemove();
                  close();
                }}
              >
                Usuń
              </OverflowMenuItem>
            </>
          )}
        </OverflowMenu>
      </div>
    </div>
  );
}
