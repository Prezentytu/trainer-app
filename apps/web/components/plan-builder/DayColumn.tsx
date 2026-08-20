"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Exercise } from "@/lib/api";
import { DayHeader } from "./DayHeader";
import { dayContainerId } from "./dnd";
import { DropIndicator } from "./DropIndicator";
import { ExerciseCard } from "./ExerciseCard";
import { buildItemBlocks } from "./itemBlocks";
import { QuickComposer } from "./QuickComposer";
import { SelectionBar } from "./SelectionBar";
import { SupersetGroup } from "./SupersetGroup";
import { BuilderDay, BuilderItem } from "./types";
import type { DropTarget } from "./useBuilderDnd";

export function DayColumn({
  day,
  dayIndex,
  exercises,
  dropTarget,
  selectedKeys,
  activeItemKey,
  panelId,
  onSelectedKeysChange,
  onSelectItem,
  onOpenDrawer,
  onPatchDay,
  onRemoveDay,
  onDuplicateDay,
  onMoveDayToWeek,
  weeks,
  onApplyWeekdays,
  onAddItem,
  onRemoveItem,
  onMoveItem,
  onDuplicateItem,
  onSwapItem,
  onToggleWarmup,
  onToggleLink,
  onLinkSelected,
  onUnlinkGroup,
}: {
  day: BuilderDay;
  dayIndex: number;
  exercises: Exercise[];
  dropTarget: DropTarget;
  selectedKeys: string[];
  activeItemKey: string | null;
  panelId: string;
  onSelectedKeysChange: (keys: string[]) => void;
  onSelectItem: (itemKey: string) => void;
  onOpenDrawer: () => void;
  onPatchDay: (patch: Partial<BuilderDay>) => void;
  onRemoveDay: () => void;
  onDuplicateDay: (targetWeek?: number) => void;
  onMoveDayToWeek?: (targetWeek: number) => void;
  weeks: number[];
  onApplyWeekdays: () => void;
  onAddItem: (exerciseId: number, overrides?: Partial<BuilderItem>) => void;
  onRemoveItem: (itemKey: string) => void;
  onMoveItem: (itemKey: string, dir: -1 | 1) => void;
  onDuplicateItem: (itemKey: string) => void;
  onSwapItem?: (itemKey: string) => void;
  onToggleWarmup: (itemKey: string) => void;
  onToggleLink: (itemKey: string) => void;
  onLinkSelected: (itemKeys: string[]) => void;
  onUnlinkGroup: (itemKey: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: dayContainerId(day.key) });

  const toggleSelect = (key: string) => {
    const set = new Set(selectedKeys);
    if (set.has(key)) set.delete(key);
    else set.add(key);
    onSelectedKeysChange([...set]);
  };

  const showCheckbox = selectedKeys.length > 0;
  const blocks = buildItemBlocks(day.items);
  const dropHere = dropTarget?.dayKey === day.key ? dropTarget.index : null;

  const renderCard = (idx: number, badge: string | null, nested: boolean) => {
    const item = day.items[idx];
    if (!item) return null;
    const beforeDrop = dropHere === idx;
    return (
      <div key={item.key}>
        {beforeDrop ? (
          <div className={nested ? "px-2 py-1" : "mb-2"}>
            <DropIndicator />
          </div>
        ) : null}
        <ExerciseCard
          item={item}
          exercise={exercises.find((e) => e.id === item.exerciseId)}
          badge={badge}
          nested={nested}
          selected={selectedKeys.includes(item.key)}
          active={activeItemKey === item.key}
          showCheckbox={showCheckbox}
          panelId={panelId}
          onSelect={() => onSelectItem(item.key)}
          onToggleSelect={() => toggleSelect(item.key)}
          onMove={(dir) => onMoveItem(item.key, dir)}
          onRemove={() => onRemoveItem(item.key)}
          onDuplicate={() => onDuplicateItem(item.key)}
          onToggleWarmup={() => onToggleWarmup(item.key)}
          onSwap={onSwapItem ? () => onSwapItem(item.key) : undefined}
        />
      </div>
    );
  };

  return (
    <div
      ref={setNodeRef}
      className={`flex max-h-[70dvh] w-full shrink-0 flex-col rounded-[var(--r-card)] border bg-surface p-0 md:h-full md:max-h-none md:w-[clamp(300px,24vw,360px)] md:min-h-0 md:snap-start ${
        isOver ? "border-border-strong" : "border-border"
      }`}
    >
      <div className="shrink-0 border-b border-border px-3.5 pb-3 pt-3.5">
        <DayHeader
          day={day}
          dayIndex={dayIndex}
          exercises={exercises}
          density="column"
          weeks={weeks}
          onPatchDay={onPatchDay}
          onRemoveDay={onRemoveDay}
          onDuplicateDay={onDuplicateDay}
          onMoveDayToWeek={onMoveDayToWeek}
          onApplyWeekdays={onApplyWeekdays}
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pt-2">
        <SelectionBar
          count={selectedKeys.length}
          onLink={() => {
            onLinkSelected(selectedKeys);
            onSelectedKeysChange([]);
          }}
          onClear={() => onSelectedKeysChange([])}
        />

        {day.items.length === 0 ? (
          dropHere === 0 ? (
            <div className="mb-2 w-full">
              <DropIndicator />
            </div>
          ) : null
        ) : (
          <SortableContext items={day.items.map((i) => i.key)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2 pb-2">
              {blocks.map((block) => {
                if (block.kind === "single") {
                  return <div key={day.items[block.index].key}>{renderCard(block.index, null, false)}</div>;
                }
                const firstKey = day.items[block.indices[0]]?.key;
                return (
                  <SupersetGroup
                    key={`ss-${firstKey}`}
                    letter={block.letter}
                    count={block.indices.length}
                    onUnlink={() => firstKey && onUnlinkGroup(firstKey)}
                  >
                    {block.indices.map((idx, li) => (
                      <div key={day.items[idx].key}>{renderCard(idx, block.labels[li], true)}</div>
                    ))}
                  </SupersetGroup>
                );
              })}
              {dropHere != null && dropHere >= day.items.length ? <DropIndicator /> : null}
            </div>
          </SortableContext>
        )}
      </div>

      <div className="shrink-0 border-t border-border p-3">
        <QuickComposer
          exercises={exercises}
          day={day}
          onAdd={onAddItem}
          onToggleLink={onToggleLink}
          onBrowse={onOpenDrawer}
        />
      </div>
    </div>
  );
}
