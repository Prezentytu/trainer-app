"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api, ClientRecord } from "@/lib/api";
import { Button, EmptyState, ErrorBanner } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { SearchPicker } from "@/components/SearchPicker";
import { PortalPageSkeleton } from "@/components/skeletons";
import { DEFAULT_PLATE_CONFIG, formatKg, solvePlates } from "@/lib/plates";

type Zone = {
  id: "strength" | "hypertrophy" | "endurance";
  label: string;
  pctFrom: number;
  pctTo: number;
  reps: string;
};

const ZONES: Zone[] = [
  { id: "strength", label: "Siła", pctFrom: 85, pctTo: 100, reps: "1–5 powt." },
  { id: "hypertrophy", label: "Hipertrofia", pctFrom: 67, pctTo: 85, reps: "6–12 powt." },
  { id: "endurance", label: "Wytrzymałość", pctFrom: 50, pctTo: 67, reps: "12+ powt." },
];

function roundToPlate(kg: number): number {
  const { achievedKg } = solvePlates(kg, DEFAULT_PLATE_CONFIG.barKg, DEFAULT_PLATE_CONFIG.plates);
  // Dla obciążeń poniżej sztangi — zaokrąglij do 0,5 kg.
  if (kg < DEFAULT_PLATE_CONFIG.barKg) return Math.round(kg * 2) / 2;
  return achievedKg > 0 ? achievedKg : Math.round(kg * 2) / 2;
}

export default function PortalCalculatorPage() {
  const params = useParams<{ token: string }>();
  const token = params.token;
  const [records, setRecords] = useState<ClientRecord[] | null>(null);
  const [exerciseId, setExerciseId] = useState<number | "">("");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    api.portal
      .records(token)
      .then((rows) => {
        setRecords(rows);
        if (rows.length > 0) setExerciseId(rows[0].exerciseId);
      })
      .catch((e: Error) => setError(e.message));
  }, [token]);

  useEffect(load, [load]);

  const selected = useMemo(
    () => records?.find((r) => r.exerciseId === exerciseId) ?? null,
    [records, exerciseId],
  );

  const rows = useMemo(() => {
    if (!selected) return [];
    const e1 = selected.estimated1Rm;
    return ZONES.map((z) => {
      const from = roundToPlate((e1 * z.pctFrom) / 100);
      const to = roundToPlate((e1 * z.pctTo) / 100);
      return { ...z, from, to };
    });
  }, [selected]);

  return (
    <div className="mx-auto max-w-lg space-y-8 pb-24">
      <header>
        <Link
          href={`/portal/${token}/progress`}
          className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-muted transition-[color,transform] duration-[var(--dur-fast)] hover:text-foreground focus-visible:outline-none focus-visible:shadow-[var(--focus-ring)] active:scale-[0.97]"
        >
          <Icon name="caret-left" size={16} decorative />
          Progres
        </Link>
        <p className="t-label mt-2 text-muted">Narzędzia</p>
        <h1 className="t-title mt-2">Kalkulator %1RM</h1>
        <p className="t-small mt-1">
          Strefy obciążenia z Twojego szacowanego maxu — zaokrąglone do realnych talerzy.
        </p>
      </header>

      <ErrorBanner message={error} />

      {!records ? (
        <PortalPageSkeleton label="Wczytuję rekordy…" />
      ) : records.length === 0 ? (
        <EmptyState
          title="Najpierw zalicz serie z ciężarem"
          action={
            <Link href={`/portal/${token}`}>
              <Button size="sm">Rozpocznij trening</Button>
            </Link>
          }
        >
          Po sesjach z kg zobaczysz tu strefy %1RM per ćwiczenie.
        </EmptyState>
      ) : (
        <>
          <div>
            <p className="font-mono text-xs font-medium uppercase tracking-caps text-muted">
              Ćwiczenie
            </p>
            <div className="mt-2">
              <SearchPicker
                ariaLabel="Ćwiczenie"
                searchPlaceholder="Szukaj ćwiczenia…"
                emptyHint="Brak ćwiczenia o tej nazwie."
                value={exerciseId === "" ? "" : String(exerciseId)}
                onChange={(v) => setExerciseId(Number(v))}
                items={records.map((r) => ({
                  value: String(r.exerciseId),
                  label: r.exerciseName,
                  meta: `${formatKg(r.estimated1Rm)} kg`,
                }))}
              />
            </div>
          </div>

          {selected ? (
            <section aria-label="Strefy">
              <p className="mb-3 font-mono text-sm tabular-nums text-muted">
                Est. 1RM:{" "}
                <span className="font-semibold text-foreground">
                  {formatKg(selected.estimated1Rm)} kg
                </span>
              </p>
              <ul className="divide-y divide-border border-y border-border">
                {rows.map((z) => (
                  <li key={z.id} className="flex min-h-16 items-baseline justify-between gap-3 py-4">
                    <div className="min-w-0">
                      <p className="text-[15px] font-medium text-foreground">{z.label}</p>
                      <p className="mt-0.5 text-xs text-muted">
                        {z.pctFrom}–{z.pctTo}% · {z.reps}
                      </p>
                    </div>
                    <p className="shrink-0 font-mono text-lg font-semibold tabular-nums text-foreground">
                      {formatKg(z.from)}–{formatKg(z.to)}
                      <span className="ml-1 text-sm font-medium text-muted">kg</span>
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </>
      )}
    </div>
  );
}
