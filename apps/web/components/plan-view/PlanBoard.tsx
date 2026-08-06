"use client";

import { PlanDay } from "@/lib/api";
import { PlanDayColumn } from "./PlanDayColumn";

export function PlanBoard({
  days,
  selectedItemId,
  panelId,
  onSelectItem,
}: {
  days: PlanDay[];
  selectedItemId: number | null;
  panelId: string;
  onSelectItem: (itemId: number) => void;
}) {
  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto overscroll-y-contain md:flex-row md:items-stretch md:gap-3 md:overflow-x-auto md:overflow-y-hidden md:overscroll-x-contain md:snap-x md:snap-mandatory md:pb-1">
        {days.map((day, idx) => (
          <PlanDayColumn
            key={day.id}
            day={day}
            dayIndex={idx + 1}
            selectedItemId={selectedItemId}
            panelId={panelId}
            onSelectItem={onSelectItem}
          />
        ))}
      </div>
    </div>
  );
}
