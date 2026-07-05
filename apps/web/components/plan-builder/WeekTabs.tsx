"use client";

import { Button, Pill } from "@/components/ui";

export function WeekTabs({
  weeks,
  activeWeek,
  onSelect,
  onAddWeek,
  onCopyWeek,
}: {
  weeks: number[];
  activeWeek: number;
  onSelect: (week: number) => void;
  onAddWeek: () => void;
  onCopyWeek: (week: number) => void;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <div className="flex flex-wrap items-center gap-1.5">
        {weeks.map((week) => (
          <Pill key={week} active={week === activeWeek} onClick={() => onSelect(week)}>
            Tydzień {week}
          </Pill>
        ))}
      </div>
      <Button variant="ghost" onClick={onAddWeek}>
        + Tydzień
      </Button>
      <Button variant="ghost" onClick={() => onCopyWeek(activeWeek)}>
        Kopiuj tydzień
      </Button>
    </div>
  );
}
