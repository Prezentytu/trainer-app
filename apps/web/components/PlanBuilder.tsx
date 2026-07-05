"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  api,
  Exercise,
  ExerciseType,
  EXERCISE_TYPE_LABELS,
  PercentBase,
  PERCENT_BASE_LABELS,
  Plan,
  PlanInput,
  PlanSetInput,
  SET_ROLE_LABELS,
} from "@/lib/api";
import { PLAN_PRESETS } from "@/lib/planPresets";
import { Button, Card, EmptyState, ErrorBanner, Field, inputClass } from "@/components/ui";

type BuilderSet = PlanSetInput & { key: string };

type BuilderItem = {
  key: string;
  exerciseId: number;
  exerciseName: string;
  exerciseType: ExerciseType;
  order: number;
  supersetGroup: number | null;
  sets: number | null;
  reps: number | null;
  repsMax: number | null;
  repDurationSeconds: number | null;
  repDurationSecondsMax: number | null;
  distanceMeters: number | null;
  tempo: string | null;
  targetRpe: number | null;
  setScheme: string | null;
  restBetweenSetsSeconds: number | null;
  restAfterExerciseSeconds: number | null;
  loadKg: number | null;
  notes: string | null;
  prescribedSets: BuilderSet[];
};

type BuilderDay = {
  key: string;
  weekNumber: number;
  order: number;
  label: string;
  notes: string | null;
  items: BuilderItem[];
};

function newKey() {
  return Math.random().toString(36).slice(2);
}

const ROLE_OPTIONS = ["work", "warmup", "ramp", "top", "backoff"];

function NumInput({
  value,
  onChange,
  min,
  step,
  placeholder,
}: {
  value: number | null;
  onChange: (v: number | null) => void;
  min?: number;
  step?: number;
  placeholder?: string;
}) {
  return (
    <input
      className={inputClass}
      type="number"
      min={min}
      step={step}
      placeholder={placeholder}
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
    />
  );
}

