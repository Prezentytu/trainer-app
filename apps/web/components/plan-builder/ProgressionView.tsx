"use client";

import { useMemo, useState } from "react";
import { splitExerciseName } from "@/lib/exerciseName";
import { SegmentedControl } from "@/components/ui";
import {
  formatDelta,
  formatProgressionPreview,
  generateProgression,
  PROGRESSION_HINTS,
  PROGRESSION_LABELS,
  ProgressionModel,
} from "@/lib/progressionModels";
import { NumInput } from "./NumInput";
import { editorChipOff, editorChipOn } from "./editorChips";
import { buildProgressionRows, ProgressionRow, topLoadPatch } from "./progressionMatrix";
import { BuilderDay, BuilderItem } from "./types";

const MODELS: ProgressionModel[] = ["linear", "step", "wave"];

export type ProgressionRecipe = {
  model: ProgressionModel;
  baseKg: number;
  incrementKg: number;
  blockWeeks: number;
  deloadPercent: number | null;
  scope: "item" | "day";
};

function GeneratorPanel({
  row,
  weeks,
  onApply,
  onClose,
}: {
  row: ProgressionRow;
  weeks: number[];
  onApply: (recipe: ProgressionRecipe) => void;
  onClose: () => void;
}) {
  const firstKg = weeks.map((w) => row.cellsByWeek.get(w)?.topKg).find((kg) => kg != null) ?? null;
  const [model, setModel] = useState<ProgressionModel>("linear");
  const [baseKg, setBaseKg] = useState<number | null>(firstKg);
  const [incrementKg, setIncrementKg] = useState<number | null>(2.5);
  const [blockWeeks, setBlockWeeks] = useState<number | null>(2);
  const [deload, setDeload] = useState(false);
  const [wholeDay, setWholeDay] = useState(false);

  const values = useMemo(() => {
    if (baseKg == null || incrementKg == null) return [];
    return generateProgression(model, {
      baseKg,
      weeks: weeks.length,
      incrementKg,
      blockWeeks: blockWeeks ?? undefined,
      deloadPercent: deload ? 85 : null,
    });
  }, [model, baseKg, incrementKg, blockWeeks, deload, weeks.length]);

  const ready = values.length > 0;

  return (
    <div className="mx-1 mt-3 rounded-[10px] border border-border-strong bg-surface-sunken p-3">
      <p className="mb-2 text-sm font-semibold text-foreground">
        Progresja: {splitExerciseName(row.exerciseName).primary}
      </p>
      <SegmentedControl
        items={MODELS.map((m) => ({ value: m, label: PROGRESSION_LABELS[m] }))}
        value={model}
        onChange={(v) => {
          const next = v as ProgressionModel;
          setModel(next);
          setBlockWeeks(next === "wave" ? 3 : 2);
        }}
      />
      <p className="mt-2 text-sm text-muted">{PROGRESSION_HINTS[model]}</p>

      <div className="mt-3 flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-sm text-muted">
          Start (kg)
          <span className="w-20">
            <NumInput
              value={baseKg}
              min={0}
              step={0.5}
              onChange={setBaseKg}
              placeholder="80"
              aria-label="Ciężar startowy w kilogramach"
            />
          </span>
        </label>
        <label className="flex flex-col gap-1 text-sm text-muted">
          Skok (kg)
          <span className="w-20">
            <NumInput
              value={incrementKg}
              min={0}
              step={0.5}
              onChange={setIncrementKg}
              placeholder="2,5"
              aria-label="Skok obciążenia w kilogramach"
            />
          </span>
        </label>
        {model !== "linear" ? (
          <label className="flex flex-col gap-1 text-sm text-muted">
            {model === "wave" ? "Długość fali" : "Trzymaj (tyg.)"}
            <span className="w-20">
              <NumInput
                value={blockWeeks}
                min={1}
                max={8}
                onChange={setBlockWeeks}
                placeholder="3"
                aria-label={model === "wave" ? "Długość fali w tygodniach" : "Ile tygodni trzymać ciężar"}
              />
            </span>
          </label>
        ) : null}
        <button
          type="button"
          className={deload ? editorChipOn : editorChipOff}
          onClick={() => setDeload((v) => !v)}
          aria-pressed={deload}
        >
          Ostatni tydzień lżejszy
        </button>
        <button
          type="button"
          className={wholeDay ? editorChipOn : editorChipOff}
          onClick={() => setWholeDay((v) => !v)}
          aria-pressed={wholeDay}
        >
          Cały dzień
        </button>
      </div>

      <div className="mt-3 border-t border-border pt-2.5">
        <p className="t-label text-muted-faint">Podgląd</p>
        <p className="mt-1 font-mono text-[13px] tabular-nums text-foreground">
          {ready ? formatProgressionPreview(values) : "Podaj start i skok."}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={!ready}
            onClick={() => {
              if (baseKg == null || incrementKg == null) return;
              onApply({
                model,
                baseKg,
                incrementKg,
                blockWeeks: blockWeeks ?? 2,
                deloadPercent: deload ? 85 : null,
                scope: wholeDay ? "day" : "item",
              });
              onClose();
            }}
            className="text-sm font-semibold text-foreground transition-colors hover:text-foreground-secondary disabled:opacity-40"
          >
            Zastosuj do tygodni
          </button>
          <button
            type="button"
            onClick={onClose}
            className="text-sm font-medium text-muted transition-colors hover:text-foreground-secondary"
          >
            Anuluj
          </button>
        </div>
        <p className="mt-1.5 text-xs text-muted">
          {wholeDay
            ? "Każde ćwiczenie tego dnia dostanie ten sam wzór, licząc od własnego ciężaru z pierwszego tygodnia."
            : "Nadpisze ciężar serii szczytowej w tygodniach, w których to ćwiczenie już jest."}{" "}
          Cofnij przywróci poprzednie wartości.
        </p>
      </div>
    </div>
  );
}

