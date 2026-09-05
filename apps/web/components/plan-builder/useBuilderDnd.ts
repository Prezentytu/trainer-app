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
import {
  dayKeyFromContainerId,
  dayKeyFromPillId,
  isDayContainerId,
  isDayPillId,
  isWeekChipId,
  weekFromChipId,
} from "./dnd";
import { moveDayTo, moveItemTo } from "./builderMove";
import { BuilderDay, BuilderItem } from "./types";

export type DropTarget = { dayKey: string; index: number } | null;

export type ActiveDrag =
  | { kind: "item"; item: BuilderItem }
  | { kind: "day"; label: string }
  | { kind: "week"; week: number };

export function useBuilderDnd({
  days,
  setDays,
  setActiveWeek,
  onReorderWeeks,
  onMoveDay,
}: {
  days: BuilderDay[];
  setDays: React.Dispatch<React.SetStateAction<BuilderDay[]>>;
  setActiveWeek?: (week: number) => void;
  onReorderWeeks?: (from: number, to: number) => void;
  onMoveDay?: (dayKey: string, week: number) => void;
}) {
  const [activeDrag, setActiveDrag] = useState<ActiveDrag | null>(null);
  const [dropTarget, setDropTarget] = useState<DropTarget>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor),
  );

  const findDayOfItem = (itemKey: string) => days.find((d) => d.items.some((i) => i.key === itemKey));
  const firstDayOfWeek = (week: number) =>
    days.filter((d) => d.weekNumber === week).sort((a, b) => a.order - b.order)[0];

  const handleDragStart = (event: DragStartEvent) => {
    const id = String(event.active.id);
    if (isWeekChipId(id)) {
      setActiveDrag({ kind: "week", week: weekFromChipId(id) });
      return;
    }
    if (isDayPillId(id)) {
      const day = days.find((d) => d.key === dayKeyFromPillId(id));
      setActiveDrag({ kind: "day", label: day?.label ?? "Dzień" });
      return;
    }
    const day = findDayOfItem(id);
    setActiveDrag(day ? { kind: "item", item: day.items.find((i) => i.key === id)! } : null);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) {
      setDropTarget(null);
      return;
    }
    const overId = String(over.id);
    const activeKey = String(active.id);
    if (isWeekChipId(activeKey) || isDayPillId(activeKey)) {
      setDropTarget(null);
      return;
    }
    if (overId === activeKey) {
      setDropTarget(null);
      return;
    }
    if (isWeekChipId(overId)) {
      const day = firstDayOfWeek(weekFromChipId(overId));
      setDropTarget(day ? { dayKey: day.key, index: day.items.length } : null);
      return;
    }
    if (isDayPillId(overId)) {
      const day = days.find((d) => d.key === dayKeyFromPillId(overId));
      setDropTarget(day ? { dayKey: day.key, index: day.items.length } : null);
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
      prev?.dayKey === next.dayKey && prev.index === next.index ? prev : next,
    );
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const currentDrop = dropTarget;
    const drag = activeDrag;
    setActiveDrag(null);
    setDropTarget(null);
    const { active, over } = event;
    const activeId = String(active.id);
    const overId = over ? String(over.id) : null;

    if (isWeekChipId(activeId) && overId && isWeekChipId(overId)) {
      const from = weekFromChipId(activeId);
      const to = weekFromChipId(overId);
      if (from !== to) onReorderWeeks?.(from, to);
      return;
    }

    if (isDayPillId(activeId) && overId) {
      const dayKey = dayKeyFromPillId(activeId);
      if (isWeekChipId(overId)) {
        onMoveDay?.(dayKey, weekFromChipId(overId));
        return;
      }
      if (isDayPillId(overId)) {
        const target = days.find((d) => d.key === dayKeyFromPillId(overId));
        const source = days.find((d) => d.key === dayKey);
        if (target && source && target.key !== source.key) {
          const weekDays = days
            .filter((d) => d.weekNumber === target.weekNumber)
            .sort((a, b) => a.order - b.order);
          const index = weekDays.findIndex((d) => d.key === target.key);
          setDays((prev) =>
            moveDayTo(prev, dayKey, {
              weekNumber: target.weekNumber,
              index: index === -1 ? undefined : index,
            }),
          );
          setActiveWeek?.(target.weekNumber);
        }
      }
      return;
    }

    if (!over && !currentDrop) return;
    const sourceDay = findDayOfItem(activeId);
    if (!sourceDay || drag?.kind !== "item") return;

    let targetDayKey = currentDrop?.dayKey ?? null;
    if (!targetDayKey && overId) {
      if (isWeekChipId(overId)) targetDayKey = firstDayOfWeek(weekFromChipId(overId))?.key ?? null;
      else if (isDayPillId(overId)) targetDayKey = dayKeyFromPillId(overId);
      else if (isDayContainerId(overId)) targetDayKey = dayKeyFromContainerId(overId);
      else targetDayKey = findDayOfItem(overId)?.key ?? null;
    }
    if (!targetDayKey) return;

    if (sourceDay.key === targetDayKey && overId && !isDayContainerId(overId) && !isWeekChipId(overId) && !isDayPillId(overId) && !currentDrop) {
      const oldIndex = sourceDay.items.findIndex((i) => i.key === activeId);
      const newIndex = sourceDay.items.findIndex((i) => i.key === overId);
      if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;
      setDays((prev) =>
        prev.map((d) =>
          d.key !== sourceDay.key
            ? d
            : { ...d, items: arrayMove(d.items, oldIndex, newIndex).map((i, o) => ({ ...i, order: o + 1 })) },
        ),
      );
      return;
    }

    const targetIndex = currentDrop?.dayKey === targetDayKey ? currentDrop.index : days.find((d) => d.key === targetDayKey)?.items.length ?? 0;
    setDays((prev) => moveItemTo(prev, { dayKey: sourceDay.key, itemKey: activeId }, { dayKey: targetDayKey, index: targetIndex }));
    const targetWeek = days.find((d) => d.key === targetDayKey)?.weekNumber;
    if (targetWeek != null) setActiveWeek?.(targetWeek);
  };

  return {
    sensors,
    collisionDetection: closestCenter,
    activeDragItem: activeDrag?.kind === "item" ? activeDrag.item : null,
    activeDrag,
    dropTarget,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
  };
}
