"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api, ClientMeasurement } from "@/lib/api";
import { Button, ErrorBanner, Field, inputClass, inputNumericClass } from "@/components/ui";
import { WeightTrendSparkline } from "@/components/WeightTrendSparkline";
import { formatKg } from "@/lib/plates";

function formatDay(iso: string): string {
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("pl-PL", { day: "numeric", month: "short", year: "numeric" });
}

function todayIso(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function PortalMeasurementsPage() {
  const params = useParams<{ token: string }>();
  const token = params.token;
  const [rows, setRows] = useState<ClientMeasurement[] | null>(null);
  const [goalWeightKg, setGoalWeightKg] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [weight, setWeight] = useState("");
  const [waist, setWaist] = useState("");
  const [note, setNote] = useState("");

  const load = useCallback(() => {
    Promise.all([api.portal.measurements(token), api.portal.home(token)])
      .then(([m, home]) => {
        setRows(m);
        setGoalWeightKg(home.client.goalWeightKg ?? null);
      })
      .catch((e: Error) => setError(e.message));
  }, [token]);

  useEffect(load, [load]);

  const weightTrend = useMemo(() => {
    if (!rows) return [];
    return [...rows]
      .filter((r) => r.weightKg != null)
      .sort((a, b) => a.measuredOn.localeCompare(b.measuredOn) || a.id - b.id)
      .map((r) => ({ date: r.measuredOn, value: r.weightKg as number }));
  }, [rows]);

  const latestWeight = weightTrend.length > 0 ? weightTrend[weightTrend.length - 1].value : null;
  const goalDelta =
    goalWeightKg != null && latestWeight != null
      ? Math.round((goalWeightKg - latestWeight) * 10) / 10
      : null;

  const add = async () => {
    setSaving(true);
    setError(null);
    try {
      await api.portal.addMeasurement(token, {
        measuredOn: todayIso(),
        weightKg: weight.trim() ? Number(weight.replace(",", ".")) : null,
        waistCm: waist.trim() ? Number(waist.replace(",", ".")) : null,
        chestCm: null,
        hipsCm: null,
        note: note.trim() || null,
      });
      setWeight("");
      setWaist("");
      setNote("");
      load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 pb-8">
      <header>
        <Link
          href={`/portal/${token}/profile`}
          className="text-[13px] font-semibold text-muted hover:text-accent"
        >
          ‹ Profil
        </Link>
        <h1 className="mt-1 font-display text-3xl font-bold">Pomiary</h1>
        <p className="mt-0.5 text-[13px] text-muted">Waga i obwody — trener je widzi w Twoim profilu.</p>
      </header>
      <ErrorBanner message={error} />

      <div className="space-y-3 rounded-2xl border border-border bg-surface p-4 shadow-card">
        <Field label="Waga (kg)">
          <input
            className={inputNumericClass}
            inputMode="decimal"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="np. 78,5"
          />
        </Field>
        <Field label="Talia (cm)">
          <input
            className={inputNumericClass}
            inputMode="decimal"
            value={waist}
            onChange={(e) => setWaist(e.target.value)}
            placeholder="opcjonalnie"
          />
        </Field>
        <Field label="Notatka">
          <input
            className={inputClass}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="opcjonalnie"
          />
        </Field>
        <Button
          disabled={saving || (!weight.trim() && !waist.trim())}
          onClick={() => void add()}
        >
          {saving ? "Zapis…" : "Dodaj pomiar"}
        </Button>
      </div>

      {!rows ? (
        <p className="text-sm text-muted">Ładowanie…</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted">Brak pomiarów — dodaj pierwszy powyżej.</p>
      ) : (
        <>
          {goalWeightKg != null ? (
            <section aria-label="Cel wagi" className="border-y border-border py-4">
              <p className="font-mono text-xs font-medium uppercase tracking-caps text-muted">
                Cel wagi
              </p>
              <p className="mt-2 font-mono text-lg font-semibold tabular-nums text-foreground">
                Cel: {formatKg(goalWeightKg)} kg
                {goalDelta != null ? (
                  <>
                    {" · "}
                    <span className={goalDelta === 0 ? "text-muted" : goalDelta < 0 ? "text-gain" : "text-loss"}>
                      {goalDelta === 0
                        ? "na celu"
                        : goalDelta < 0
                          ? `zostało ${formatKg(Math.abs(goalDelta))} kg`
                          : `+${formatKg(goalDelta)} kg do celu`}
                    </span>
                  </>
                ) : null}
              </p>
            </section>
          ) : null}
          {weightTrend.length >= 2 ? (
            <section aria-label="Trend wagi" className="border-y border-border py-4">
              <p className="mb-3 font-mono text-xs font-medium uppercase tracking-caps text-muted">
                Trend wagi
              </p>
              <WeightTrendSparkline points={weightTrend} />
            </section>
          ) : null}
          <ul className="space-y-2">
            {rows.map((r) => (
              <li
                key={r.id}
                className="rounded-2xl border border-border bg-surface px-4 py-3 shadow-card"
              >
                <p className="font-mono text-[13px] tabular-nums text-muted">{formatDay(r.measuredOn)}</p>
                <p className="mt-1 font-mono text-[15px] tabular-nums">
                  {r.weightKg != null ? `${r.weightKg} kg` : "—"}
                  {r.waistCm != null ? ` · talia ${r.waistCm} cm` : ""}
                </p>
                {r.note ? <p className="mt-1 text-[13px] text-muted">{r.note}</p> : null}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