/**
 * Progresja: jeden wiersz na ćwiczenie, jedna kolumna na tydzień. Trener widzi ciężar
 * serii szczytowej tydzień po tygodniu, edytuje go w miejscu i może wygenerować cały
 * blok jednym z modeli (liniowy, schodkowy, falowy).
 */
export function ProgressionView({
  days,
  activeWeek,
  onPatchItem,
}: {
  days: BuilderDay[];
  activeWeek: number;
  onPatchItem: (dayKey: string, itemKey: string, patch: Partial<BuilderItem>) => void;
}) {
  const weeks = useMemo(
    () => [...new Set(days.map((d) => d.weekNumber))].sort((a, b) => a - b),
    [days],
  );
  const rows = useMemo(() => buildProgressionRows(days), [days]);
  const [generatorKey, setGeneratorKey] = useState<string | null>(null);

  if (rows.length === 0) {
    return (
      <div className="min-h-0 flex-1 overflow-y-auto px-1 py-8">
        <p className="text-sm text-muted">
          Dodaj ćwiczenia w tygodniach, żeby zaplanować progresję obciążeń.
        </p>
      </div>
    );
  }

  const byDay = new Map<number, ProgressionRow[]>();
  for (const row of rows) {
    byDay.set(row.dayOrder, [...(byDay.get(row.dayOrder) ?? []), row]);
  }

  const setTopKg = (row: ProgressionRow, weekNumber: number, kg: number | null) => {
    const cell = row.cellsByWeek.get(weekNumber);
    if (!cell) return;
    onPatchItem(cell.dayKey, cell.item.key, topLoadPatch(cell.item, kg));
  };

  const applyRecipe = (row: ProgressionRow, dayRows: ProgressionRow[], recipe: ProgressionRecipe) => {
    const targets = recipe.scope === "day" ? dayRows : [row];
    for (const target of targets) {
      // Każde ćwiczenie progresuje od własnego ciężaru z pierwszego tygodnia.
      const base =
        target.key === row.key
          ? recipe.baseKg
          : (weeks.map((w) => target.cellsByWeek.get(w)?.topKg).find((kg) => kg != null) ?? null);
      if (base == null) continue;
      const values = generateProgression(recipe.model, {
        baseKg: base,
        weeks: weeks.length,
        incrementKg: recipe.incrementKg,
        blockWeeks: recipe.blockWeeks,
        deloadPercent: recipe.deloadPercent,
      });
      weeks.forEach((week, idx) => {
        const value = values[idx];
        if (value != null) setTopKg(target, week, value);
      });
    }
  };

  return (
    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
      <div className="space-y-7 pb-8 pt-1">
        {[...byDay.entries()].map(([dayOrder, dayRows]) => (
          <section key={dayOrder} className="min-w-0">
            <h2 className="t-heading break-words px-1 text-foreground">{dayRows[0].dayLabel}</h2>

            <div className="mt-2.5 overflow-x-auto overscroll-x-contain">
              <div className="min-w-max">
                <div className="flex items-end gap-2 px-1 pb-1.5">
                  <span className="sticky left-0 w-[11rem] shrink-0 bg-background" />
                  {weeks.map((week) => (
                    <span
                      key={week}
                      className={`t-label w-[5.5rem] shrink-0 text-center ${
                        week === activeWeek ? "text-foreground" : "text-muted-faint"
                      }`}
                    >
                      T{week}
                    </span>
                  ))}
                </div>

                <div className="divide-y divide-border border-y border-border">
                  {dayRows.map((row) => (
                    <div key={row.key} className="px-1 py-2">
                      <div className="flex items-start gap-2">
                        <div className="sticky left-0 z-10 w-[11rem] min-w-0 shrink-0 bg-background pr-2">
                          <p className="truncate text-sm font-medium text-foreground">
                            {splitExerciseName(row.exerciseName).primary}
                          </p>
                          <button
                            type="button"
                            onClick={() =>
                              setGeneratorKey((prev) => (prev === row.key ? null : row.key))
                            }
                            className="text-xs font-medium text-muted-faint transition-colors hover:text-foreground-secondary"
                            title="Zaproponuj progresję ciężaru w tygodniach"
                          >
                            {generatorKey === row.key ? "Zamknij" : "Zaproponuj"}
                          </button>
                        </div>

                        {weeks.map((week, idx) => {
                          const cell = row.cellsByWeek.get(week);
                          const prev = idx > 0 ? row.cellsByWeek.get(weeks[idx - 1]) : undefined;
                          const delta = formatDelta(cell?.topKg ?? null, prev?.topKg ?? null);
                          if (!cell) {
                            return (
                              <div
                                key={week}
                                className="flex h-[var(--h-field)] w-[5.5rem] shrink-0 items-center justify-center rounded-[var(--r-field)] border border-dashed border-border text-xs text-muted-faint"
                                title="Brak tego ćwiczenia w tym tygodniu"
                              >
                                —
                              </div>
                            );
                          }
                          return (
                            <div key={week} className="w-[5.5rem] shrink-0">
                              <NumInput
                                value={cell.topKg}
                                min={0}
                                step={0.5}
                                onChange={(v) => setTopKg(row, week, v)}
                                placeholder="—"
                                className="px-1"
                                aria-label={`Ciężar serii szczytowej, tydzień ${week}`}
                              />
                              <p className="mt-1 text-center font-mono text-[11px] tabular-nums text-muted-faint">
                                {cell.volumeLabel}
                                {delta && delta !== "=" ? (
                                  <span className={delta.startsWith("+") ? "text-success" : "text-danger"}>
                                    {" "}
                                    {delta}
                                  </span>
                                ) : null}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {dayRows.map((row) =>
              generatorKey === row.key ? (
                <GeneratorPanel
                  key={row.key}
                  row={row}
                  weeks={weeks}
                  onApply={(recipe) => applyRecipe(row, dayRows, recipe)}
                  onClose={() => setGeneratorKey(null)}
                />
              ) : null,
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
