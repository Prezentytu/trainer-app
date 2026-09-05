"use client";

import { ReactNode } from "react";
import { horizontalListSortingStrategy, SortableContext, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Icon } from "@/components/Icon";
import { IconButton } from "@/components/ui";
import { CopyWeekOpts, CopyWeekPopover } from "./CopyWeekPopover";
import { dayPillId, weekChipId } from "./dnd";
import {
  FloatingMenu,
  FloatingMenuItem,
  FloatingMenuLabel,
  FloatingMenuSeparator,
} from "./FloatingMenu";
import { BuilderDay } from "./types";

export function WeekTabs({
  weeks,
  activeWeek,
  onSelect,
  onAddWeek,
  onCopyWeek,
  onInsertWeek,
  onDuplicateWeek,
  onRemoveWeek,
  days,
  activeDayKey,
  onSelectDay,
  onAddDay,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  metaLabel,
  right,
}: {
  weeks: number[];
  activeWeek: number;
  onSelect: (week: number) => void;
  onAddWeek: () => void;
  onCopyWeek: (week: number, opts?: CopyWeekOpts) => void;
  onInsertWeek?: (week: number, side: "before" | "after") => void;
  onDuplicateWeek?: (week: number) => void;
  onRemoveWeek?: (week: number) => void;
  days?: BuilderDay[];
  activeDayKey?: string | null;
  onSelectDay?: (dayKey: string) => void;
  onAddDay?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  metaLabel?: string;
  right?: ReactNode;
}) {
  const nextWeek = (weeks.length ? Math.max(...weeks) : 0) + 1;
  const showDays = days != null && onSelectDay != null && onAddDay != null;

  return (
    <div className="flex min-h-9 shrink-0 items-center gap-2 border-b border-border py-1.5">
      <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto overscroll-x-contain">
        <SortableContext items={weeks.map(weekChipId)} strategy={horizontalListSortingStrategy}>
          <div className="flex shrink-0 items-center gap-1">
            {weeks.map((week) => (
              <WeekChip
                key={week}
                week={week}
                active={week === activeWeek}
                onSelect={() => onSelect(week)}
              />
            ))}
          </div>
        </SortableContext>
        <IconButton title="Dodaj tydzień" size="sm" variant="outline" onClick={onAddWeek}>
          <Icon name="plus" size={16} decorative />
        </IconButton>
        {weeks.length > 0 && (onInsertWeek || onDuplicateWeek || onRemoveWeek) ? (
          <FloatingMenu
            label={`Operacje na tygodniu ${activeWeek}`}
            minWidth="13rem"
            trigger={({ open, toggle, ref }) => (
              <button
                ref={ref}
                type="button"
                onClick={toggle}
                aria-expanded={open}
                aria-haspopup="menu"
                title={`Operacje na tygodniu ${activeWeek}`}
                className="inline-flex h-[var(--h-control)] w-[var(--h-control)] shrink-0 items-center justify-center rounded-[var(--r-field)] text-sm text-muted-faint transition-colors hover:bg-surface-hover hover:text-foreground"
              >
                …
              </button>
            )}
          >
            {({ close }) => (
              <>
                <FloatingMenuLabel>Tydzień {activeWeek}</FloatingMenuLabel>
                {onInsertWeek ? (
                  <>
                    <FloatingMenuItem
                      onClick={() => {
                        onInsertWeek(activeWeek, "before");
                        close();
                      }}
                    >
                      Wstaw pusty tydzień przed
                    </FloatingMenuItem>
                    <FloatingMenuItem
                      onClick={() => {
                        onInsertWeek(activeWeek, "after");
                        close();
                      }}
                    >
                      Wstaw pusty tydzień po
                    </FloatingMenuItem>
                  </>
                ) : null}
                {onDuplicateWeek ? (
                  <FloatingMenuItem
                    onClick={() => {
                      onDuplicateWeek(activeWeek);
                      close();
                    }}
                  >
                    Duplikuj tydzień
                  </FloatingMenuItem>
                ) : null}
                {onRemoveWeek && weeks.length > 1 ? (
                  <>
                    <FloatingMenuSeparator />
                    <FloatingMenuItem
                      danger
                      onClick={() => {
                        onRemoveWeek(activeWeek);
                        close();
                      }}
                    >
                      Usuń tydzień
                    </FloatingMenuItem>
                  </>
                ) : null}
              </>
            )}
          </FloatingMenu>
        ) : null}
        {weeks.length > 0 ? (
          <CopyWeekPopover
            activeWeek={activeWeek}
            nextWeek={nextWeek}
            onCopy={(opts) => onCopyWeek(activeWeek, opts)}
          />
        ) : null}
        {showDays ? (
          <>
            <span className="mx-1 h-4 w-px shrink-0 bg-border" aria-hidden />
            <SortableContext items={days.map((d) => dayPillId(d.key))} strategy={horizontalListSortingStrategy}>
              <div className="flex shrink-0 items-center gap-1">
                {days.map((day, idx) => (
                  <DayChip
                    key={day.key}
                    dayKey={day.key}
                    label={`D${idx + 1}`}
                    active={day.key === activeDayKey}
                    onSelect={() => onSelectDay(day.key)}
                  />
                ))}
              </div>
            </SortableContext>
            <button
              type="button"
              onClick={onAddDay}
              className="rounded-full border border-dashed border-border-strong px-3 py-1.5 text-sm font-medium text-muted-faint transition-colors hover:text-foreground-secondary"
            >
              + Dzień
            </button>
          </>
        ) : null}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {onUndo && onRedo ? (
          <div className="flex items-center gap-0.5">
            <IconButton title="Cofnij (⌘Z)" size="sm" onClick={onUndo} disabled={!canUndo}>
              <Icon name="undo" size={16} decorative />
            </IconButton>
            <IconButton title="Ponów (⇧⌘Z)" size="sm" onClick={onRedo} disabled={!canRedo}>
              <Icon name="redo" size={16} decorative />
            </IconButton>
          </div>
        ) : null}
        {right}
        {metaLabel ? (
          <span className="hidden font-mono text-xs tabular-nums text-muted-faint sm:inline">
            {metaLabel}
          </span>
        ) : null}
      </div>
    </div>
  );
}

