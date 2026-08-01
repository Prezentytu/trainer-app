"use client";

import { FormEvent, ReactNode, useState } from "react";
import {
  CLIENT_GOALS,
  ClientIntake,
  ClientIntakeInput,
  EXPERIENCE_LEVELS,
  SLEEP_HOURS_OPTIONS,
  WORK_TYPES,
  emptyIntakeInput,
  intakeToInput,
} from "@/lib/api";
import { Button, Card, Field, Pill, inputClass } from "@/components/ui";

function dash(value: string | number | null | undefined): string {
  if (value == null || value === "") return "—";
  return String(value);
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card className="space-y-3" eyebrow="Sekcja" title={title}>
      {children}
    </Card>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-semibold uppercase tracking-caps text-muted-strong">{label}</p>
      <p className="mt-0.5 break-words text-sm text-foreground">{value}</p>
    </div>
  );
}

export function ClientIntakeView({ intake }: { intake: ClientIntake }) {
  return (
    <div className="grid gap-4">
      <Section title="Cel treningowy">
        <div className="grid gap-3 sm:grid-cols-2">
          <Row label="Cel" value={dash(intake.goalType)} />
          <Row label="Szczegóły" value={dash(intake.goalDetails)} />
        </div>
      </Section>

      <Section title="Stan zdrowia">
        <div className="grid gap-3 sm:grid-cols-2">
          <Row label="Kontuzje / operacje" value={dash(intake.injuries)} />
          <Row label="Bóle" value={dash(intake.pains)} />
          <Row label="Choroby przewlekłe" value={dash(intake.chronicConditions)} />
          <Row label="Leki" value={dash(intake.medications)} />
        </div>
      </Section>

      <Section title="Styl życia">
        <div className="grid gap-3 sm:grid-cols-2">
          <Row label="Praca" value={dash(intake.workType)} />
          <Row label="Stres (1–5)" value={dash(intake.stressLevel)} />
          <Row label="Sen" value={dash(intake.sleepHours)} />
          <Row label="Wolny czas" value={dash(intake.freeTimeActivity)} />
        </div>
      </Section>

      <Section title="Doświadczenie">
        <div className="grid gap-3 sm:grid-cols-2">
          <Row label="Poziom" value={dash(intake.experienceLevel)} />
          <Row label="Wcześniejsza aktywność" value={dash(intake.pastActivities)} />
          <div className="sm:col-span-2">
            <Row label="Co przerwało poprzednie programy" value={dash(intake.trainingHistoryNotes)} />
          </div>
        </div>
      </Section>

      <Section title="Organizacja">
        <div className="grid gap-3 sm:grid-cols-2">
          <Row label="Treningi / tydzień" value={dash(intake.sessionsPerWeek)} />
          <Row label="Dostępność" value={dash(intake.availability)} />
          <div className="sm:col-span-2">
            <Row label="Sprzęt" value={dash(intake.equipment)} />
          </div>
        </div>
      </Section>
    </div>
  );
}

