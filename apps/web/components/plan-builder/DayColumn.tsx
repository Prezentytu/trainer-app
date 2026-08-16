"use client";

import { useEffect, useRef, useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Exercise } from "@/lib/api";
import { Button, EmptyState, IconButton, inputClass } from "@/components/ui";
import { DayScheduleChips } from "./DayScheduleChips";
import { dayContainerId } from "./dnd";
import { DropIndicator } from "./DropIndicator";
import { ExerciseCard } from "./ExerciseCard";
import { buildItemBlocks } from "./itemBlocks";
import { QuickComposer } from "./QuickComposer";
import { SelectionBar } from "./SelectionBar";
import { SupersetGroup } from "./SupersetGroup";
import { dayStatsLine } from "./summaryText";
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
  weeks,
  onApplyWeekdays,
  onAddItem,
  onRemoveItem,
  onMoveItem,
  onDuplicateItem,
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
  weeks: number[];
  onApplyWeekdays: () => void;
  onAddItem: (exerciseId: number, overrides?: Partial<BuilderItem>) => void;
  onRemoveItem: (itemKey: string) => void;
  onMoveItem: (itemKey: string, dir: -1 | 1) => void;
  onDuplicateItem: (itemKey: string) => void;
  onToggleWarmup: (itemKey: string) => void;
  onToggleLink: (itemKey: string) => void;
  onLinkSelected: (itemKeys: string[]) => void;
  onUnlinkGroup: (itemKey: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: dayContainerId(day.key) });
  const [menuOpen, setMenuOpen] = useState(false);
  const [editingLabel, setEditingLabel] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [menuOpen]);

  const toggleSelect = (key: string) => {
    const set = new Set(selectedKeys);
    if (set.has(key)) set.delete(key);
    else set.add(key);
    onSelectedKeysChange([...set]);
  };

  const showCheckbox = selectedKeys.length > 0;
  const blocks = buildItemBlocks(day.items);
  const dropHere = dropTarget?.dayKey === day.key ? dropTarget.index : null;
  const stats = dayStatsLine(day, exercises);

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
        />
      </div>
    );
  };

  return (
    <div
      ref={setNodeRef}
      className={`flex max-h-[70dvh] w-full shrink-0 flex-col rounded-[var(--r-card)] border bg-surface p-0 md:h-full md:max-h-none md:w-[300px] md:min-h-0 md:snap-start ${
        isOver ? "border-border-strong" : "border-border"
      }`}
    >
      <div className="shrink-0 border-b border-border px-3.5 pb-3 pt-3.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-xs font-semibold tracking-wide text-muted">D{dayIndex}</span>
              {editingLabel ? (
                <input
                  autoFocus
                  className={`${inputClass} h-8 py-0 text-sm font-semibold`}
                  value={day.label}
                  onChange={(e) => onPatchDay({ label: e.target.value })}
                  onBlur={() => setEditingLabel(false)}
                  onKeyDown={(e) => e.key === "Enter" && setEditingLabel(false)}
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setEditingLabel(true)}
                  className="min-w-0 break-words text-left text-sm font-semibold text-foreground hover:text-foreground-secondary"
                >
                  {day.label}
                </button>
              )}
            </div>
            <p className="mt-1 font-mono text-xs tabular-nums text-muted">{stats}</p>
            {editingNotes ? (
              <input
                autoFocus
                className={`${inputClass} mt-1.5 h-8 py-0 text-xs`}
                value={day.notes ?? ""}
                onChange={(e) => onPatchDay({ notes: e.target.value || null })}
                onBlur={() => setEditingNotes(false)}
                onKeyDown={(e) => e.key === "Enter" && setEditingNotes(false)}
                placeholder="Notatka dnia"
              />
            ) : day.notes ? (
              <button
                type="button"
                onClick={() => setEditingNotes(true)}
                className="mt-1.5 block break-words text-left text-xs text-muted hover:text-foreground-secondary"
              >
                {day.notes}
              </button>
            ) : null}
            <div className="mt-2">
              <DayScheduleChips
                day={day}
                onPatch={onPatchDay}
                showApply={weeks.length > 1}
                onApplyToOtherWeeks={onApplyWeekdays}
              />
            </div>
          </div>
          <div className="relative" ref={menuRef}>
            <IconButton title="Menu dnia" size="xs" onClick={() => setMenuOpen((v) => !v)}>
              ⋯
            </IconButton>
            {menuOpen && (
              <div className="absolute right-0 top-full z-20 mt-1 w-44 rounded-[10px] border border-border bg-surface py-1">
                <button
                  type="button"
                  className="block w-full px-3 py-2 text-left text-sm hover:bg-surface-hover"
                  onClick={() => {
                    setEditingLabel(true);
                    setMenuOpen(false);
                  }}
                >
                  Zmień nazwę
                </button>
                <button
                  type="button"
                  className="block w-full px-3 py-2 text-left text-sm hover:bg-surface-hover"
                  onClick={() => {
                    setEditingNotes(true);
                    setMenuOpen(false);
                  }}
                >
                  Notatka dnia
                </button>
                <button
                  type="button"
                  className="block w-full px-3 py-2 text-left text-sm hover:bg-surface-hover"
                  onClick={() => {
                    onDuplicateDay();
                    setMenuOpen(false);
                  }}
                >
                  Duplikuj w tym tygodniu
                </button>
                {weeks
                  .filter((w) => w !== day.weekNumber)
                  .map((w) => (
                    <button
                      key={w}
                      type="button"
                      className="block w-full px-3 py-2 text-left text-sm hover:bg-surface-hover"
                      onClick={() => {
                        onDuplicateDay(w);
                        setMenuOpen(false);
                      }}
                    >
                      Duplikuj do tygodnia {w}
                    </button>
                  ))}
                <button
                  type="button"
                  className="block w-full px-3 py-2 text-left text-sm text-danger hover:bg-danger-bg"
                  onClick={() => {
                    onRemoveDay();
                    setMenuOpen(false);
                  }}
                >
                  Usuń dzień
                </button>
              </div>
            )}
          </div>
        </div>
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
          <div className="py-2">
            {dropHere === 0 ? (
              <div className="mb-2 w-full">
                <DropIndicator />
              </div>
            ) : null}
            <EmptyState
              title="Pusty dzień"
              action={
                <Button type="button" size="sm" onClick={onOpenDrawer}>
                  Dodaj ćwiczenie
                </Button>
              }
            >
              Przeciągnij z biblioteki albo dodaj pierwsze ćwiczenie — tu pojawi się lista serii.
            </EmptyState>
          </div>
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
