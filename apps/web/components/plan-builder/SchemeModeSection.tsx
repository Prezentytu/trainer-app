"use client";

import { useMemo, useState } from "react";
import { SegmentedControl } from "@/components/ui";
import { compactPrescribedScheme } from "@/lib/schemeSummary";
import { NumInput } from "./NumInput";
import { RangeInput } from "./RangeInput";
import { editorChipOff, editorChipOn } from "./editorChips";
import { IconButton } from "@/components/ui";
import {
  BackoffRow,
  buildRampPrescribedSets,
  formatRampScheme,
  parseRampSchemeInfo,
  readRampBackoffs,
} from "./listGroups";
import { BuilderItem } from "./types";

const RAMP_SHORTCUTS = [6, 4, 2, 1] as const;
const DEFAULT_BACKOFF: BackoffRow = { reps: 5, repsMax: 10, percent: 80 };

/**
 * Przełącznik „Serie × wartość / Rampa”. Przełączenie zmienia tylko sposób edycji —
 * nigdy nie czyści rozpisanych serii, ciężarów ani powtórzeń. Rampa najpierw pokazuje
 * podgląd, a rozpis zastępuje dopiero jawne „Zastosuj rampę”.
 */
export function SchemeModeSection({
  item,
  onPatch,
}: {
  item: BuilderItem;
  onPatch: (patch: Partial<BuilderItem>) => void;
}) {
  const schemeRamp = parseRampSchemeInfo(item.setScheme);
  const [mode, setMode] = useState<"sets" | "ramp">(schemeRamp ? "ramp" : "sets");
  const [targetRm, setTargetRm] = useState(schemeRamp?.targetRm ?? 6);
  const [backoffs, setBackoffs] = useState<BackoffRow[]>(() => readRampBackoffs(item));
  const [customRm, setCustomRm] = useState(
    !RAMP_SHORTCUTS.includes((schemeRamp?.targetRm ?? 6) as (typeof RAMP_SHORTCUTS)[number]),
  );

  const topKg = item.prescribedSets.find((s) => s.role === "top")?.loadKg ?? item.loadKg;

  const preview = useMemo(
    () => buildRampPrescribedSets({ targetRm, topKg, backoffs }),
    [targetRm, topKg, backoffs],
  );
  const previewLine = compactPrescribedScheme(preview) ?? `${preview.length} serii`;
  const currentLine =
    item.prescribedSets.length > 0 ? compactPrescribedScheme(item.prescribedSets) : null;
  const wouldReplace = item.prescribedSets.length > 0;

  const applyRamp = () => {
    onPatch({
      setScheme: formatRampScheme(targetRm, backoffs.length > 0 ? backoffs.map((b) => b.percent) : null),
      prescribedSets: preview,
      sets: preview.length,
      loadKg: topKg,
    });
  };

  return (
    <div className="space-y-2.5">
      <SegmentedControl
        items={[
          { value: "sets", label: "Serie × wartość" },
          { value: "ramp", label: "Rampa" },
        ]}
        value={mode}
        onChange={(v) => {
          const next = v === "ramp" ? "ramp" : "sets";
          setMode(next);
          // Zmieniamy tylko etykietę trybu — dane serii zostają nietknięte.
          if (next === "sets" && schemeRamp) onPatch({ setScheme: null });
        }}
      />

      {mode === "ramp" ? (
        <div className="space-y-2.5">
          <div className="flex min-w-0 flex-wrap items-center gap-1.5">
            <span className="t-label shrink-0 text-muted">do</span>
            {RAMP_SHORTCUTS.map((t) => (
              <button
                key={t}
                type="button"
                className={targetRm === t && !customRm ? editorChipOn : editorChipOff}
                onClick={() => {
                  setCustomRm(false);
                  setTargetRm(t);
                }}
              >
                {t}RM
              </button>
            ))}
            <button
              type="button"
              className={customRm ? editorChipOn : editorChipOff}
              onClick={() => setCustomRm(true)}
            >
              inny…
            </button>
            {customRm ? (
              <div className="w-16">
                <NumInput
                  value={targetRm}
                  min={1}
                  max={15}
                  onChange={(v) => {
                    if (v == null || v < 1) return;
                    setTargetRm(v);
                  }}
                  placeholder="6"
                  aria-label="Cel rampy w powtórzeniach maksymalnych"
                />
              </div>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-1.5 text-sm text-muted">
              Docelowy ciężar
              <span className="w-20">
                <NumInput
                  value={topKg}
                  min={0}
                  step={0.5}
                  onChange={(v) => onPatch({ loadKg: v })}
                  placeholder="—"
                  aria-label="Docelowy ciężar rampy w kilogramach"
                />
              </span>
            </label>
          </div>

          {backoffs.length > 0 ? (
            <div className="space-y-1.5">
              <p className="t-label text-muted">Backoff</p>
              {backoffs.map((row, idx) => (
                <div key={`bo-${idx}`} className="flex flex-wrap items-center gap-1.5">
                  <span className="w-20">
                    <RangeInput
                      reps={row.reps}
                      repsMax={row.repsMax}
                      onChange={(next) =>
                        setBackoffs(
                          backoffs.map((b, i) =>
                            i === idx ? { ...b, reps: next.reps, repsMax: next.repsMax } : b,
                          ),
                        )
                      }
                      placeholder="5-10"
                      aria-label={`Backoff ${idx + 1} — powtórzenia lub zakres`}
                    />
                  </span>
                  <span className="w-16">
                    <NumInput
                      value={row.percent}
                      min={1}
                      max={100}
                      onChange={(v) => {
                        if (v == null) return;
                        setBackoffs(backoffs.map((b, i) => (i === idx ? { ...b, percent: v } : b)));
                      }}
                      placeholder="80"
                      aria-label={`Backoff ${idx + 1} — procent topu`}
                    />
                  </span>
                  <span className="t-label text-muted">% topu</span>
                  <IconButton
                    title="Usuń backoff"
                    size="xs"
                    onClick={() => setBackoffs(backoffs.filter((_, i) => i !== idx))}
                  >
                    ✕
                  </IconButton>
                </div>
              ))}
            </div>
          ) : null}

          <button
            type="button"
            onClick={() => setBackoffs([...backoffs, { ...DEFAULT_BACKOFF }])}
            className="text-sm font-medium text-foreground-secondary transition-colors hover:text-foreground"
          >
            + Backoff
          </button>

          <div className="rounded-[10px] border border-border bg-surface-sunken px-3 py-2.5">
            <p className="t-label text-muted-faint">Podgląd rampy</p>
            <p className="mt-1 font-mono text-[13px] tabular-nums text-foreground">{previewLine}</p>
            {wouldReplace && currentLine ? (
              <p className="mt-1 text-xs text-muted">
                Zastąpi obecny rozpis: {currentLine}. Cofnij przywróci poprzedni stan.
              </p>
            ) : null}
            <button
              type="button"
              onClick={applyRamp}
              className="mt-2 text-sm font-semibold text-foreground transition-colors hover:text-foreground-secondary"
            >
              Zastosuj rampę
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