export default function PlanBuilder({ plan }: { plan?: Plan }) {
  const router = useRouter();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState(plan?.name ?? "");
  const [description, setDescription] = useState(plan?.description ?? "");
  const [isTemplate, setIsTemplate] = useState(plan?.isTemplate ?? false);

  const [days, setDays] = useState<BuilderDay[]>(() =>
    plan?.days.map((d) => ({
      key: newKey(),
      weekNumber: d.weekNumber,
      order: d.order,
      label: d.label,
      notes: d.notes,
      items: d.items.map((i) => ({
        key: newKey(),
        exerciseId: i.exerciseId,
        exerciseName: i.exerciseName,
        exerciseType: i.exerciseType,
        order: i.order,
        supersetGroup: i.supersetGroup,
        sets: i.overrides.sets,
        reps: i.overrides.reps,
        repsMax: i.overrides.repsMax,
        repDurationSeconds: i.overrides.repDurationSeconds,
        repDurationSecondsMax: i.overrides.repDurationSecondsMax,
        distanceMeters: i.overrides.distanceMeters,
        tempo: i.tempo,
        targetRpe: i.targetRpe,
        setScheme: i.setScheme,
        restBetweenSetsSeconds: i.overrides.restBetweenSetsSeconds,
        restAfterExerciseSeconds: i.restAfterExerciseSeconds,
        loadKg: i.overrides.loadKg,
        notes: i.notes,
        prescribedSets: i.prescribedSets.map((s) => ({
          key: newKey(),
          order: s.order,
          reps: s.reps,
          repsMax: s.repsMax,
          durationSeconds: s.durationSeconds,
          distanceMeters: s.distanceMeters,
          loadKg: s.loadKg,
          loadPercent: s.loadPercent,
          percentOf: s.percentOf,
          targetRpe: s.targetRpe,
          tempo: s.tempo,
          role: s.role,
          note: s.note,
        })),
      })),
    })) ?? [{ key: newKey(), weekNumber: 1, order: 1, label: "Dzień 1", notes: null, items: [] }]
  );

  useEffect(() => {
    api.exercises
      .list()
      .then(setExercises)
      .catch((e: Error) => setError(e.message));
  }, []);

  const weeks = useMemo(() => {
    const set = new Set(days.map((d) => d.weekNumber));
    return [...set].sort((a, b) => a - b);
  }, [days]);
  const maxWeek = weeks.length ? Math.max(...weeks) : 0;

  // --- mutacje dni ---
  const patchDay = (key: string, patch: Partial<BuilderDay>) =>
    setDays((prev) => prev.map((d) => (d.key === key ? { ...d, ...patch } : d)));

  const addDay = (weekNumber: number) =>
    setDays((prev) => {
      const inWeek = prev.filter((d) => d.weekNumber === weekNumber).length;
      return [
        ...prev,
        { key: newKey(), weekNumber, order: inWeek + 1, label: `Dzień ${inWeek + 1}`, notes: null, items: [] },
      ];
    });

  const addWeek = () => addDay(maxWeek + 1 || 1);

  const copyWeek = (weekNumber: number) =>
    setDays((prev) => {
      const target = (prev.length ? Math.max(...prev.map((d) => d.weekNumber)) : 0) + 1;
      const clones = prev
        .filter((d) => d.weekNumber === weekNumber)
        .map((d) => ({
          ...d,
          key: newKey(),
          weekNumber: target,
          items: d.items.map((it) => ({
            ...it,
            key: newKey(),
            prescribedSets: it.prescribedSets.map((s) => ({ ...s, key: newKey() })),
          })),
        }));
      return [...prev, ...clones];
    });

  const removeDay = (key: string) => setDays((prev) => prev.filter((d) => d.key !== key));

  // --- mutacje pozycji ---
  const addItem = (dayKey: string, exerciseId: number) => {
    const exercise = exercises.find((e) => e.id === exerciseId);
    if (!exercise) return;
    setDays((prev) =>
      prev.map((d) =>
        d.key !== dayKey
          ? d
          : {
              ...d,
              items: [
                ...d.items,
                {
                  key: newKey(),
                  exerciseId: exercise.id,
                  exerciseName: exercise.name,
                  exerciseType: exercise.type,
                  order: d.items.length + 1,
                  supersetGroup: null,
                  sets: null,
                  reps: null,
                  repsMax: null,
                  repDurationSeconds: null,
                  repDurationSecondsMax: null,
                  distanceMeters: null,
                  tempo: null,
                  targetRpe: null,
                  setScheme: null,
                  restBetweenSetsSeconds: null,
                  restAfterExerciseSeconds: 90,
                  loadKg: null,
                  notes: null,
                  prescribedSets: [],
                },
              ],
            }
      )
    );
  };

  const patchItem = (dayKey: string, itemKey: string, patch: Partial<BuilderItem>) =>
    setDays((prev) =>
      prev.map((d) =>
        d.key !== dayKey ? d : { ...d, items: d.items.map((i) => (i.key === itemKey ? { ...i, ...patch } : i)) }
      )
    );

  const removeItem = (dayKey: string, itemKey: string) =>
    setDays((prev) =>
      prev.map((d) =>
        d.key !== dayKey
          ? d
          : { ...d, items: d.items.filter((i) => i.key !== itemKey).map((i, idx) => ({ ...i, order: idx + 1 })) }
      )
    );

  const moveItem = (dayKey: string, itemKey: string, dir: -1 | 1) =>
    setDays((prev) =>
      prev.map((d) => {
        if (d.key !== dayKey) return d;
        const idx = d.items.findIndex((i) => i.key === itemKey);
        const target = idx + dir;
        if (target < 0 || target >= d.items.length) return d;
        const items = [...d.items];
        [items[idx], items[target]] = [items[target], items[idx]];
        return { ...d, items: items.map((i, o) => ({ ...i, order: o + 1 })) };
      })
    );

  // --- serie (PlanSet) ---
  const setItemSets = (dayKey: string, itemKey: string, sets: BuilderSet[]) =>
    patchItem(dayKey, itemKey, { prescribedSets: sets });

  const addSet = (dayKey: string, itemKey: string, item: BuilderItem) =>
    setItemSets(dayKey, itemKey, [
      ...item.prescribedSets,
      {
        key: newKey(),
        order: item.prescribedSets.length + 1,
        reps: null,
        repsMax: null,
        durationSeconds: null,
        distanceMeters: null,
        loadKg: null,
        loadPercent: null,
        percentOf: null,
        targetRpe: null,
        tempo: null,
        role: "work",
        note: null,
      },
    ]);

  const patchSet = (dayKey: string, itemKey: string, setKey: string, patch: Partial<BuilderSet>) =>
    setDays((prev) =>
      prev.map((d) =>
        d.key !== dayKey
          ? d
          : {
              ...d,
              items: d.items.map((i) =>
                i.key !== itemKey
                  ? i
                  : { ...i, prescribedSets: i.prescribedSets.map((s) => (s.key === setKey ? { ...s, ...patch } : s)) }
              ),
            }
      )
    );

  const removeSet = (dayKey: string, itemKey: string, setKey: string, item: BuilderItem) =>
    setItemSets(
      dayKey,
      itemKey,
      item.prescribedSets.filter((s) => s.key !== setKey).map((s, idx) => ({ ...s, order: idx + 1 }))
    );

  const applyPreset = (dayKey: string, itemKey: string, presetId: string, weekNumber: number) => {
    const preset = PLAN_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    const sets: BuilderSet[] = preset.build(weekNumber).map((s) => ({ ...s, key: newKey() }));
    patchItem(dayKey, itemKey, { prescribedSets: sets, setScheme: preset.label });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const totalItems = days.reduce((sum, d) => sum + d.items.length, 0);
    if (totalItems === 0) {
      setError("Dodaj przynajmniej jedno ćwiczenie do planu.");
      return;
    }
    setSaving(true);
    setError(null);
    const input: PlanInput = {
      name: name.trim(),
      description: description.trim() || null,
      isTemplate,
      days: days.map((d) => ({
        weekNumber: d.weekNumber,
        order: d.order,
        label: d.label.trim() || `Dzień ${d.order}`,
        notes: d.notes?.trim() || null,
        items: d.items.map((it, idx) => ({
          exerciseId: it.exerciseId,
          order: idx + 1,
          supersetGroup: it.supersetGroup,
          sets: it.sets,
          reps: it.reps,
          repsMax: it.repsMax,
          repDurationSeconds: it.repDurationSeconds,
          repDurationSecondsMax: it.repDurationSecondsMax,
          distanceMeters: it.distanceMeters,
          tempo: it.tempo?.trim() || null,
          targetRpe: it.targetRpe,
          setScheme: it.setScheme?.trim() || null,
          restBetweenSetsSeconds: it.restBetweenSetsSeconds,
          restAfterExerciseSeconds: it.restAfterExerciseSeconds,
          loadKg: it.loadKg,
          notes: it.notes?.trim() || null,
          prescribedSets: it.prescribedSets.map((s, sidx) => ({
            order: sidx + 1,
            reps: s.reps,
            repsMax: s.repsMax,
            durationSeconds: s.durationSeconds,
            distanceMeters: s.distanceMeters,
            loadKg: s.loadKg,
            loadPercent: s.loadPercent,
            percentOf: s.percentOf,
            targetRpe: s.targetRpe,
            tempo: s.tempo?.trim() || null,
            role: s.role,
            note: s.note?.trim() || null,
          })),
        })),
      })),
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

  return (
    <form onSubmit={handleSubmit}>
      <ErrorBanner message={error} />

      <Card className="mb-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Nazwa planu *">
            <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} required />
          </Field>
          <Field label="Rodzaj">
            <select
              className={inputClass}
              value={isTemplate ? "template" : "plan"}
              onChange={(e) => setIsTemplate(e.target.value === "template")}
            >
              <option value="plan">Plan klienta (przypisywalny)</option>
              <option value="template">Szablon (wielokrotnego użytku)</option>
            </select>
          </Field>
          <div className="sm:col-span-3">
            <Field label="Zasady ogólne / opis planu">
              <textarea
                className={inputClass}
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="np. tempo, nawodnienie, zasady progresji…"
              />
            </Field>
          </div>
        </div>
      </Card>

      {weeks.map((week) => (
        <Card key={`week-${week}`} className="mb-6">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h2 className="font-semibold text-yellow-400">Tydzień {week}</h2>
            <div className="flex items-center gap-1">
              <Button variant="ghost" onClick={() => addDay(week)}>+ Dzień</Button>
              <Button variant="ghost" onClick={() => copyWeek(week)}>Kopiuj tydzień</Button>
            </div>
          </div>

          <div className="grid gap-4">
            {days
              .filter((d) => d.weekNumber === week)
              .sort((a, b) => a.order - b.order)
              .map((day) => (
                <div key={day.key} className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-4">
                  <div className="mb-3 grid gap-3 sm:grid-cols-[1fr_2fr_auto] sm:items-end">
                    <Field label="Nazwa dnia">
                      <input
                        className={inputClass}
                        value={day.label}
                        onChange={(e) => patchDay(day.key, { label: e.target.value })}
                        placeholder="np. Poniedziałek / Trening A"
                      />
                    </Field>
                    <Field label="Notatka / rozgrzewka dnia">
                      <input
                        className={inputClass}
                        value={day.notes ?? ""}
                        onChange={(e) => patchDay(day.key, { notes: e.target.value || null })}
                      />
                    </Field>
                    <Button variant="danger" onClick={() => removeDay(day.key)}>Usuń dzień</Button>
                  </div>

                  {day.items.length === 0 ? (
                    <EmptyState>Dzień jest pusty — dodaj ćwiczenia poniżej.</EmptyState>
                  ) : (
                    <div className="grid gap-3">
                      {day.items.map((item, idx) => (
                        <ItemEditor
                          key={item.key}
                          item={item}
                          index={idx}
                          weekNumber={week}
                          onMove={(dir) => moveItem(day.key, item.key, dir)}
                          onRemove={() => removeItem(day.key, item.key)}
                          onPatch={(patch) => patchItem(day.key, item.key, patch)}
                          onAddSet={() => addSet(day.key, item.key, item)}
                          onPatchSet={(setKey, patch) => patchSet(day.key, item.key, setKey, patch)}
                          onRemoveSet={(setKey) => removeSet(day.key, item.key, setKey, item)}
                          onApplyPreset={(presetId) => applyPreset(day.key, item.key, presetId, week)}
                          onClearSets={() => setItemSets(day.key, item.key, [])}
                        />
                      ))}
                    </div>
                  )}

                  <AddExercise exercises={exercises} onAdd={(exId) => addItem(day.key, exId)} />
                </div>
              ))}
          </div>
        </Card>
      ))}

      <div className="mb-6 flex gap-2">
        <Button variant="ghost" onClick={addWeek}>+ Tydzień</Button>
      </div>

      <Button type="submit" disabled={saving || !name.trim()}>
        {saving ? "Zapisywanie…" : plan ? "Zapisz zmiany" : "Utwórz plan"}
      </Button>
    </form>
  );
}

function AddExercise({ exercises, onAdd }: { exercises: Exercise[]; onAdd: (id: number) => void }) {
  const [pickerId, setPickerId] = useState<number | "">("");
  return (
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
      <Button
        variant="ghost"
        onClick={() => {
          if (pickerId !== "") {
            onAdd(pickerId);
            setPickerId("");
          }
        }}
        disabled={pickerId === ""}
      >
        + Dodaj
      </Button>
    </div>
  );
}

function ItemEditor({
  item,
  index,
  weekNumber,
  onMove,
  onRemove,
  onPatch,
  onAddSet,
  onPatchSet,
  onRemoveSet,
  onApplyPreset,
  onClearSets,
}: {
  item: BuilderItem;
  index: number;
  weekNumber: number;
  onMove: (dir: -1 | 1) => void;
  onRemove: () => void;
  onPatch: (patch: Partial<BuilderItem>) => void;
  onAddSet: () => void;
  onPatchSet: (setKey: string, patch: Partial<BuilderSet>) => void;
  onRemoveSet: (setKey: string) => void;
  onApplyPreset: (presetId: string) => void;
  onClearSets: () => void;
}) {
  const advanced = item.prescribedSets.length > 0;
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-yellow-400/15 text-xs font-bold text-yellow-300">
            {index + 1}
          </span>
          <span className="font-semibold">{item.exerciseName}</span>
          <span className="text-xs text-zinc-500">{EXERCISE_TYPE_LABELS[item.exerciseType]}</span>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" onClick={() => onMove(-1)}>↑</Button>
          <Button variant="ghost" onClick={() => onMove(1)}>↓</Button>
          <Button variant="danger" onClick={onRemove}>Usuń</Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-6">
        <Field label="Superseria (grupa)">
          <NumInput value={item.supersetGroup} min={1} onChange={(v) => onPatch({ supersetGroup: v })} placeholder="—" />
        </Field>
        <Field label="Serie">
          <NumInput value={item.sets} min={1} onChange={(v) => onPatch({ sets: v })} placeholder="dom." />
        </Field>
        {item.exerciseType === "time" ? (
          <>
            <Field label="Czas powt. (s)">
              <NumInput value={item.repDurationSeconds} min={1} onChange={(v) => onPatch({ repDurationSeconds: v })} placeholder="dom." />
            </Field>
            <Field label="Czas maks. (s)">
              <NumInput value={item.repDurationSecondsMax} min={1} onChange={(v) => onPatch({ repDurationSecondsMax: v })} placeholder="—" />
            </Field>
          </>
        ) : item.exerciseType === "distance" ? (
          <Field label="Dystans (m)">
            <NumInput value={item.distanceMeters} min={1} onChange={(v) => onPatch({ distanceMeters: v })} placeholder="dom." />
          </Field>
        ) : (
          <>
            <Field label="Powt.">
              <NumInput value={item.reps} min={1} onChange={(v) => onPatch({ reps: v })} placeholder="dom." />
            </Field>
            <Field label="Powt. maks.">
              <NumInput value={item.repsMax} min={1} onChange={(v) => onPatch({ repsMax: v })} placeholder="—" />
            </Field>
          </>
        )}
        <Field label="Ciężar (kg)">
          <NumInput value={item.loadKg} min={0} step={0.5} onChange={(v) => onPatch({ loadKg: v })} placeholder="dom." />
        </Field>
        <Field label="Tempo">
          <input
            className={inputClass}
            value={item.tempo ?? ""}
            onChange={(e) => onPatch({ tempo: e.target.value || null })}
            placeholder="3110"
          />
        </Field>
        <Field label="RPE">
          <NumInput value={item.targetRpe} min={1} step={0.5} onChange={(v) => onPatch({ targetRpe: v })} placeholder="—" />
        </Field>
        <Field label="Przerwa między seriami (s)">
          <NumInput value={item.restBetweenSetsSeconds} min={0} onChange={(v) => onPatch({ restBetweenSetsSeconds: v })} placeholder="dom." />
        </Field>
        <Field label="Przerwa po ćwiczeniu (s)">
          <NumInput value={item.restAfterExerciseSeconds} min={0} onChange={(v) => onPatch({ restAfterExerciseSeconds: v })} placeholder="90" />
        </Field>
        <Field label="Schemat serii (opis)">
          <input
            className={inputClass}
            value={item.setScheme ?? ""}
            onChange={(e) => onPatch({ setScheme: e.target.value || null })}
            placeholder="Rampa 6-4-2-5-3-1"
          />
        </Field>
        <div className="sm:col-span-6">
          <Field label="Notatka dla klienta">
            <input
              className={inputClass}
              value={item.notes ?? ""}
              onChange={(e) => onPatch({ notes: e.target.value || null })}
            />
          </Field>
        </div>
      </div>

      <div className="mt-3 rounded-lg border border-dashed border-zinc-800 p-3">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-zinc-400">Rozpisz serie (opcjonalnie):</span>
          <select
            className={`${inputClass} py-1`}
            value=""
            onChange={(e) => {
              if (e.target.value) onApplyPreset(e.target.value);
            }}
          >
            <option value="">preset…</option>
            {PLAN_PRESETS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
          <Button variant="ghost" onClick={onAddSet}>+ Seria</Button>
          {advanced && <Button variant="ghost" onClick={onClearSets}>Wyczyść serie</Button>}
        </div>

        {advanced && (
          <div className="grid gap-2">
            <div className="grid grid-cols-[auto_1fr_1fr_1fr_1fr_1fr_auto] gap-2 text-[11px] uppercase tracking-wide text-zinc-500">
              <span>#</span>
              <span>Powt.</span>
              <span>Powt. maks.</span>
              <span>%</span>
              <span>Baza %</span>
              <span>Ciężar</span>
              <span></span>
            </div>
            {item.prescribedSets.map((s, sidx) => (
              <div key={s.key} className="grid grid-cols-[auto_1fr_1fr_1fr_1fr_1fr_auto] items-center gap-2">
                <span className="text-xs text-zinc-500">{sidx + 1}</span>
                <NumInput value={s.reps} min={0} onChange={(v) => onPatchSet(s.key, { reps: v })} placeholder="powt." />
                <NumInput value={s.repsMax} min={0} onChange={(v) => onPatchSet(s.key, { repsMax: v })} placeholder="—" />
                <NumInput value={s.loadPercent} min={0} onChange={(v) => onPatchSet(s.key, { loadPercent: v })} placeholder="%" />
                <select
                  className={`${inputClass} py-1`}
                  value={s.percentOf ?? ""}
                  onChange={(e) => onPatchSet(s.key, { percentOf: (e.target.value || null) as PercentBase | null })}
                >
                  <option value="">—</option>
                  {(Object.keys(PERCENT_BASE_LABELS) as PercentBase[]).map((b) => (
                    <option key={b} value={b}>
                      {PERCENT_BASE_LABELS[b]}
                    </option>
                  ))}
                </select>
                <NumInput value={s.loadKg} min={0} step={0.5} onChange={(v) => onPatchSet(s.key, { loadKg: v })} placeholder="kg" />
                <div className="flex items-center gap-1">
                  <select
                    className={`${inputClass} py-1`}
                    value={s.role ?? "work"}
                    onChange={(e) => onPatchSet(s.key, { role: e.target.value })}
                    aria-label="Rola serii"
                  >
                    {ROLE_OPTIONS.map((r) => (
                      <option key={r} value={r}>
                        {SET_ROLE_LABELS[r]}
                      </option>
                    ))}
                  </select>
                  <Button variant="ghost" onClick={() => onRemoveSet(s.key)}>✕</Button>
                </div>
              </div>
            ))}
            <p className="text-[11px] text-zinc-500">
              „% od topu” liczy się względem najcięższej/rampowej serii tej pozycji. Tydzień {weekNumber} presetu 6-4-2-5-3-1
              generuje serie automatycznie.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
