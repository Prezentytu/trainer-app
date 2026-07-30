"use client";

import { useState } from "react";
import {
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { dayKeyFromContainerId, isDayContainerId } from "./dnd";
import { detachLinks } from "./usePlanDraft";
import { BuilderDay, BuilderItem } from "./types";

export type DropTarget = { dayKey: string; index: number } | null;

export function useBuilderDnd({
  days,
  setDays,
}: {
  days: BuilderDay[];
  setDays: React.Dispatch<React.SetStateAction<BuilderDay[]>>;
}) {
  const [activeDragItem, setActiveDragItem] = useState<BuilderItem | null>(null);
  const [dropTarget, setDropTarget] = useState<DropTarget>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor)
  );

  const findDayOfItem = (itemKey: string) => days.find((d) => d.items.some((i) => i.key === itemKey));

  const handleDragStart = (event: DragStartEvent) => {
    const day = findDayOfItem(String(event.active.id));
    setActiveDragItem(day?.items.find((i) => i.key === event.active.id) ?? null);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) {
      setDropTarget(null);
      return;
    }
    const overId = String(over.id);
    const activeKey = String(active.id);
    if (overId === activeKey) {
      setDropTarget(null);
      return;
    }
    const targetDayKey = isDayContainerId(overId) ? dayKeyFromContainerId(overId) : findDayOfItem(overId)?.key;
    if (!targetDayKey) {
      setDropTarget(null);
      return;
    }
    const targetDay = days.find((d) => d.key === targetDayKey);
    if (!targetDay) {
      setDropTarget(null);
      return;
    }
    const index = isDayContainerId(overId)
      ? targetDay.items.length
      : targetDay.items.findIndex((i) => i.key === overId);
    const next = { dayKey: targetDayKey, index: index === -1 ? targetDay.items.length : index };
    setDropTarget((prev) =>
      prev?.dayKey === next.dayKey && prev.index === next.index ? prev : next
    );
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const currentDrop = dropTarget;
    setActiveDragItem(null);
    setDropTarget(null);
    const { active, over } = event;
    if (!over && !currentDrop) return;
    const activeKey = String(active.id);
    const overId = over ? String(over.id) : null;

    const sourceDay = findDayOfItem(activeKey);
    if (!sourceDay) return;

    const targetDayKey =
      currentDrop?.dayKey ??
      (overId ? (isDayContainerId(overId) ? dayKeyFromContainerId(overId) : findDayOfItem(overId)?.key) : null);
    if (!targetDayKey) return;

    if (sourceDay.key === targetDayKey && overId && !isDayContainerId(overId) && !currentDrop) {
      const oldIndex = sourceDay.items.findIndex((i) => i.key === activeKey);
      const newIndex = sourceDay.items.findIndex((i) => i.key === overId);
      if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;
      setDays((prev) =>
        prev.map((d) =>
          d.key !== sourceDay.key
            ? d
            : { ...d, items: arrayMove(d.items, oldIndex, newIndex).map((i, o) => ({ ...i, order: o + 1 })) }
        )
      );
      return;
    }

    const movingItem = sourceDay.items.find((i) => i.key === activeKey);
    if (!movingItem) return;

    setDays((prev) => {
      const withoutItem = prev.map((d) =>
        d.key !== sourceDay.key
          ? d
          : { ...d, items: detachLinks(d.items, activeKey).filter((i) => i.key !== activeKey) }
      );
      return withoutItem.map((d) => {
        if (d.key !== targetDayKey) return d;
        let targetIndex: number;
        if (currentDrop && currentDrop.dayKey === targetDayKey) {
          targetIndex = currentDrop.index;
          // Adjust if we removed an item before the target in the same day
          if (sourceDay.key === targetDayKey) {
            const oldIndex = sourceDay.items.findIndex((i) => i.key === activeKey);
            if (oldIndex !== -1 && oldIndex < targetIndex) targetIndex = Math.max(0, targetIndex - 1);
          }
        } else if (overId && !isDayContainerId(overId)) {
          const idx = d.items.findIndex((i) => i.key === overId);
          targetIndex = idx === -1 ? d.items.length : idx;
        } else {
          targetIndex = d.items.length;
        }
        const items = [...d.items];
        items.splice(targetIndex, 0, { ...movingItem, linkedToNext: false });
        return { ...d, items: items.map((i, o) => ({ ...i, order: o + 1 })) };
      });
    });
  };

  return {
    sensors,
    collisionDetection: closestCenter,
    activeDragItem,
    dropTarget,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
  };
}
