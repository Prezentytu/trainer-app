"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Exercise } from "@/lib/api";
import { IconButton } from "@/components/ui";
import { ExerciseEditor } from "./ExerciseEditor";
import { summaryText } from "./summaryText";
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
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.key });

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

  const summary = summaryText(item, exercise);
  const parts = summary.split(" · ");
  const restPart = parts.length > 1 ? parts[parts.length - 1] : null;
  const mainSummary =
    restPart && /^\d/.test(restPart.replace("~", "")) && (restPart.includes("s") || restPart.includes("min"))
      ? parts.slice(0, -1).join(" · ")
      : summary;
  const restLabel =
    restPart && (restPart.includes("s") || restPart.includes("min")) && mainSummary !== summary ? restPart : null;

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`group rounded-[10px] border p-3 transition-colors ${
        nested ? "border-border bg-surface" : "border-border bg-surface"
      } ${selected ? "border-accent-strong bg-surface-hover" : ""} ${isDragging ? "opacity-40" : ""}`}
    >
      <div className="flex items-start gap-2">
        {onToggleSelect && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleSelect();
            }}
            aria-label={selected ? "Odznacz" : "Zaznacz"}
            className={`mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-md border text-[10px] transition-opacity ${
              selected
                ? "border-accent bg-accent text-accent-foreground opacity-100"
                : showCheckbox
                  ? "border-border-strong bg-surface-sunken opacity-100"
                  : "border-border-strong bg-surface-sunken opacity-0 group-hover:opacity-100"
            }`}
          >
            {selected ? "✓" : ""}
          </button>
        )}
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label="Przeciągnij"
          className="mt-0.5 shrink-0 cursor-grab touch-none text-muted-faint opacity-0 transition-opacity group-hover:opacity-100 active:cursor-grabbing"
        >
          ⠿
        </button>
        {badge ? (
          <span className="mt-0.5 inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded font-mono text-xs font-semibold tabular-nums text-accent-strong">
            {badge}
          </span>
        ) : null}
        <button type="button" onClick={onToggleExpand} className="min-w-0 flex-1 text-left">
          <div className="flex items-center gap-2">
            <span className="min-w-0 break-words text-sm font-medium text-foreground">{item.exerciseName}</span>
            {item.isWarmup ? (
              <span className="shrink-0 rounded-full bg-surface-active px-2 py-0.5 text-xs text-muted">
                rozgrzewka
              </span>
            ) : null}
            {item.notes ? (
              <span
                title={item.notes}
                className="h-1.5 w-1.5 shrink-0 rounded-full bg-muted"
                aria-label="Notatka dla klienta"
              />
            ) : null}
          </div>
          <p className={`mt-1 font-mono text-xs tabular-nums text-muted ${badge ? "pl-0" : ""}`}>
            {mainSummary}
            {restLabel ? <span className="text-muted-faint"> · {restLabel}</span> : null}
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
