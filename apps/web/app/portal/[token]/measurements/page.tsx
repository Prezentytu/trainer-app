"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api, ClientMeasurement } from "@/lib/api";
import {
  Button,
  EmptyState,
  ErrorBanner,
  Field,
  inputClass,
  inputNumericClass,
  ListRow,
} from "@/components/ui";
import { PortalPageSkeleton } from "@/components/skeletons";
import { PortalBackLink } from "@/components/portal/PortalBackLink";
import { WeightTrendSparkline } from "@/components/WeightTrendSparkline";
import { formatKg } from "@/lib/plates";
import { ProgressPhotoGallery } from "@/components/ProgressPhotoGallery";

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
    <div className="mx-auto max-w-lg space-y-8 pb-24">
      <header>
        <PortalBackLink href={`/portal/${token}/profile`}>Profil</PortalBackLink>
        <h1 className="t-title mt-2">Pomiary</h1>
        <p className="t-small mt-1">Waga, obwody i zdjęcia sylwetki — trener to widzi w Twoim profilu.</p>
      </header>
      <ErrorBanner message={error} />

      <div className="space-y-3 rounded-[var(--r-card)] border border-border bg-surface p-4">
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
        <PortalPageSkeleton label="Wczytuję pomiary…" />
      ) : rows.length === 0 ? (
        <EmptyState
          title="Zacznij od pierwszego pomiaru"
          action={
            <Link href={`/portal/${token}`}>
              <Button variant="secondary" size="sm">
                Wróć do treningów
              </Button>
            </Link>
          }
        >
          Zapisz wagę lub obwód powyżej — zobaczysz trend i postęp do celu.
        </EmptyState>
      ) : (
        <>
          {goalWeightKg != null ? (
            <section aria-label="Cel wagi" className="border-y border-border py-5">
              <p className="t-label text-muted">Cel wagi</p>
              <p className="t-num mt-2 text-lg text-foreground">
                Cel: {formatKg(goalWeightKg)} kg
                {goalDelta != null ? (
                  <>
                    {" · "}
                    <span className={goalDelta === 0 ? "text-muted" : goalDelta < 0 ? "text-gain" : "text-loss"}>
                      {goalDelta === 0
                        ? "na celu"
                        : goalDelta < 0
                          ? `▲ zostało ${formatKg(Math.abs(goalDelta))} kg`
                          : `▼ +${formatKg(goalDelta)} kg do celu`}
                    </span>
                  </>
                ) : null}
              </p>
            </section>
          ) : null}
          {weightTrend.length >= 2 ? (
            <section aria-label="Trend wagi" className="border-y border-border py-5">
              <p className="t-label mb-3 text-muted">Trend wagi</p>
              <WeightTrendSparkline points={weightTrend} />
            </section>
          ) : null}
          <div className="divide-y divide-border border-y border-border">
            {rows.map((r) => (
              <ListRow
                key={r.id}
                title={
                  <span className="t-num text-[15px] font-semibold">
                    {r.weightKg != null ? `${r.weightKg} kg` : "—"}
                    {r.waistCm != null ? ` · talia ${r.waistCm} cm` : ""}
                  </span>
                }
                sub={
                  <>
                    {formatDay(r.measuredOn)}
                    {r.note ? ` · ${r.note}` : ""}
                  </>
                }
              />
            ))}
          </div>
        </>
      )}

      <section className="space-y-3">
        <h2 className="t-heading m-0">Zdjęcia</h2>
        <ProgressPhotoGallery mode="portal" token={token} onError={setError} />
      </section>
    </div>
  );
}
