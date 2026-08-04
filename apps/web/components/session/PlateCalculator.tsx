"use client";

import { useMemo, useState } from "react";
import { Button, Field, inputNumericClass } from "@/components/ui";
import {
  DEFAULT_PLATE_CONFIG,
  formatKg,
  formatPlateList,
  loadPlateConfig,
  savePlateConfig,
  solvePlates,
  type PlateConfig,
} from "@/lib/plates";

type Props = {
  targetKg: number | null;
  onApply: (kg: number) => void;
  onClose: () => void;
};

export function PlateCalculator({ targetKg, onApply, onClose }: Props) {
  const [config, setConfig] = useState<PlateConfig>(() => loadPlateConfig());
  const [editing, setEditing] = useState(false);
  const [barRaw, setBarRaw] = useState(String(config.barKg));
  const [platesRaw, setPlatesRaw] = useState(config.plates.join(", "));

  const target = targetKg ?? 0;
  const solution = useMemo(
    () => solvePlates(target, config.barKg, config.plates),
    [target, config],
  );

  const saveEdit = () => {
    const barKg = Number(barRaw.replace(",", "."));
    const plates = platesRaw
      .split(/[,;\s]+/)
      .map((s) => Number(s.replace(",", ".")))
      .filter((n) => Number.isFinite(n) && n > 0)
      .sort((a, b) => b - a);
    const next: PlateConfig = {
      barKg: Number.isFinite(barKg) && barKg >= 0 ? barKg : DEFAULT_PLATE_CONFIG.barKg,
      plates: plates.length > 0 ? plates : DEFAULT_PLATE_CONFIG.plates,
    };
    setConfig(next);
    savePlateConfig(next);
    setEditing(false);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:p-4">
      <button
        type="button"
        aria-label="Zamknij"
        className="absolute inset-0 bg-[var(--overlay-scrim)]"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal
        aria-labelledby="plates-title"
        className="relative w-full max-w-md rounded-t-[var(--radius-xl)] border border-border bg-surface-sunken p-5 shadow-modal sm:rounded-[var(--radius-xl)]"
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-border-strong sm:hidden" aria-hidden />
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-caps text-muted">Kalkulator</p>
            <h2 id="plates-title" className="mt-0.5 font-display text-lg font-bold">
              Talerze na sztangę
            </h2>
          </div>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-md text-xl text-muted hover:bg-surface-hover hover:text-foreground"
            onClick={onClose}
            aria-label="Zamknij"
          >
            ×
          </button>
        </div>

        <div className="mt-4 rounded-xl border border-border bg-surface px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-caps text-muted">Cel</p>
          <p className="mt-1 font-mono text-2xl font-semibold tabular-nums">
            {target > 0 ? `${formatKg(target)} kg` : "—"}
          </p>
          <p className="mt-3 text-sm text-foreground-secondary">
            Na stronę:{" "}
            <span className="font-medium text-foreground">{formatPlateList(solution.perSide)}</span>
          </p>
          <p className="mt-1 font-mono text-sm tabular-nums text-muted">
            Sztanga {formatKg(config.barKg)} kg → razem {formatKg(solution.achievedKg)} kg
            {solution.shortfallKg > 0
              ? ` (brak ${formatKg(solution.shortfallKg)} kg)`
              : ""}
          </p>
        </div>

        {editing ? (
          <div className="mt-4 space-y-3">
            <Field label="Sztanga (kg)">
              <input
                className={inputNumericClass}
                value={barRaw}
                inputMode="decimal"
                onChange={(e) => setBarRaw(e.target.value)}
              />
            </Field>
            <Field label="Talerze (kg, po przecinku)">
              <input
                className={inputNumericClass}
                value={platesRaw}
                onChange={(e) => setPlatesRaw(e.target.value)}
                placeholder="25, 20, 15, 10, 5, 2.5, 1.25"
              />
            </Field>
            <div className="flex gap-2">
              <Button className="flex-1" onClick={saveEdit}>
                Zapisz sprzęt
              </Button>
              <Button variant="ghost" onClick={() => setEditing(false)}>
                Anuluj
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <Button
              className="flex-1"
              disabled={!(solution.achievedKg > 0)}
              onClick={() => {
                onApply(solution.achievedKg);
                onClose();
              }}
            >
              Ustaw {formatKg(solution.achievedKg)} kg
            </Button>
            <Button variant="secondary" onClick={() => setEditing(true)}>
              Sprzęt
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
