"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, Exercise, Plan, PlanInput, PlanItemInput } from "@/lib/api";
import { Button, Card, EmptyState, ErrorBanner, Field, formatRest, inputClass } from "@/components/ui";

type BuilderItem = PlanItemInput & { key: string; exerciseName: string; exerciseType: "reps" | "time" };

function newKey() {
  return Math.random().toString(36).slice(2);
}

export default function PlanBuilder({ plan }: { plan?: Plan }) {
  const router = useRouter();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState(plan?.name ?? "");
  const [description, setDescription] = useState(plan?.description ?? "");
  const [isTemplate, setIsTemplate] = useState(plan?.isTemplate ?? false);
  const [items, setItems] = useState<BuilderItem[]>(
    plan?.items.map((i) => ({
      key: newKey(),
      exerciseId: i.exerciseId,
      exerciseName: i.exerciseName,
      exerciseType: i.exerciseType,
      order: i.order,
      sets: i.overrides.sets,
      reps: i.overrides.reps,
      repDurationSeconds: i.overrides.repDurationSeconds,
      restBetweenSetsSeconds: i.overrides.restBetweenSetsSeconds,
      restAfterExerciseSeconds: i.restAfterExerciseSeconds,
      loadKg: i.overrides.loadKg,
      notes: i.notes,
    })) ?? []
  );
  const [pickerId, setPickerId] = useState<number | "">("");

  useEffect(() => {
    api.exercises
      .list()
      .then(setExercises)
      .catch((e: Error) => setError(e.message));
  }, []);

  const addExercise = () => {
    if (pickerId === "") return;
    const exercise = exercises.find((e) => e.id === pickerId);
    if (!exercise) return;
    setItems((prev) => [
      ...prev,
      {
        key: newKey(),
        exerciseId: exercise.id,
        exerciseName: exercise.name,
        exerciseType: exercise.type,
        order: prev.length + 1,
        sets: null,
        reps: null,
        repDurationSeconds: null,
        restBetweenSetsSeconds: null,
        restAfterExerciseSeconds: 90,
        loadKg: null,
        notes: null,
      },
    ]);
    setPickerId("");
  };

  const updateItem = (key: string, patch: Partial<BuilderItem>) =>
    setItems((prev) => prev.map((i) => (i.key === key ? { ...i, ...patch } : i)));

  const removeItem = (key: string) =>
    setItems((prev) => prev.filter((i) => i.key !== key).map((i, idx) => ({ ...i, order: idx + 1 })));

  const move = (key: string, dir: -1 | 1) =>
    setItems((prev) => {
      const idx = prev.findIndex((i) => i.key === key);
      const target = idx + dir;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[target]] = [next[target], next[idx]];
      return next.map((i, orderIdx) => ({ ...i, order: orderIdx + 1 }));
    });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      setError("Dodaj przynajmniej jedno ćwiczenie do planu.");
      return;
    }
    setSaving(true);
    setError(null);
    const input: PlanInput = {
      name: name.trim(),
      description: description.trim() || null,
      isTemplate,
      items: items.map(({ key: _key, exerciseName: _n, exerciseType: _t, ...rest }) => rest),
    };
    try {
      if (plan) {
        await api.plans.update(plan.id, input);
        router.push(`/plans/${plan.id}`);
      } else {
        const created = await api.plans.create(input);
        router.push(`/plans/${created.id}`);
      }
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
      setSaving(false);
    }
  };

  const defaultsFor = (item: BuilderItem) => exercises.find((e) => e.id === item.exerciseId);

  return (
    <form onSubmit={handleSubmit}>
      <ErrorBanner message={error} />

      <Card className="mb-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Nazwa planu *">
            <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} required />
          </Field>
          <Field label="Opis">
            <input className={inputClass} value={description} onChange={(e) => setDescription(e.target.value)} />
          </Field>
          <Field label="Rodzaj">
            <select className={inputClass} value={isTemplate ? "template" : "plan"} onChange={(e) => setIsTemplate(e.target.value === "template")}>
              <option value="plan">Plan klienta (przypisywalny)</option>
              <option value="template">Szablon (wielokrotnego użytku)</option>
            </select>
          </Field>
        </div>
      </Card>

      <Card className="mb-6">
        <h2 className="mb-4 font-semibold">Ćwiczenia w planie</h2>

        {items.length === 0 ? (
          <EmptyState>Plan jest pusty — dodaj ćwiczenia z biblioteki poniżej.</EmptyState>
        ) : (
          <div className="grid gap-3">
            {items.map((item, idx) => {
              const defaults = defaultsFor(item);
              return (
                <div key={item.key} className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-4">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-yellow-400/15 text-xs font-bold text-yellow-300">
                        {idx + 1}
                      </span>
                      <span className="font-semibold">{item.exerciseName}</span>
                      <span className="text-xs text-zinc-500">{item.exerciseType === "time" ? "czas" : "powtórzenia"}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" onClick={() => move(item.key, -1)}>↑</Button>
                      <Button variant="ghost" onClick={() => move(item.key, 1)}>↓</Button>
                      <Button variant="danger" onClick={() => removeItem(item.key)}>Usuń</Button>
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-6">
                    <Field label={`Serie (dom. ${defaults?.defaultSets ?? "—"})`}>
                      <input
                        className={inputClass}
                        type="number"
                        min={1}
                        placeholder={`${defaults?.defaultSets ?? ""}`}
                        value={item.sets ?? ""}
                        onChange={(e) => updateItem(item.key, { sets: e.target.value === "" ? null : Number(e.target.value) })}
                      />
                    </Field>
                    <Field label={`Powt. (dom. ${defaults?.defaultReps ?? "—"})`}>
                      <input
                        className={inputClass}
                        type="number"
                        min={1}
                        placeholder={`${defaults?.defaultReps ?? ""}`}
                        value={item.reps ?? ""}
                        onChange={(e) => updateItem(item.key, { reps: e.target.value === "" ? null : Number(e.target.value) })}
                      />
                    </Field>
                    {item.exerciseType === "time" && (
                      <Field label={`Czas powt. s (dom. ${defaults?.defaultRepDurationSeconds ?? "—"})`}>
                        <input
                          className={inputClass}
                          type="number"
                          min={5}
                          placeholder={`${defaults?.defaultRepDurationSeconds ?? ""}`}
                          value={item.repDurationSeconds ?? ""}
                          onChange={(e) => updateItem(item.key, { repDurationSeconds: e.target.value === "" ? null : Number(e.target.value) })}
                        />
                      </Field>
                    )}
                    <Field label={`Przerwa między seriami s (dom. ${defaults ? formatRest(defaults.defaultRestBetweenSetsSeconds) : "—"})`}>
                      <input
                        className={inputClass}
                        type="number"
                        min={0}
                        placeholder={`${defaults?.defaultRestBetweenSetsSeconds ?? ""}`}
                        value={item.restBetweenSetsSeconds ?? ""}
                        onChange={(e) => updateItem(item.key, { restBetweenSetsSeconds: e.target.value === "" ? null : Number(e.target.value) })}
                      />
                    </Field>
                    <Field label="Przerwa po ćwiczeniu (s)">
                      <input
                        className={inputClass}
                        type="number"
                        min={0}
                        value={item.restAfterExerciseSeconds ?? 90}
                        onChange={(e) => updateItem(item.key, { restAfterExerciseSeconds: Number(e.target.value) })}
                      />
                    </Field>
                    <Field label={`Obciążenie kg (dom. ${defaults?.defaultLoadKg ?? "—"})`}>
                      <input
                        className={inputClass}
                        type="number"
                        min={0}
                        step={0.5}
                        placeholder={`${defaults?.defaultLoadKg ?? ""}`}
                        value={item.loadKg ?? ""}
                        onChange={(e) => updateItem(item.key, { loadKg: e.target.value === "" ? null : Number(e.target.value) })}
                      />
                    </Field>
                    <div className="sm:col-span-6">
                      <Field label="Notatka dla klienta">
                        <input
                          className={inputClass}
                          value={item.notes ?? ""}
                          onChange={(e) => updateItem(item.key, { notes: e.target.value || null })}
                        />
                      </Field>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-4 flex items-end gap-3">
          <Field label="Dodaj ćwiczenie z biblioteki">
            <select
              className={inputClass}
              value={pickerId}
              onChange={(e) => setPickerId(e.target.value === "" ? "" : Number(e.target.value))}
            >
              <option value="">— wybierz —</option>
              {exercises.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </select>
          </Field>
          <Button variant="ghost" onClick={addExercise} disabled={pickerId === ""}>
            + Dodaj
          </Button>
        </div>
      </Card>

      <Button type="submit" disabled={saving || !name.trim()}>
        {saving ? "Zapisywanie…" : plan ? "Zapisz zmiany" : "Utwórz plan"}
      </Button>
    </form>
  );
}
