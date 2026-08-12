"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Exercise } from "@/lib/api";
import { IconButton, formatRest } from "@/components/ui";
import { DayTabs } from "./DayTabs";
import { ListComposer } from "./ListComposer";
import { ListEntryCard } from "./ListEntryCard";
import { buildListGroups, countDaySets } from "./listGroups";
import { estimateWeekMinutes, formatDurationApprox } from "./summaryText";
import { BuilderDay, BuilderItem, BuilderSet } from "./types";

export function ListView({
  days,
  exercises,
  onAddDay,
  onPatchDay,
  onRemoveDay,
  onDuplicateDay,
  onAddItem,
  onAddItemAt,
  onPatchItem,
  onRemoveItem,
  onDuplicateItem,
  onToggleWarmup,
  onAddSet,
  onPatchSet,
  onRemoveSet,
  onApplyPreset,
  onClearSets,
}: {
  days: BuilderDay[];
  exercises: Exercise[];
  onAddDay: () => void;
  onPatchDay: (dayKey: string, patch: Partial<BuilderDay>) => void;
  onRemoveDay: (dayKey: string) => void;
  onDuplicateDay: (dayKey: string) => void;
  onAddItem: (dayKey: string, exerciseId: number, overrides?: Partial<BuilderItem>) => void;
  onAddItemAt: (
    dayKey: string,
    exerciseId: number,
    options: {
      positionNum: number;
      asSuper?: boolean;
      isWarmup?: boolean;
      overrides?: Partial<BuilderItem>;
    }
  ) => void;
  onPatchItem: (dayKey: string, itemKey: string, patch: Partial<BuilderItem>) => void;
  onRemoveItem: (dayKey: string, itemKey: string) => void;
  onDuplicateItem: (dayKey: string, itemKey: string) => void;
  onToggleWarmup: (dayKey: string, itemKey: string) => void;
  onAddSet: (dayKey: string, itemKey: string) => void;
  onPatchSet: (dayKey: string, itemKey: string, setKey: string, patch: Partial<BuilderSet>) => void;
  onRemoveSet: (dayKey: string, itemKey: string, setKey: string) => void;
  onApplyPreset: (dayKey: string, itemKey: string, presetId: string) => void;
  onClearSets: (dayKey: string, itemKey: string) => void;
}) {
  const [selectedDayKey, setSelectedDayKey] = useState<string | null>(null);
  const [editKey, setEditKey] = useState<string | null>(null);
  const [pendingNum, setPendingNum] = useState<number | null>(null);
  const [notesOpen, setNotesOpen] = useState(false);
  const notesRef = useRef<HTMLInputElement>(null);

  const activeDayKey =
    selectedDayKey && days.some((d) => d.key === selectedDayKey) ? selectedDayKey : (days[0]?.key ?? null);
  const activeDay = days.find((d) => d.key === activeDayKey) ?? null;
  const dayIndex = activeDay ? days.findIndex((d) => d.key === activeDay.key) : -1;
  const groups = useMemo(() => (activeDay ? buildListGroups(activeDay.items) : []), [activeDay]);
  const showNotesEditor = notesOpen || Boolean(activeDay?.notes?.trim());

  useEffect(() => {
    if (notesOpen) notesRef.current?.focus();
  }, [notesOpen]);

  const dayMeta = useMemo(() => {
    if (!activeDay || activeDay.items.length === 0) return "";
    const exCount = activeDay.items.length;
    const setCount = countDaySets(activeDay.items, exercises);
    const mins = estimateWeekMinutes(activeDay.items, exercises);
    return `${exCount} ćwiczeń · ${setCount} serii · ≈ ${formatDurationApprox(mins).replace(/^~/, "")}`;
  }, [activeDay, exercises]);

  if (!activeDay) {
    return (
      <div className="rounded-xl border border-dashed border-border-strong px-4 py-10 text-center text-sm text-muted">
        Brak dni w tym tygodniu.{" "}
        <button type="button" onClick={onAddDay} className="text-accent-strong hover:underline">
          Dodaj dzień
        </button>
      </div>
    );
  }

  return (
    <div>
      <DayTabs
        days={days}
        activeDayKey={activeDay.key}
        onSelect={(key) => {
          setSelectedDayKey(key);
          setEditKey(null);
          setPendingNum(null);
          setNotesOpen(false);
        }}
        onAddDay={onAddDay}
        metaLabel={dayMeta}
      />

      <div className="flex justify-center pb-8 pt-2">
        <div className="flex w-full max-w-[760px] flex-col gap-[18px]">
          <div className="flex flex-wrap items-baseline gap-2.5">
            <span className="font-mono text-sm font-medium tabular-nums text-muted-faint">
              D{dayIndex + 1}
            </span>
            <input
              className="min-w-0 flex-1 bg-transparent font-display text-2xl font-bold tracking-tight text-foreground outline-none placeholder:text-muted-faint"
              value={activeDay.label}
              onChange={(e) => onPatchDay(activeDay.key, { label: e.target.value })}
              placeholder="Nazwa dnia"
            />
            <div className="ml-auto flex shrink-0 items-center gap-1">
              <IconButton title="Duplikuj dzień" size="sm" onClick={() => onDuplicateDay(activeDay.key)}>
                ⎘
              </IconButton>
              <IconButton
                title="Usuń dzień"
                size="sm"
                variant="danger"
                onClick={() => onRemoveDay(activeDay.key)}
              >
                ✕
              </IconButton>
            </div>
          </div>

          {/* Notatka jest drugorzędna — pełne pole wygląda jak composer i łapie przypadkowe wpisy ćwiczeń. */}
          {showNotesEditor ? (
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-2">
                <label
                  htmlFor={`day-notes-${activeDay.key}`}
                  className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-faint"
                >
                  Notatka dnia
                </label>
                {!activeDay.notes?.trim() && (
                  <button
                    type="button"
                    onClick={() => setNotesOpen(false)}
                    className="text-xs text-muted hover:text-foreground-secondary"
                  >
                    Anuluj
                  </button>
                )}
              </div>
              <input
                ref={notesRef}
                id={`day-notes-${activeDay.key}`}
                className="w-full rounded-[10px] border border-dashed border-border bg-transparent px-3 py-2 text-sm text-foreground-secondary outline-none placeholder:text-muted-faint focus:border-border-strong focus:text-foreground"
                value={activeDay.notes ?? ""}
                onChange={(e) => onPatchDay(activeDay.key, { notes: e.target.value || null })}
                onBlur={() => {
                  if (!activeDay.notes?.trim()) setNotesOpen(false);
                }}
                placeholder="np. rozgrzewka ogólna, zasady tempa…"
              />
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setNotesOpen(true)}
              className="self-start text-xs text-muted-faint transition-colors hover:text-muted"
            >
              + Notatka / rozgrzewka dnia
            </button>
          )}

          <div className="flex flex-col gap-3">
            {groups.map((g) => (
              <div key={`g-${g.positionNum}-${g.entries[0]?.item.key}`} className="flex flex-col gap-2">
                {g.caption ? (
                  <div className="mt-1 flex items-center gap-2.5">
                    <span className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-faint">
                      {g.caption}
                    </span>
                    <span className="h-px flex-1 bg-border" />
                  </div>
                ) : null}
                <div
                  className={
                    g.multi
                      ? "flex flex-col gap-2 rounded-2xl border border-accent-border bg-accent-dim p-2"
                      : "flex flex-col gap-2"
                  }
                >
                  {g.multi ? (
                    <div className="flex items-center gap-2 px-2 pt-0.5">
                      <span className="font-mono text-xs font-semibold tracking-[0.08em] text-accent-strong">
                        SUPERSERIA {g.positionNum}
                      </span>
                      <span className="text-xs text-muted">
                        {g.flow}
                        {g.entries[0]?.item.restBetweenSetsSeconds != null
                          ? ` · ${formatRest(g.entries[0].item.restBetweenSetsSeconds)} po superserii`
                          : ""}
                      </span>
                    </div>
                  ) : null}
                  {g.entries.map((entry) => {
                    const nextLetter = String.fromCharCode(97 + g.entries.length);
                    const superLabel = `${g.positionNum}${nextLetter}`;
                    return (
                      <ListEntryCard
                        key={entry.item.key}
                        item={entry.item}
                        label={entry.label}
                        multi={g.multi}
                        isWarmup={g.isWarmup}
                        expanded={editKey === entry.item.key}
                        weekNumber={activeDay.weekNumber}
                        exercise={exercises.find((e) => e.id === entry.item.exerciseId)}
                        superLabel={superLabel}
                        onToggleExpand={() =>
                          setEditKey((k) => (k === entry.item.key ? null : entry.item.key))
                        }
                        onPatch={(patch) => onPatchItem(activeDay.key, entry.item.key, patch)}
                        onToggleWarmup={() => onToggleWarmup(activeDay.key, entry.item.key)}
                        onMakeSuper={() => {
                          setPendingNum(g.positionNum);
                          setEditKey(null);
                        }}
                        onDuplicate={() => onDuplicateItem(activeDay.key, entry.item.key)}
                        onRemove={() => onRemoveItem(activeDay.key, entry.item.key)}
                        onAddSet={() => onAddSet(activeDay.key, entry.item.key)}
                        onPatchSet={(setKey, patch) =>
                          onPatchSet(activeDay.key, entry.item.key, setKey, patch)
                        }
                        onRemoveSet={(setKey) => onRemoveSet(activeDay.key, entry.item.key, setKey)}
                        onApplyPreset={(presetId) =>
                          onApplyPreset(activeDay.key, entry.item.key, presetId)
                        }
                        onClearSets={() => onClearSets(activeDay.key, entry.item.key)}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <ListComposer
            exercises={exercises}
            day={activeDay}
            pendingNum={pendingNum}
            onCancelPending={() => setPendingNum(null)}
            onAdd={(exerciseId, overrides) => onAddItem(activeDay.key, exerciseId, overrides)}
            onAddAt={(exerciseId, options) => onAddItemAt(activeDay.key, exerciseId, options)}
          />
        </div>
      </div>
    </div>
  );
}
