"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Exercise } from "@/lib/api";
import { ExerciseThumb } from "@/components/ExerciseThumb";
import { demoMedia } from "@/lib/youtube";
import { ListEntryEditor, type EditorPartner } from "./ListEntryEditor";
import { ExerciseName } from "@/components/ExerciseName";
import { listEntrySummary } from "./listGroups";
import { BuilderItem, BuilderSet } from "./types";

export function ListEntryCard({
  item,
  label,
  multi,
  isWarmup,
  expanded,
  weekNumber,
  exercise,
  superLabel,
  partners,
  lastPrescriptionLabel,
  onUndoLastPrescription,
  onToggleExpand,
  onPatch,
  onToggleWarmup,
  onMakeSuper,
  onUnlink,
  onMove,
  onSwap,
  onDuplicate,
  onRemove,
  onAddSet,
  onInsertSet,
  onPatchSet,
  onRemoveSet,
  onApplyPreset,
  onApplyRestToAll,
  onClearSets,
}: {
  item: BuilderItem;
  label: string;
  multi: boolean;
  isWarmup: boolean;
  expanded: boolean;
  weekNumber: number;
  exercise?: Exercise;
  superLabel: string;
  partners?: EditorPartner[];
  lastPrescriptionLabel?: string | null;
  onUndoLastPrescription?: () => void;
  onToggleExpand: () => void;
  onPatch: (patch: Partial<BuilderItem>) => void;
  onToggleWarmup: () => void;
  onMakeSuper: () => void;
  onUnlink?: () => void;
  onMove?: (dir: -1 | 1) => void;
  onSwap?: () => void;
  onDuplicate?: () => void;
  onRemove: () => void;
  onAddSet: () => void;
  onInsertSet?: (index: number, side: "before" | "after") => string | void;
  onPatchSet: (setKey: string, patch: Partial<BuilderSet>) => void;
  onRemoveSet: (setKey: string) => void;
  onApplyPreset: (presetId: string) => void;
  onApplyRestToAll?: (seconds: number | null) => void;
  onClearSets: () => void;
}) {
  const summary = listEntrySummary(item, exercise, multi);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.key,
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex flex-col gap-2 ${isDragging ? "opacity-50" : ""}`}
    >
      <button
        type="button"
        onClick={onToggleExpand}
        className={`w-full rounded-xl border px-3.5 py-3 text-left transition-colors ${
          expanded
            ? "border-border-strong bg-surface-hover"
            : "border-border bg-surface hover:border-border-strong hover:bg-surface-hover"
        }`}
      >
        <div className="flex items-center gap-2.5">
          <span
            {...attributes}
            {...listeners}
            role="button"
            tabIndex={0}
            aria-label="Przeciągnij, aby zmienić kolejność albo przenieść do innego dnia"
            title="Przeciągnij, aby zmienić kolejność"
            onClick={(e) => e.stopPropagation()}
            className="-ml-1 shrink-0 cursor-grab touch-none px-1 text-muted-faint transition-colors hover:text-foreground-secondary active:cursor-grabbing"
          >
            ⋮⋮
          </span>
          <span
            className={`inline-flex h-[26px] w-8 shrink-0 items-center justify-center rounded-lg font-mono text-xs font-semibold tabular-nums ${
              multi
                ? "border border-accent-border bg-accent-dim text-accent-strong"
                : isWarmup
                  ? "border border-transparent bg-surface-sunken text-muted"
                  : "border border-transparent bg-surface-active text-muted"
            }`}
          >
            {label}
          </span>
          <div className="h-10 w-10 shrink-0">
            <ExerciseThumb
              variant="square"
              youtubeId={demoMedia(exercise).youtubeId}
              category={exercise?.category}
              alt={item.exerciseName}
            />
          </div>
          <span className="min-w-0 flex-1 text-sm font-semibold leading-snug text-foreground">
            <ExerciseName name={item.exerciseName} />
          </span>
          {item.isWarmup ? (
            <span className="shrink-0 rounded-full bg-surface-active px-2 py-0.5 text-xs text-muted">
              rozgrzewka
            </span>
          ) : null}
          <span
            role="button"
            tabIndex={0}
            title="Usuń"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                e.stopPropagation();
                onRemove();
              }
            }}
            className="shrink-0 px-1 text-base leading-none text-muted-faint hover:text-danger-hover"
          >
            ×
          </span>
        </div>
        <div className="mt-1.5 flex flex-wrap items-center gap-2 pl-[5.25rem] font-mono text-xs tabular-nums text-muted">
          <span className="font-semibold text-foreground">{summary.split(" · ")[0]}</span>
          {summary.includes(" · ") ? (
            <>
              <span>·</span>
              <span className="text-foreground-secondary">{summary.split(" · ").slice(1).join(" · ")}</span>
            </>
          ) : null}
        </div>
      </button>

      {expanded && (
        <ListEntryEditor
          item={item}
          weekNumber={weekNumber}
          exercise={exercise}
          superLabel={superLabel}
          inSuperset={multi}
          partners={partners}
          lastPrescriptionLabel={lastPrescriptionLabel}
          onUndoLastPrescription={onUndoLastPrescription}
          onCollapse={onToggleExpand}
          onPatch={onPatch}
          onToggleWarmup={onToggleWarmup}
          onMakeSuper={onMakeSuper}
          onUnlink={onUnlink}
          onMove={onMove}
          onSwap={onSwap}
          onDuplicate={onDuplicate}
          onRemove={onRemove}
          onAddSet={onAddSet}
          onInsertSet={onInsertSet}
          onApplyRestToAll={onApplyRestToAll}
          onPatchSet={onPatchSet}
          onRemoveSet={onRemoveSet}
          onApplyPreset={onApplyPreset}
          onClearSets={onClearSets}
        />
      )}
    </div>
  );
}
