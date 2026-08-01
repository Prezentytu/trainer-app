"use client";

import { useEffect, useRef, useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Exercise } from "@/lib/api";
import { Button, EmptyState, IconButton, inputClass } from "@/components/ui";
import { dayContainerId } from "./dnd";
import { DropIndicator } from "./DropIndicator";
import { ExerciseCard } from "./ExerciseCard";
import { buildItemBlocks } from "./itemBlocks";
import { QuickComposer } from "./QuickComposer";
import { SelectionBar } from "./SelectionBar";
import { SupersetGroup } from "./SupersetGroup";
import { BuilderDay, BuilderItem, BuilderSet } from "./types";
import type { DropTarget } from "./useBuilderDnd";

export function DayColumn({
  day,
  dayIndex,
  exercises,
  dropTarget,
  selectedKeys,
  onSelectedKeysChange,
  onOpenDrawer,
  onPatchDay,
  onRemoveDay,
  onDuplicateDay,
  onAddItem,
  onPatchItem,
  onRemoveItem,
  onMoveItem,
  onToggleLink,
  onLinkSelected,
  onUnlinkGroup,
  onAddSet,
  onPatchSet,
  onRemoveSet,
  onApplyPreset,
  onClearSets,
}: {
  day: BuilderDay;
  dayIndex: number;
  exercises: Exercise[];
  dropTarget: DropTarget;
  selectedKeys: string[];
  onSelectedKeysChange: (keys: string[]) => void;
  onOpenDrawer: () => void;
  onPatchDay: (patch: Partial<BuilderDay>) => void;
  onRemoveDay: () => void;
  onDuplicateDay: () => void;
  onAddItem: (exerciseId: number, overrides?: Partial<BuilderItem>) => void;
  onPatchItem: (itemKey: string, patch: Partial<BuilderItem>) => void;
  onRemoveItem: (itemKey: string) => void;
  onMoveItem: (itemKey: string, dir: -1 | 1) => void;
  onToggleLink: (itemKey: string) => void;
  onLinkSelected: (itemKeys: string[]) => void;
  onUnlinkGroup: (itemKey: string) => void;
  onAddSet: (itemKey: string) => void;
  onPatchSet: (itemKey: string, setKey: string, patch: Partial<BuilderSet>) => void;
  onRemoveSet: (itemKey: string, setKey: string) => void;
  onApplyPreset: (itemKey: string, presetId: string) => void;
  onClearSets: (itemKey: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: dayContainerId(day.key) });
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());
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

  const toggleExpand = (key: string) =>
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

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
        {beforeDrop ? <div className="mb-2"><DropIndicator /></div> : null}
        <ExerciseCard
          item={item}
          weekNumber={day.weekNumber}
          exercise={exercises.find((e) => e.id === item.exerciseId)}
          badge={badge}
          nested={nested}
          expanded={expandedKeys.has(item.key)}
          selected={selectedKeys.includes(item.key)}
          showCheckbox={showCheckbox}
          onToggleExpand={() => toggleExpand(item.key)}
          onToggleSelect={() => toggleSelect(item.key)}
          onMove={(dir) => onMoveItem(item.key, dir)}
          onRemove={() => onRemoveItem(item.key)}
          onPatch={(patch) => onPatchItem(item.key, patch)}
          onAddSet={() => onAddSet(item.key)}
          onPatchSet={(setKey, patch) => onPatchSet(item.key, setKey, patch)}
          onRemoveSet={(setKey) => onRemoveSet(item.key, setKey)}
          onApplyPreset={(presetId) => onApplyPreset(item.key, presetId)}
          onClearSets={() => onClearSets(item.key)}
        />
      </div>
    );
  };

  return (
    <div
      ref={setNodeRef}
      className={`flex w-full shrink-0 flex-col rounded-2xl border bg-surface p-0 shadow-card md:w-[300px] ${
        isOver ? "border-accent" : "border-border"
      }`}
    >
      {/* DayHeader */}
      <div className="border-b border-border px-3.5 pb-3 pt-3.5">
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
                  className="min-w-0 break-words text-left text-sm font-semibold text-foreground hover:text-accent-strong"
                >
                  {day.label}
                </button>
              )}
            </div>
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
                className="mt-1 block break-words text-left text-xs text-muted hover:text-foreground-secondary"
              >
                {day.notes}
              </button>
            ) : null}
          </div>
          <div className="relative" ref={menuRef}>
            <IconButton title="Menu dnia" size="xs" onClick={() => setMenuOpen((v) => !v)}>
              ⋯
            </IconButton>
            {menuOpen && (
              <div className="absolute right-0 top-full z-20 mt-1 w-44 rounded-[10px] border border-border bg-surface py-1 shadow-raised">
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
                  Duplikuj dzień
                </button>
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

      <div className="flex flex-1 flex-col gap-2 p-3">
        <SelectionBar
          count={selectedKeys.length}
          onLink={() => {
            onLinkSelected(selectedKeys);
            onSelectedKeysChange([]);
          }}
          onClear={() => onSelectedKeysChange([])}
        />

        {day.items.length === 0 ? (
          <div className="flex flex-1 flex-col">
            {dropHere === 0 ? (
              <div className="mb-2 w-full"><DropIndicator /></div>
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
            <div className="space-y-2">
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

        <div className="mt-auto space-y-2 pt-2">
          <QuickComposer exercises={exercises} day={day} onAdd={onAddItem} onToggleLink={onToggleLink} />
          <button
            type="button"
            onClick={onOpenDrawer}
            className="w-full rounded-[10px] border border-dashed border-border-strong py-3 text-sm font-medium text-muted transition-colors hover:border-border hover:text-foreground-secondary"
          >
            + Dodaj ćwiczenie
          </button>
        </div>
      </div>
    </div>
  );
}
