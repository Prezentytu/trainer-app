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
  const hasWeeks = weeks.length > 0;
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <div className="flex flex-wrap items-center gap-1.5">
        {weeks.map((week) => (
          <Pill key={week} active={week === activeWeek} onClick={() => onSelect(week)}>
            Tydzień {week}
          </Pill>
        ))}
      </div>
      {hasWeeks ? (
        <>
          <Button
            variant="ghost"
            onClick={() => onCopyWeek(activeWeek)}
            title={`Skopiuje wszystkie dni z tygodnia ${activeWeek} jako nowy tydzień — punkt startowy do progresji, nie pusta kartka`}
          >
            + Tydzień · kopiuje T{activeWeek}
          </Button>
          <button
            type="button"
            onClick={onAddWeek}
            className="text-xs text-muted underline decoration-dotted underline-offset-2 hover:text-foreground-secondary"
          >
            zacznij od zera
          </button>
        </>
      ) : (
        <Button variant="ghost" onClick={onAddWeek}>
          + Tydzień
        </Button>
      )}
    </div>
  );
}
