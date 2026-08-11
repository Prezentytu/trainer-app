"use client";

import Link from "next/link";
import { Exercise } from "@/lib/api";
import { Icon } from "@/components/Icon";
import { SidePanel } from "@/components/SidePanel";
import { IconButton, OverflowMenu, OverflowMenuItem } from "@/components/ui";
import { ExerciseEditor } from "./ExerciseEditor";
import { cardLine } from "./summaryText";
import { BuilderItem, BuilderSet } from "./types";

export function ItemPanel({
  item,
  dayItems,
  weekNumber,
  exercise,
  open,
  panelId,
  onClose,
  onSelectItem,
  onPatch,
  onAddSet,
  onPatchSet,
  onRemoveSet,
  onApplyPreset,
  onClearSets,
  onDuplicate,
  onRemove,
}: {
  item: BuilderItem | null;
  /** Pozycje dnia — do nawigacji ←/→. */
  dayItems: BuilderItem[];
  weekNumber: number;
  exercise?: Exercise;
  open: boolean;
  panelId: string;
  onClose: () => void;
  onSelectItem: (itemKey: string) => void;
  onPatch: (patch: Partial<BuilderItem>) => void;
  onAddSet: () => void;
  onPatchSet: (setKey: string, patch: Partial<BuilderSet>) => void;
  onRemoveSet: (setKey: string) => void;
  onApplyPreset: (presetId: string) => void;
  onClearSets: () => void;
  onDuplicate: () => void;
  onRemove: () => void;
}) {
  if (!open || !item) return null;

  const idx = dayItems.findIndex((i) => i.key === item.key);
  const prev = idx > 0 ? dayItems[idx - 1] : null;
  const next = idx >= 0 && idx < dayItems.length - 1 ? dayItems[idx + 1] : null;
  const line = cardLine(item, exercise);

  return (
    <SidePanel
      open={open}
      panelId={panelId}
      title={item.exerciseName}
      subtitle={line}
      onClose={onClose}
      headerRight={
        <>
          <IconButton
            title="Poprzednie ćwiczenie"
            size="sm"
            disabled={!prev}
            onClick={() => prev && onSelectItem(prev.key)}
          >
            <Icon name="caret-left" size={16} decorative />
          </IconButton>
          <IconButton
            title="Następne ćwiczenie"
            size="sm"
            disabled={!next}
            onClick={() => next && onSelectItem(next.key)}
          >
            <Icon name="caret-right" size={16} decorative />
          </IconButton>
          <OverflowMenu label="Akcje pozycji" align="right">
            {({ close }) => (
              <>
                <OverflowMenuItem
                  onClick={() => {
                    onDuplicate();
                    close();
                  }}
                >
                  Duplikuj
                </OverflowMenuItem>
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
        </>
      }
    >
      <ExerciseEditor
        item={item}
        weekNumber={weekNumber}
        exercise={exercise}
        onPatch={onPatch}
        onAddSet={onAddSet}
        onPatchSet={onPatchSet}
        onRemoveSet={onRemoveSet}
        onApplyPreset={onApplyPreset}
        onClearSets={onClearSets}
      />

      <div className="mt-6">
        <Link
          href={`/exercises/${item.exerciseId}`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground underline underline-offset-2 hover:text-foreground-secondary"
        >
          Otwórz ćwiczenie
          <Icon name="caret-right" size={14} decorative />
        </Link>
      </div>
    </SidePanel>
  );
}
