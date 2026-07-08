"use client";

import { useMemo, useState } from "react";
import PlanBuilder from "@/components/plan-builder/PlanBuilder";
import { Button, Card, Field, PageHeader, Pill, inputClass } from "@/components/ui";

type StructurePreset = {
  id: string;
  label: string;
  weeks: number;
  daysPerWeek: number;
};

// Preset "6×4" jest domyślnie zaznaczony — najczęstszy układ mezocyklu u naszych trenerów, zgodny
// z przykładem ze specu ("T1–T6, 4 dni/tydz."). Happy path do kreatora to jeden klik, nie pusty formularz.
const STRUCTURE_PRESETS: StructurePreset[] = [
  { id: "4x3", label: "4 tygodnie", weeks: 4, daysPerWeek: 3 },
  { id: "6x4", label: "6 tygodni", weeks: 6, daysPerWeek: 4 },
  { id: "8x5", label: "8 tygodni", weeks: 8, daysPerWeek: 5 },
  { id: "1x1", label: "Zacznij od jednego dnia", weeks: 1, daysPerWeek: 1 },
];

function todayLabel(): string {
  return new Date().toLocaleDateString("pl-PL", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function NewPlanPage() {
  const [started, setStarted] = useState(false);
  const [isTemplate, setIsTemplate] = useState(false);
  const [presetId, setPresetId] = useState<string>("6x4");
  const [name, setName] = useState(`Nowy plan — ${todayLabel()}`);

  const preset = STRUCTURE_PRESETS.find((p) => p.id === presetId) ?? STRUCTURE_PRESETS[1];

  const structurePreview = useMemo(() => {
    const weeksLabel = preset.weeks === 1 ? "T1" : `T1–${preset.weeks}`;
    return `${weeksLabel}, ${preset.daysPerWeek} ${preset.daysPerWeek === 1 ? "dzień" : "dni"}/tydz.`;
  }, [preset]);

  if (started) {
    return (
      <div>
        <PageHeader title={name || "Nowy plan"} subtitle="Krok 2 z 3 · zbuduj plan ćwiczeniami" />
        <PlanBuilder
          initialName={name}
          initialIsTemplate={isTemplate}
          initialDayCount={preset.daysPerWeek}
          initialWeekCount={preset.weeks}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Nowy plan" subtitle="Wybierz strukturę — poprawisz ją później w kreatorze" />

      <div className="mb-6 flex items-center gap-2" aria-label="Krok 1 z 3 · struktura wybrana">
        <div className="h-1.5 flex-1 rounded-full bg-accent" />
        <div className="h-1.5 flex-1 rounded-full bg-surface-hover" />
        <div className="h-1.5 flex-1 rounded-full bg-surface-hover" />
      </div>
      <p className="mb-6 text-xs font-medium uppercase tracking-wide text-muted">Krok 1 z 3 · struktura wybrana</p>

      <Card className="mb-4">
        <p className="mb-2 text-sm font-semibold text-foreground">Rodzaj</p>
        <div className="inline-flex flex-wrap items-center gap-1 rounded-full bg-surface-hover p-1">
          <Pill active={!isTemplate} onClick={() => setIsTemplate(false)}>
            Plan klienta
          </Pill>
          <Pill active={isTemplate} onClick={() => setIsTemplate(true)}>
            Szablon (wielokrotnego użytku)
          </Pill>
        </div>
      </Card>

      <Card className="mb-4">
        <p className="mb-3 text-sm font-semibold text-foreground">Struktura</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {STRUCTURE_PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPresetId(p.id)}
              className={`rounded-lg border p-3 text-left transition-colors ${
                p.id === presetId
                  ? "border-accent bg-accent/10"
                  : "border-border bg-surface/60 hover:border-border-strong hover:bg-surface-hover"
              }`}
            >
              <p className="text-sm font-semibold text-foreground">{p.label}</p>
              <p className="text-xs text-muted">
                {p.daysPerWeek} {p.daysPerWeek === 1 ? "dzień" : "dni"}/tydz.
              </p>
            </button>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted-strong">
          Podgląd struktury: <span className="font-medium text-foreground-secondary">{structurePreview}</span> — dni i
          tygodnie dodasz lub usuniesz w każdej chwili w kreatorze.
        </p>
      </Card>

      <Card className="mb-6">
        <Field label="Nazwa planu">
          <input className={`${inputClass} w-full`} value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
      </Card>

      <Button onClick={() => setStarted(true)} disabled={!name.trim()}>
        Przejdź do kreatora →
      </Button>
    </div>
  );
}