export function ClientIntakeForm({
  initial,
  submitLabel = "Zapisz wywiad",
  onSubmit,
  onCancel,
}: {
  initial?: ClientIntake | ClientIntakeInput | null;
  submitLabel?: string;
  onSubmit: (input: ClientIntakeInput) => Promise<void>;
  onCancel?: () => void;
}) {
  const seed =
    initial && "clientId" in initial
      ? intakeToInput(initial as ClientIntake)
      : initial
        ? { ...emptyIntakeInput(), ...initial }
        : emptyIntakeInput();

  const [form, setForm] = useState<ClientIntakeInput>(seed);
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof ClientIntakeInput>(key: K, value: ClientIntakeInput[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const toggleChip = (key: "goalType" | "workType" | "experienceLevel" | "sleepHours", value: string) =>
    set(key, form[key] === value ? null : value);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      await onSubmit({
        ...form,
        goalDetails: form.goalDetails?.trim() || null,
        injuries: form.injuries?.trim() || null,
        pains: form.pains?.trim() || null,
        chronicConditions: form.chronicConditions?.trim() || null,
        medications: form.medications?.trim() || null,
        freeTimeActivity: form.freeTimeActivity?.trim() || null,
        pastActivities: form.pastActivities?.trim() || null,
        trainingHistoryNotes: form.trainingHistoryNotes?.trim() || null,
        availability: form.availability?.trim() || null,
        equipment: form.equipment?.trim() || null,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="grid gap-4">
      <Section title="Cel treningowy">
        <Field label="Cel">
          <div className="flex flex-wrap gap-2">
            {CLIENT_GOALS.map((g) => (
              <Pill key={g} active={form.goalType === g} onClick={() => toggleChip("goalType", g)}>
                {g}
              </Pill>
            ))}
          </div>
        </Field>
        <Field label="Szczegóły celu" hint="np. −8 kg do wakacji">
          <input
            className={inputClass}
            value={form.goalDetails ?? ""}
            onChange={(e) => set("goalDetails", e.target.value || null)}
            placeholder="Mierzalny wynik"
          />
        </Field>
      </Section>

      <Section title="Stan zdrowia">
        <p className="text-sm text-muted">
          Te informacje pomagają ułożyć bezpieczny plan — zostaw puste, jeśli nie dotyczy.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Kontuzje / operacje">
            <textarea
              className={`${inputClass} min-h-[72px]`}
              value={form.injuries ?? ""}
              onChange={(e) => set("injuries", e.target.value || null)}
              placeholder="np. ACL prawe kolano 2022"
            />
          </Field>
          <Field label="Bóle stawów / pleców">
            <textarea
              className={`${inputClass} min-h-[72px]`}
              value={form.pains ?? ""}
              onChange={(e) => set("pains", e.target.value || null)}
            />
          </Field>
          <Field label="Choroby przewlekłe">
            <textarea
              className={`${inputClass} min-h-[72px]`}
              value={form.chronicConditions ?? ""}
              onChange={(e) => set("chronicConditions", e.target.value || null)}
            />
          </Field>
          <Field label="Przyjmowane leki">
            <textarea
              className={`${inputClass} min-h-[72px]`}
              value={form.medications ?? ""}
              onChange={(e) => set("medications", e.target.value || null)}
            />
          </Field>
        </div>
      </Section>

      <Section title="Styl życia">
        <Field label="Rodzaj pracy">
          <div className="flex flex-wrap gap-2">
            {WORK_TYPES.map((w) => (
              <Pill key={w} active={form.workType === w} onClick={() => toggleChip("workType", w)}>
                {w}
              </Pill>
            ))}
          </div>
        </Field>
        <Field label="Poziom stresu" hint="1 = niski, 5 = bardzo wysoki">
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <Pill
                key={n}
                active={form.stressLevel === n}
                onClick={() => set("stressLevel", form.stressLevel === n ? null : n)}
              >
                {n}
              </Pill>
            ))}
          </div>
        </Field>
        <Field label="Sen">
          <div className="flex flex-wrap gap-2">
            {SLEEP_HOURS_OPTIONS.map((s) => (
              <Pill key={s} active={form.sleepHours === s} onClick={() => toggleChip("sleepHours", s)}>
                {s}
              </Pill>
            ))}
          </div>
        </Field>
        <Field label="Wolny czas">
          <input
            className={inputClass}
            value={form.freeTimeActivity ?? ""}
            onChange={(e) => set("freeTimeActivity", e.target.value || null)}
            placeholder="np. spacery, gry, rodzina"
          />
        </Field>
      </Section>

      <Section title="Doświadczenie">
        <Field label="Poziom doświadczenia">
          <div className="flex flex-wrap gap-2">
            {EXPERIENCE_LEVELS.map((lvl) => (
              <Pill
                key={lvl}
                active={form.experienceLevel === lvl}
                onClick={() => toggleChip("experienceLevel", lvl)}
              >
                {lvl}
              </Pill>
            ))}
          </div>
        </Field>
        <Field label="Wcześniejsza aktywność">
          <textarea
            className={`${inputClass} min-h-[72px]`}
            value={form.pastActivities ?? ""}
            onChange={(e) => set("pastActivities", e.target.value || null)}
            placeholder="siłownia, bieganie, sporty…"
          />
        </Field>
        <Field
          label="Co przerwało poprzednie programy"
          hint="Pomaga zaplanować realistyczny rytm"
        >
          <textarea
            className={`${inputClass} min-h-[72px]`}
            value={form.trainingHistoryNotes ?? ""}
            onChange={(e) => set("trainingHistoryNotes", e.target.value || null)}
            placeholder="np. brak czasu, kontuzja, nuda"
          />
        </Field>
      </Section>

      <Section title="Organizacja">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Treningi w tygodniu">
            <div className="flex flex-wrap gap-2">
              {[2, 3, 4, 5, 6].map((n) => (
                <Pill
                  key={n}
                  active={form.sessionsPerWeek === n}
                  onClick={() => set("sessionsPerWeek", form.sessionsPerWeek === n ? null : n)}
                >
                  {n}×
                </Pill>
              ))}
            </div>
          </Field>
          <Field label="Dostępność">
            <input
              className={inputClass}
              value={form.availability ?? ""}
              onChange={(e) => set("availability", e.target.value || null)}
              placeholder="np. pn/śr/pt wieczór"
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Sprzęt">
              <input
                className={inputClass}
                value={form.equipment ?? ""}
                onChange={(e) => set("equipment", e.target.value || null)}
                placeholder="siłownia / dom / kettlebell…"
              />
            </Field>
          </div>
        </div>
      </Section>

      <div className="flex flex-wrap items-center justify-end gap-2">
        {onCancel ? (
          <Button type="button" variant="ghost" onClick={onCancel} disabled={saving}>
            Anuluj
          </Button>
        ) : null}
        <Button type="submit" disabled={saving}>
          {saving ? "Zapisywanie…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
