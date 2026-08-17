"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import PlanBuilder from "@/components/plan-builder/PlanBuilder";
import { api } from "@/lib/api";
import { readImportHandoff, PlanImportHandoff } from "@/lib/planImportHandoff";
import { Button, Card, ErrorBanner, Field, PageHeader, Pill, inputClass } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { PlanWizardSkeleton } from "@/components/skeletons";

type StructurePreset = {
  id: string;
  label: string;
  weeks: number;
  daysPerWeek: number;
};

// Preset "4×3" jest domyślnie zaznaczony — mniejszy canvas na pierwszy plan (nie 24 puste dni).
const STRUCTURE_PRESETS: StructurePreset[] = [
  { id: "4x3", label: "4 tygodnie", weeks: 4, daysPerWeek: 3 },
  { id: "6x4", label: "6 tygodni", weeks: 6, daysPerWeek: 4 },
  { id: "8x5", label: "8 tygodni", weeks: 8, daysPerWeek: 5 },
  { id: "1x1", label: "Zacznij od jednego dnia", weeks: 1, daysPerWeek: 1 },
];

function todayLabel(): string {
  return new Date().toLocaleDateString("pl-PL", { day: "2-digit", month: "2-digit", year: "numeric" });
}

/** Etykieta pod liczbą treningów w podglądzie — bez liczby, sama odmiana. */
function trainingDaysLabel(n: number): string {
  if (n === 1) return "dzień treningowy";
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "dni treningowe";
  return "dni treningowych";
}

type Boot =
  | { status: "loading" }
  | { status: "wizard" }
  | { status: "import"; handoff: PlanImportHandoff };

type AssignTo = { id: number; name: string };

function NewPlanWizard({ assignTo }: { assignTo: AssignTo | null }) {
  const [boot, setBoot] = useState<Boot>({ status: "loading" });
  const [isTemplate, setIsTemplate] = useState(false);
  const [presetId, setPresetId] = useState<string>("4x3");
  const [firstPlan, setFirstPlan] = useState(false);
  const [name, setName] = useState(() =>
    assignTo ? `Plan — ${assignTo.name} — ${todayLabel()}` : `Nowy plan — ${todayLabel()}`,
  );
  const [started, setStarted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void api.plans
      .list()
      .then((plans) => {
        if (!cancelled) setFirstPlan(plans.length === 0);
      })
      .catch(() => {
        /* zostaw pełną listę presetów */
      });
    queueMicrotask(() => {
      if (cancelled) return;
      const handoff = readImportHandoff();
      if (handoff && handoff.days.length > 0) {
        setBoot({ status: "import", handoff });
      } else {
        setBoot({ status: "wizard" });
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const visiblePresets = firstPlan
    ? STRUCTURE_PRESETS.filter((p) => p.id === "4x3")
    : STRUCTURE_PRESETS;
  const preset = visiblePresets.find((p) => p.id === presetId) ?? visiblePresets[0] ?? STRUCTURE_PRESETS[0];

  if (boot.status === "loading") {
    return <PlanWizardSkeleton />;
  }

  if (boot.status === "import") {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <PlanBuilder
          initialName={boot.handoff.name}
          initialDescription={boot.handoff.description}
          initialIsTemplate={boot.handoff.isTemplate}
          initialDays={boot.handoff.days}
          stepLabel="Import AI · sprawdź i zapisz plan"
          assignTo={assignTo ?? undefined}
        />
      </div>
    );
  }

  if (started) {
    const firstName = assignTo?.name.split(/\s+/)[0] ?? null;
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <PlanBuilder
          initialName={name}
          initialIsTemplate={assignTo ? false : isTemplate}
          initialDayCount={preset.daysPerWeek}
          initialWeekCount={preset.weeks}
          stepLabel={
            firstName
              ? `Krok 2 z 2 · plan dla ${firstName}`
              : "Krok 2 z 2 · zbuduj plan ćwiczeniami"
          }
          assignTo={assignTo ?? undefined}
        />
      </div>
    );
  }

  const startBuilder = () => {
    if (!name.trim()) {
      setError("Podaj nazwę planu.");
      return;
    }
    setError(null);
    setStarted(true);
  };

  const totalTrainingDays = preset.weeks * preset.daysPerWeek;
  const firstName = assignTo?.name.split(/\s+/)[0] ?? null;

  return (
    <div>
      <PageHeader
        title="Nowy plan"
        subtitle={
          firstName
            ? `Plan dla ${assignTo!.name} — po zapisie wrócisz na profil klienta`
            : "Wybierz strukturę — poprawisz ją później w kreatorze"
        }
      />
      <ErrorBanner message={error} />

      {firstName ? (
        <p className="mb-4 inline-flex items-center rounded-full border border-border bg-surface-raised px-2.5 py-1 font-mono text-xs font-medium uppercase tracking-[var(--track-label)] text-foreground">
          Plan dla: {firstName}
        </p>
      ) : null}

      <div className="mb-6 flex items-center gap-2" aria-hidden>
        <div className="h-1.5 flex-1 rounded-full bg-accent" />
        <div className="h-1.5 flex-1 rounded-full bg-surface-hover" />
      </div>
      <p className="t-label mb-6">Krok 1 z 2 · struktura wybrana</p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          startBuilder();
        }}
      >
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="min-w-0 space-y-4">
            <Card>
              <p className="t-label mb-3">Struktura</p>
              <div className="grid gap-2 sm:grid-cols-2" role="group" aria-label="Struktura planu">
                {visiblePresets.map((p) => {
                  const selected = p.id === presetId;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPresetId(p.id)}
                      aria-pressed={selected}
                      className={`flex items-start justify-between gap-2 rounded-[10px] border p-4 text-left transition-colors duration-[var(--dur-fast)] ${
                        selected
                          ? "border-foreground bg-surface-raised"
                          : "border-border bg-surface hover:border-border-strong hover:bg-surface-hover"
                      }`}
                    >
                      <span className="min-w-0">
                        <p className="text-[15px] font-semibold text-foreground">{p.label}</p>
                        <p className="mt-0.5 font-mono text-xs tabular-nums text-muted">
                          {p.daysPerWeek} {p.daysPerWeek === 1 ? "dzień" : "dni"}/tydz.
                        </p>
                      </span>
                      {selected ? (
                        <Icon name="check-circle" size={16} className="mt-0.5 shrink-0 text-foreground" decorative />
                      ) : null}
                    </button>
                  );
                })}
              </div>
              <p className="mt-3 text-xs text-muted-strong lg:hidden">
                Dni i tygodnie dodasz lub usuniesz w każdej chwili w kreatorze.
              </p>
            </Card>

            <Card>
              <div
                className={`grid gap-4 ${
                  assignTo || firstPlan ? "" : "sm:grid-cols-[auto_minmax(0,1fr)] sm:items-end"
                }`}
              >
                {assignTo || firstPlan ? null : (
                  <div>
                    <p className="t-label mb-1.5">Rodzaj</p>
                    <div className="inline-flex flex-wrap items-center gap-1 rounded-full bg-surface-hover p-1">
                      <Pill active={!isTemplate} onClick={() => setIsTemplate(false)}>
                        Plan klienta
                      </Pill>
                      <Pill active={isTemplate} onClick={() => setIsTemplate(true)}>
                        Do wielokrotnego użytku
                      </Pill>
                    </div>
                  </div>
                )}
                <Field label="Nazwa planu">
                  <input className={`${inputClass} w-full`} value={name} onChange={(e) => setName(e.target.value)} />
                </Field>
              </div>
            </Card>
          </div>

          <Card className="hidden lg:flex lg:flex-col">
            <p className="t-label mb-4">Podgląd</p>
            <p className="t-num text-[28px] leading-none text-foreground">{totalTrainingDays}</p>
            <p className="t-label mt-1.5">{trainingDaysLabel(totalTrainingDays)}</p>
            <div className="mt-5 space-y-1.5" aria-hidden>
              {Array.from({ length: preset.weeks }).map((_, w) => (
                <div key={w} className="flex items-center gap-2.5">
                  <span className="w-[72px] shrink-0 text-xs tabular-nums text-muted">Tydzień {w + 1}</span>
                  <span className="flex gap-1">
                    {Array.from({ length: preset.daysPerWeek }).map((_, d) => (
                      <span key={d} className="h-4 w-4 rounded-[4px] border border-border bg-surface-raised" />
                    ))}
                  </span>
                </div>
              ))}
            </div>
            <p className="mt-auto pt-5 text-xs text-muted-strong">
              Dni i tygodnie dodasz lub usuniesz w każdej chwili w kreatorze.
            </p>
          </Card>
        </div>

        <div className="mt-6 flex sm:justify-end">
          <Button type="submit" disabled={!name.trim()} className="w-full sm:w-auto">
            Przejdź do kreatora →
          </Button>
        </div>
      </form>
    </div>
  );
}