const chipClass = (active: boolean) =>
  `min-h-8 min-w-8 rounded-full px-2.5 py-1.5 font-mono text-sm tabular-nums transition-colors ${
    active
      ? "border border-border-strong bg-surface-active font-semibold text-foreground"
      : "border border-border bg-surface text-foreground-secondary hover:border-border-strong"
  }`;

function WeekChip({
  week,
  active,
  onSelect,
}: {
  week: number;
  active: boolean;
  onSelect: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: weekChipId(week),
  });
  return (
    <button
      ref={setNodeRef}
      type="button"
      style={{ transform: CSS.Transform.toString(transform), transition }}
      onClick={onSelect}
      aria-label={`Tydzień ${week}. Przeciągnij, żeby zmienić kolejność.`}
      aria-current={active ? "true" : undefined}
      className={`${chipClass(active)} ${isDragging ? "opacity-50" : ""}`}
      {...attributes}
      {...listeners}
    >
      {week}
    </button>
  );
}

function DayChip({
  dayKey,
  label,
  active,
  onSelect,
}: {
  dayKey: string;
  label: string;
  active: boolean;
  onSelect: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: dayPillId(dayKey),
  });
  return (
    <button
      ref={setNodeRef}
      type="button"
      style={{ transform: CSS.Transform.toString(transform), transition }}
      onClick={onSelect}
      aria-label={`${label}. Przeciągnij, żeby zmienić kolejność albo przenieść na inny tydzień.`}
      aria-current={active ? "true" : undefined}
      className={`${chipClass(active)} ${isDragging ? "opacity-50" : ""}`}
      {...attributes}
      {...listeners}
    >
      {label}
    </button>
  );
}
