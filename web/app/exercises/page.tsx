"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { api, Exercise } from "@/lib/api";
import { Badge, Button, Card, EmptyState, ErrorBanner, Field, formatRest, inputClass, PageHeader } from "@/components/ui";

type FormState = {
  name: string;
  description: string;
  type: "reps" | "time";
  defaultSets: number;
  defaultReps: number;
  defaultRepDurationSeconds: number;
  defaultRestBetweenSetsSeconds: number;
  defaultLoadKg: string;
};

const EMPTY_FORM: FormState = {
  name: "",
  description: "",
  type: "reps",
  defaultSets: 3,
  defaultReps: 10,
  defaultRepDurationSeconds: 30,
  defaultRestBetweenSetsSeconds: 60,
  defaultLoadKg: "",
};

export default function ExercisesPage() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    api.exercises
      .list()
      .then(setExercises)
      .catch((e: Error) => setError(e.message));
  }, []);

  useEffect(load, [load]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const startCreate = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowForm(true);
  };

  const startEdit = (exercise: Exercise) => {
    setForm({
      name: exercise.name,
      description: exercise.description ?? "",
      type: exercise.type,
      defaultSets: exercise.defaultSets,
      defaultReps: exercise.defaultReps,
      defaultRepDurationSeconds: exercise.defaultRepDurationSeconds ?? 30,
      defaultRestBetweenSetsSeconds: exercise.defaultRestBetweenSetsSeconds,
      defaultLoadKg: exercise.defaultLoadKg?.toString() ?? "",
    });
    setEditingId(exercise.id);
    setShowForm(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      type: form.type,
      defaultSets: form.defaultSets,
      defaultReps: form.type === "time" ? Math.max(form.defaultReps, 1) : form.defaultReps,
      defaultRepDurationSeconds: form.type === "time" ? form.defaultRepDurationSeconds : null,
      defaultRestBetweenSetsSeconds: form.defaultRestBetweenSetsSeconds,
      defaultLoadKg: form.defaultLoadKg === "" ? null : Number(form.defaultLoadKg),
    };
    try {
      if (editingId === null) await api.exercises.create(payload);
      else await api.exercises.update(editingId, payload);
      setShowForm(false);
      setForm(EMPTY_FORM);
      setEditingId(null);
      load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (exercise: Exercise) => {
    if (!confirm(`Usunąć ćwiczenie „${exercise.name}”?`)) return;
    try {
      await api.exercises.remove(exercise.id);
      load();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div>
      <PageHeader
        title="Ćwiczenia"
        subtitle="Twoja biblioteka ćwiczeń z domyślnymi parametrami"
        action={<Button onClick={showForm ? () => setShowForm(false) : startCreate}>{showForm ? "Anuluj" : "+ Dodaj ćwiczenie"}</Button>}
      />
      <ErrorBanner message={error} />

      {showForm && (
        <Card className="mb-6">
          <h2 className="mb-4 font-semibold">{editingId === null ? "Nowe ćwiczenie" : "Edycja ćwiczenia"}</h2>
          <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-4">
            <Field label="Nazwa *">
              <input className={inputClass} value={form.name} onChange={(e) => set("name", e.target.value)} required />
            </Field>
            <Field label="Typ">
              <select className={inputClass} value={form.type} onChange={(e) => set("type", e.target.value as "reps" | "time")}>
                <option value="reps">Powtórzenia</option>
                <option value="time">Czas</option>
              </select>
            </Field>
            <Field label="Serie">
              <input className={inputClass} type="number" min={1} value={form.defaultSets} onChange={(e) => set("defaultSets", Number(e.target.value))} />
            </Field>
            <Field label={form.type === "time" ? "Powtórzenia (na serię)" : "Powtórzenia"}>
              <input className={inputClass} type="number" min={1} value={form.defaultReps} onChange={(e) => set("defaultReps", Number(e.target.value))} />
            </Field>
            {form.type === "time" && (
              <Field label="Czas powtórzenia (s)">
                <input className={inputClass} type="number" min={5} value={form.defaultRepDurationSeconds} onChange={(e) => set("defaultRepDurationSeconds", Number(e.target.value))} />
              </Field>
            )}
            <Field label="Przerwa między seriami (s)">
              <input className={inputClass} type="number" min={0} value={form.defaultRestBetweenSetsSeconds} onChange={(e) => set("defaultRestBetweenSetsSeconds", Number(e.target.value))} />
            </Field>
            <Field label="Obciążenie (kg)">
              <input className={inputClass} type="number" min={0} step={0.5} value={form.defaultLoadKg} onChange={(e) => set("defaultLoadKg", e.target.value)} placeholder="brak" />
            </Field>
            <div className="sm:col-span-4">
              <Field label="Opis / wskazówki techniczne">
                <textarea className={inputClass} rows={2} value={form.description} onChange={(e) => set("description", e.target.value)} />
              </Field>
            </div>
            <div className="sm:col-span-4">
              <Button type="submit" disabled={saving}>{saving ? "Zapisywanie…" : "Zapisz ćwiczenie"}</Button>
            </div>
          </form>
        </Card>
      )}

      {exercises.length === 0 ? (
        <EmptyState>Brak ćwiczeń w bibliotece.</EmptyState>
      ) : (
        <div className="grid gap-3">
          {exercises.map((ex) => (
            <Card key={ex.id} className="flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{ex.name}</span>
                  <Badge tone={ex.type === "time" ? "yellow" : "neutral"}>
                    {ex.type === "time" ? "czas" : "powtórzenia"}
                  </Badge>
                </div>
                <p className="mt-0.5 text-xs text-zinc-500">
                  {ex.defaultSets} serie × {ex.defaultReps}
                  {ex.type === "time" && ex.defaultRepDurationSeconds ? ` × ${ex.defaultRepDurationSeconds}s` : " powt."}
                  {" · przerwa "}{formatRest(ex.defaultRestBetweenSetsSeconds)}
                  {ex.defaultLoadKg ? ` · ${ex.defaultLoadKg} kg` : ""}
                  {ex.description ? ` — ${ex.description}` : ""}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Button variant="ghost" onClick={() => startEdit(ex)}>Edytuj</Button>
                <Button variant="danger" onClick={() => handleDelete(ex)}>Usuń</Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