function resolveAssignClientId(rawClientId: string | null): number | null {
  const fromUrl = rawClientId ? Number(rawClientId) : NaN;
  if (Number.isFinite(fromUrl) && fromUrl > 0) return fromUrl;
  const fromHandoff = readImportHandoff()?.clientId;
  return fromHandoff != null && fromHandoff > 0 ? fromHandoff : null;
}

function NewPlanPageInner() {
  const searchParams = useSearchParams();
  const rawClientId = searchParams.get("clientId");
  const wantedClientId = resolveAssignClientId(rawClientId);

  const [assignTo, setAssignTo] = useState<AssignTo | null>(null);
  const [ready, setReady] = useState(wantedClientId == null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (wantedClientId == null) return;
    let cancelled = false;
    api.clients
      .get(wantedClientId)
      .then((c) => {
        if (cancelled) return;
        setAssignTo({ id: c.id, name: c.name });
        setReady(true);
      })
      .catch((e: Error) => {
        if (cancelled) return;
        setError(e.message);
        setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [wantedClientId]);

  if (!ready) {
    return <PlanWizardSkeleton />;
  }

  if (error && wantedClientId != null && !assignTo) {
    return (
      <div>
        <PageHeader title="Nowy plan" subtitle="Nie udało się wczytać klienta" />
        <ErrorBanner message={error} />
        <Link href="/plans/new">
          <Button variant="secondary">Kontynuuj bez klienta</Button>
        </Link>
      </div>
    );
  }

  return <NewPlanWizard assignTo={assignTo} />;
}

export default function NewPlanPage() {
  return (
    <Suspense fallback={<PlanWizardSkeleton />}>
      <NewPlanPageInner />
    </Suspense>
  );
}
