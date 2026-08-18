"use client";

import { useMemo, useState } from "react";
import { Exercise } from "@/lib/api";
import { formatRest } from "@/components/ui";
import { DayHeader } from "./DayHeader";
import { ListComposer } from "./ListComposer";
import { ListEntryCard } from "./ListEntryCard";
import { NumInput } from "./NumInput";
import { libraryDefaults } from "./lastPrescription";
import { buildListGroups, listEntrySummary } from "./listGroups";
import { BuilderDay, BuilderItem, BuilderSet } from "./types";

export function ListView({
  days,
  exercises,
  selectedDayKey,
  onAddDay,
  onPatchDay,
  onRemoveDay,
  onDuplicateDay,
  weeks,
  onApplyWeekdays,
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
  selectedDayKey: string | null;
  onAddDay: () => void;
  onPatchDay: (dayKey: string, patch: Partial<BuilderDay>) => void;
  onRemoveDay: (dayKey: string) => void;
  onDuplicateDay: (dayKey: string, targetWeek?: number) => void;
  weeks: number[];
  onApplyWeekdays: (sourceWeek: number) => void;
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
  const [edit, setEdit] = useState<{ dayKey: string; itemKey: string } | null>(null);
  const [pending, setPending] = useState<{ dayKey: string; num: number } | null>(null);

  const activeDayKey =
    selectedDayKey && days.some((d) => d.key === selectedDayKey) ? selectedDayKey : (days[0]?.key ?? null);
  const activeDay = days.find((d) => d.key === activeDayKey) ?? null;
  const dayIndex = activeDay ? days.findIndex((d) => d.key === activeDay.key) : -1;
  const groups = useMemo(() => (activeDay ? buildListGroups(activeDay.items) : []), [activeDay]);
  const editKey = edit?.dayKey === activeDayKey ? edit.itemKey : null;
  const pendingNum = pending?.dayKey === activeDayKey ? pending.num : null;

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
    <div className="flex justify-center pb-6 pt-1">
      <div className="flex w-full max-w-[840px] flex-col gap-[18px]">
        {days.every((d) => d.items.length === 0) ? (
          <p className="text-sm text-muted">
            Wpisz „przysiad 3x8” w polu pod dniem albo otwórz bibliotekę.
          </p>
        ) : null}
        <DayHeader
          day={activeDay}
          dayIndex={dayIndex + 1}
          exercises={exercises}
          density="page"
          weeks={weeks}
          onPatchDay={(patch) => onPatchDay(activeDay.key, patch)}
          onRemoveDay={() => onRemoveDay(activeDay.key)}
          onDuplicateDay={(w) => onDuplicateDay(activeDay.key, w)}
          onApplyWeekdays={() => onApplyWeekdays(activeDay.weekNumber)}
        />

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
                  <div className="flex flex-wrap items-center gap-2 px-2 pt-0.5">
                    <span className="font-mono text-xs font-semibold tracking-[0.08em] text-accent-strong">
                      SUPERSERIA {g.positionNum}
                    </span>
                    <span className="text-xs text-muted">{g.flow}</span>
                    <label className="ml-auto flex items-center gap-1.5 text-xs text-muted">
                      Przerwa po superserii
                      <NumInput
                        className="w-16 px-2 py-1 text-center"
                        value={g.entries[0]?.item.restBetweenSetsSeconds ?? null}
                        min={0}
                        onChange={(v) => {
                          const first = g.entries[0]?.item;
                          if (first) onPatchItem(activeDay.key, first.key, { restBetweenSetsSeconds: v });
                        }}
                        placeholder="60"
                      />
                      {g.entries[0]?.item.restBetweenSetsSeconds != null ? (
                        <span className="text-muted-faint">
                          {formatRest(g.entries[0].item.restBetweenSetsSeconds)}
                        </span>
                      ) : null}
                    </label>
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
                      lastPrescriptionLabel={entry.item.lastPrescriptionLabel}
                      onUndoLastPrescription={
                        entry.item.lastPrescriptionLabel
                          ? () => {
                              const ex = exercises.find((e) => e.id === entry.item.exerciseId);
                              if (!ex) return;
                              onPatchItem(activeDay.key, entry.item.key, libraryDefaults(entry.item, ex));
                            }
                          : undefined
                      }
                      partners={
                        g.multi
                          ? g.entries
                              .filter((e) => e.item.key !== entry.item.key)
                              .map((e) => ({
                                label: e.label,
                                name: e.item.exerciseName,
                                summary: listEntrySummary(
                                  e.item,
                                  exercises.find((ex) => ex.id === e.item.exerciseId),
                                  true,
                                ),
                                setCount: e.item.prescribedSets.length || e.item.sets || 0,
                              }))
                          : []
                      }
                      onToggleExpand={() =>
                        setEdit((prev) =>
                          prev?.dayKey === activeDay.key && prev.itemKey === entry.item.key
                            ? null
                            : { dayKey: activeDay.key, itemKey: entry.item.key },
                        )
                      }
                      onPatch={(patch) => onPatchItem(activeDay.key, entry.item.key, patch)}
                      onToggleWarmup={() => onToggleWarmup(activeDay.key, entry.item.key)}
                      onMakeSuper={() => {
                        setPending({ dayKey: activeDay.key, num: g.positionNum });
                        setEdit(null);
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
          onCancelPending={() => setPending(null)}
          onAdd={(exerciseId, overrides) => onAddItem(activeDay.key, exerciseId, overrides)}
          onAddAt={(exerciseId, options) => onAddItemAt(activeDay.key, exerciseId, options)}
        />
      </div>
    </div>
  );
}
