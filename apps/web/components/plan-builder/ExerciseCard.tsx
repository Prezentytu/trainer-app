"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Exercise } from "@/lib/api";
import { IconButton } from "@/components/ui";
import { ExerciseEditor } from "./ExerciseEditor";
import { schemeParts } from "./summaryText";
import { BuilderItem, BuilderSet } from "./types";

export function ExerciseCard({
  item,
  weekNumber,
  exercise,
  badge,
  nested,
  expanded,
  selected,
  showCheckbox,
  onToggleExpand,
  onToggleSelect,
  onMove,
  onRemove,
  onPatch,
  onAddSet,
  onPatchSet,
  onRemoveSet,
  onApplyPreset,
  onClearSets,
}: {
  item: BuilderItem;
  weekNumber: number;
  exercise?: Exercise;
  badge?: string | null;
  nested?: boolean;
  expanded: boolean;
  selected?: boolean;
  showCheckbox?: boolean;
  onToggleExpand: () => void;
  onToggleSelect?: () => void;
  onMove: (dir: -1 | 1) => void;
  onRemove: () => void;
  onPatch: (patch: Partial<BuilderItem>) => void;
  onAddSet: () => void;
  onPatchSet: (setKey: string, patch: Partial<BuilderSet>) => void;
  onRemoveSet: (setKey: string) => void;
  onApplyPreset: (presetId: string) => void;
  onClearSets: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.key,
  });

  if (expanded) {
    return (
      <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }}>
        <ExerciseEditor
          item={item}
          weekNumber={weekNumber}
          exercise={exercise}
          dragHandleProps={{ ...attributes, ...listeners }}
          onCollapse={onToggleExpand}
          onPatch={onPatch}
          onAddSet={onAddSet}
          onPatchSet={onPatchSet}
          onRemoveSet={onRemoveSet}
          onApplyPreset={onApplyPreset}
          onClearSets={onClearSets}
        />
      </div>
    );
  }

  const { primary, meta } = schemeParts(item, exercise);

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={[
        "group min-w-0 transition-[background-color,border-color,opacity] duration-[var(--dur-fast)]",
        nested
          ? selected
            ? "bg-surface-active"
            : "bg-transparent hover:bg-surface-hover"
          : selected
            ? "rounded-[10px] border border-border-strong bg-surface-active"
            : "rounded-[10px] border border-border bg-surface hover:border-border-strong hover:bg-surface-hover",
        isDragging ? "opacity-40" : "",
      ].join(" ")}
    >
      <div className="flex min-h-[var(--tap-min)] items-start gap-1.5 px-3 py-2.5">
        {onToggleSelect ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleSelect();
            }}
            aria-label={selected ? "Odznacz" : "Zaznacz"}
            className={`mt-1 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-md border text-[10px] transition-opacity ${
              selected
                ? "border-invert-bg bg-invert-bg text-invert-fg opacity-100"
                : showCheckbox
                  ? "border-border-strong bg-surface-sunken opacity-100"
                  : "border-border-strong bg-surface-sunken opacity-0 group-hover:opacity-100"
            }`}
          >
            {selected ? "✓" : ""}
          </button>
        ) : null}
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label="Przeciągnij"
          className="mt-1 shrink-0 cursor-grab touch-none text-muted-faint opacity-0 transition-opacity group-hover:opacity-100 active:cursor-grabbing"
        >
          ⠿
        </button>
        <button type="button" onClick={onToggleExpand} className="min-w-0 flex-1 text-left">
          <div className="flex min-w-0 items-baseline gap-x-2">
            {badge ? (
              <span className="shrink-0 font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-faint">
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
          </div>
          <p className="mt-1 min-w-0 break-words font-mono text-[12px] tabular-nums">
            <span className="font-semibold text-foreground-secondary">{primary}</span>
            {meta ? <span className="text-muted-faint"> · {meta}</span> : null}
          </p>
        </button>
        <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
          <IconButton title="Przenieś wyżej" onClick={() => onMove(-1)} size="xs">
            ↑
          </IconButton>
          <IconButton title="Przenieś niżej" onClick={() => onMove(1)} size="xs">
            ↓
          </IconButton>
          <IconButton title="Usuń" variant="danger" onClick={onRemove} size="xs">
            ✕
          </IconButton>
        </div>
      </div>
    </div>
  );
}
