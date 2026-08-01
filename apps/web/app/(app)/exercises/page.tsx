"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  api,
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  EQUIPMENT_LABELS,
  Exercise,
  ExerciseCategory,
  ExerciseType,
  EXERCISE_TYPE_LABELS,
  PATTERN_LABELS,
  ExercisePattern,
} from "@/lib/api";
import { ExerciseThumb } from "@/components/ExerciseThumb";
import { YoutubeExternalLink, YoutubeLite } from "@/components/YoutubeLite";
import {
  Badge,
  Button,
  Dialog,
  EmptyState,
  ErrorBanner,
  Field,
  formatRest,
  inputClass,
  PageHeader,
  Pill,
  SegmentedControl,
  Tag,
  useUndoToast,
} from "@/components/ui";
import { ExerciseListSkeleton } from "@/components/skeletons";

type FormState = {
  name: string;
  description: string;
  type: ExerciseType;
  defaultSets: number;
  defaultReps: number;
  defaultRepDurationSeconds: number;
  defaultDistanceMeters: number;
  defaultRestBetweenSetsSeconds: number;
  defaultLoadKg: string;
  category: string;
  pattern: string;
  isUnilateral: boolean;
  equipment: string;
  primaryMuscles: string;
  instructions: string;
  youtubeId: string;
};

const EMPTY_FORM: FormState = {
  name: "",
  description: "",
  type: "reps",
  defaultSets: 3,
  defaultReps: 10,
  defaultRepDurationSeconds: 30,
  defaultDistanceMeters: 20,
  defaultRestBetweenSetsSeconds: 60,
  defaultLoadKg: "",
  category: "",
  pattern: "",
  isUnilateral: false,
  equipment: "",
  primaryMuscles: "",
  instructions: "",
  youtubeId: "",
};

function volumeLabel(exercise: Exercise): string {
  if (exercise.type === "time") {
    const dur = exercise.defaultRepDurationSeconds ? `${exercise.defaultRepDurationSeconds}s` : "—";
    return `${exercise.defaultSets}×${dur}`;
  }
  if (exercise.type === "distance") {
    const dist = exercise.defaultDistanceMeters ? `${exercise.defaultDistanceMeters} m` : "—";
    return `${exercise.defaultSets}×${dist}`;
  }
  return `${exercise.defaultSets}×${exercise.defaultReps}`;
}

function primaryMedia(ex: Exercise) {
  return ex.media?.find((m) => m.kind === "demo") ?? ex.media?.[0] ?? null;
}

function formFromExercise(exercise: Exercise): FormState {
  return {
    name: exercise.name,
    description: exercise.description ?? "",
    type: exercise.type,
    defaultSets: exercise.defaultSets,
    defaultReps: exercise.defaultReps,
    defaultRepDurationSeconds: exercise.defaultRepDurationSeconds ?? 30,
    defaultDistanceMeters: exercise.defaultDistanceMeters ?? 20,
    defaultRestBetweenSetsSeconds: exercise.defaultRestBetweenSetsSeconds,
    defaultLoadKg: exercise.defaultLoadKg?.toString() ?? "",
    category: exercise.category ?? "",
    pattern: exercise.pattern ?? "",
    isUnilateral: exercise.isUnilateral,
    equipment: (exercise.equipment ?? []).join(", "),
    primaryMuscles: (exercise.primaryMuscles ?? []).join(", "),
    instructions: exercise.instructions ?? "",
    youtubeId: primaryMedia(exercise)?.youtubeId ?? "",
  };
}

function payloadFromForm(form: FormState): Omit<Exercise, "id"> {
  const equipment = form.equipment
    .split(/[,;]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const primaryMuscles = form.primaryMuscles
    .split(/[,;]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const yt = form.youtubeId.trim();
  return {
    name: form.name.trim(),
    description: form.description.trim() || null,
    type: form.type,
    defaultSets: form.defaultSets,
    defaultReps: form.type === "time" ? Math.max(form.defaultReps, 1) : form.defaultReps,
    defaultRepDurationSeconds: form.type === "time" ? form.defaultRepDurationSeconds : null,
    defaultDistanceMeters: form.type === "distance" ? form.defaultDistanceMeters : null,
    defaultRestBetweenSetsSeconds: form.defaultRestBetweenSetsSeconds,
    defaultLoadKg: form.defaultLoadKg === "" ? null : Number(form.defaultLoadKg),
    category: form.category || null,
    pattern: form.pattern || null,
    isUnilateral: form.isUnilateral,
    equipment,
    primaryMuscles,
    instructions: form.instructions.trim() || null,
    media: yt
      ? [{ youtubeId: yt, title: form.name.trim() || yt, seconds: null, kind: "demo" }]
      : [],
  };
}

export default function ExercisesPage() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<ExerciseCategory | "all">("all");
  const [equipment, setEquipment] = useState<string | "all">("all");
  const [pattern, setPattern] = useState<string | "all">("all");
  const [onlyVideo, setOnlyVideo] = useState(false);
  const [unilateralOnly, setUnilateralOnly] = useState(false);
  const [typeFilter, setTypeFilter] = useState<ExerciseType | "all">("all");
  const [moreFilters, setMoreFilters] = useState(false);
  const [preview, setPreview] = useState<Exercise | null>(null);
  const [loading, setLoading] = useState(true);
  const { showUndoToast, toastNode } = useUndoToast();

  const load = useCallback(() => {
    api.exercises
      .list()
      .then(setExercises)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const startCreate = (prefillName = "") => {
    setForm({ ...EMPTY_FORM, name: prefillName });
    setEditingId(null);
    setShowForm(true);
  };

  const startEdit = (exercise: Exercise) => {
    setForm(formFromExercise(exercise));
    setEditingId(exercise.id);
    setShowForm(true);
  };

  const handleSubmit = async (e?: FormEvent) => {
    e?.preventDefault();
    if (!form.name.trim()) {
      setError("Podaj nazwę ćwiczenia.");
      return;
    }
    setSaving(true);
    setError(null);
    const payload = payloadFromForm(form);
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

  const handleDelete = async (removed: Exercise) => {
    setExercises((list) => list.filter((e) => e.id !== removed.id));
    try {
      await api.exercises.remove(removed.id);
      showUndoToast(`Usunięto „${removed.name}”`, () => {
        void api.exercises
          .create({
            name: removed.name,
            description: removed.description,
            type: removed.type,
            defaultSets: removed.defaultSets,
            defaultReps: removed.defaultReps,
            defaultRepDurationSeconds: removed.defaultRepDurationSeconds,
            defaultDistanceMeters: removed.defaultDistanceMeters,
            defaultRestBetweenSetsSeconds: removed.defaultRestBetweenSetsSeconds,
            defaultLoadKg: removed.defaultLoadKg,
            category: removed.category,
            pattern: removed.pattern,
            isUnilateral: removed.isUnilateral,
            equipment: removed.equipment ?? [],
            primaryMuscles: removed.primaryMuscles ?? [],
            instructions: removed.instructions,
            media: removed.media ?? [],
          })
          .then(load)
          .catch((err: Error) => setError(err.message));
      });
    } catch (err) {
      setError((err as Error).message);
      load();
    }
  };

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: exercises.length };
    for (const c of CATEGORY_ORDER) counts[c] = 0;
    for (const ex of exercises) {
      if (ex.category && ex.category in counts) counts[ex.category] += 1;
    }
    return counts;
  }, [exercises]);

  const equipmentOptions = useMemo(() => {
    const map = new Map<string, number>();
    for (const ex of exercises) {
      for (const eq of ex.equipment ?? []) {
        map.set(eq, (map.get(eq) ?? 0) + 1);
      }
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  }, [exercises]);

  const patternOptions = useMemo(() => {
    const map = new Map<string, number>();
    for (const ex of exercises) {
      if (ex.pattern) map.set(ex.pattern, (map.get(ex.pattern) ?? 0) + 1);
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [exercises]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return exercises.filter((ex) => {
      if (q && !ex.name.toLowerCase().includes(q)) return false;
      if (category !== "all" && ex.category !== category) return false;
      if (equipment !== "all" && !(ex.equipment ?? []).includes(equipment)) return false;
      if (pattern !== "all" && ex.pattern !== pattern) return false;
      if (typeFilter !== "all" && ex.type !== typeFilter) return false;
      if (onlyVideo && !(ex.media?.length > 0)) return false;
      if (unilateralOnly && !ex.isUnilateral) return false;
      return true;
    });
  }, [exercises, query, category, equipment, pattern, typeFilter, onlyVideo, unilateralOnly]);

  const withVideo = exercises.filter((e) => e.media?.length > 0).length;
  const categoriesUsed = CATEGORY_ORDER.filter((c) => (categoryCounts[c] ?? 0) > 0).length;
  const previewMedia = preview ? primaryMedia(preview) : null;
  const hasActiveFilters =
    category !== "all" ||
    equipment !== "all" ||
    pattern !== "all" ||
    typeFilter !== "all" ||
    onlyVideo ||
    unilateralOnly ||
    query.trim().length > 0;

  const clearFilters = () => {
    setQuery("");
    setCategory("all");
    setEquipment("all");
    setPattern("all");
    setTypeFilter("all");
    setOnlyVideo(false);
    setUnilateralOnly(false);
  };

  return (
    <div>
      <PageHeader
        title="Ćwiczenia"
        subtitle={`${exercises.length} ćwiczeń w ${categoriesUsed} partiach · ${withVideo} z filmem`}
        action={
          <Button onClick={() => (showForm ? setShowForm(false) : startCreate())}>
            {showForm ? "Anuluj" : "+ Nowe ćwiczenie"}
          </Button>
        }
      />
      <ErrorBanner message={error} />

      <div className="sticky top-0 z-20 -mx-1 mb-4 space-y-3 bg-background/95 px-1 py-3 backdrop-blur-sm">
        <input
          className={inputClass}
          placeholder="Szukaj po nazwie polskiej lub angielskiej…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
        <div className="flex flex-wrap gap-2">
          <Pill active={category === "all"} onClick={() => setCategory("all")}>
            Wszystkie · {categoryCounts.all}
          </Pill>
          {CATEGORY_ORDER.filter((c) => (categoryCounts[c] ?? 0) > 0).map((c) => (
            <Pill key={c} active={category === c} onClick={() => setCategory(c)}>
              {CATEGORY_LABELS[c]} · {categoryCounts[c]}
            </Pill>
          ))}
        </div>
        {equipmentOptions.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            <Pill active={equipment === "all"} onClick={() => setEquipment("all")}>
              Sprzęt: wszystkie
            </Pill>
            {equipmentOptions.slice(0, 10).map(([eq, count]) => (
              <Pill key={eq} active={equipment === eq} onClick={() => setEquipment(eq)}>
                {EQUIPMENT_LABELS[eq] ?? eq} · {count}
              </Pill>
            ))}
          </div>
        ) : null}
        <div>
          <button
            type="button"
            className="text-sm font-medium text-accent hover:text-accent-strong"
            onClick={() => setMoreFilters((v) => !v)}
          >
            {moreFilters ? "Mniej filtrów" : "Więcej filtrów"}
          </button>
          {moreFilters ? (
            <div className="mt-2 flex flex-wrap gap-2">
              <Pill active={pattern === "all"} onClick={() => setPattern("all")}>
                Wzorzec: wszystkie
              </Pill>
              {patternOptions.map(([p, count]) => (
                <Pill key={p} active={pattern === p} onClick={() => setPattern(p)}>
                  {PATTERN_LABELS[p as ExercisePattern] ?? p} · {count}
                </Pill>
              ))}
              <Pill active={onlyVideo} onClick={() => setOnlyVideo((v) => !v)}>
                Tylko z filmem
              </Pill>
              <Pill active={unilateralOnly} onClick={() => setUnilateralOnly((v) => !v)}>
                Jednostronne
              </Pill>
              {(Object.keys(EXERCISE_TYPE_LABELS) as ExerciseType[]).map((t) => (
                <Pill key={t} active={typeFilter === t} onClick={() => setTypeFilter(typeFilter === t ? "all" : t)}>
                  {EXERCISE_TYPE_LABELS[t]}
                </Pill>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      {loading ? (
        <ExerciseListSkeleton />
      ) : exercises.length === 0 ? (
        <EmptyState
          title="Biblioteka jest pusta"
          action={<Button onClick={() => startCreate()}>+ Dodaj pierwsze ćwiczenie</Button>}
        >
          Dodaj własne ćwiczenie albo poczekaj na seed wspólnej biblioteki.
        </EmptyState>
      ) : filtered.length === 0 ? (
        <EmptyState
          title="Brak ćwiczeń dla filtrów"
          action={
            <div className="flex flex-wrap justify-center gap-2">
              {hasActiveFilters ? (
                <Button variant="secondary" onClick={clearFilters}>
                  Wyczyść filtry
                </Button>
              ) : null}
              {query.trim() ? (
                <Button onClick={() => startCreate(query.trim())}>
                  Utwórz ćwiczenie „{query.trim()}”
                </Button>
              ) : (
                <Button onClick={() => startCreate()}>+ Nowe ćwiczenie</Button>
              )}
            </div>
          }
        >
          Zmień filtry albo utwórz ćwiczenie o tej nazwie.
        </EmptyState>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((ex) => {
            const media = primaryMedia(ex);
            const cat =
              ex.category && ex.category in CATEGORY_LABELS
                ? CATEGORY_LABELS[ex.category as ExerciseCategory]
                : null;
            const eqLabel = (ex.equipment ?? [])
              .slice(0, 2)
              .map((e) => EQUIPMENT_LABELS[e] ?? e)
              .join(" · ");
            return (
              <div
                key={ex.id}
                className="flex flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-card transition-colors hover:border-border-strong"
              >
                <button
                  type="button"
                  className="block w-full text-left"
                  onClick={() => (media ? setPreview(ex) : undefined)}
                  disabled={!media}
                  aria-label={media ? `Podgląd wideo: ${ex.name}` : ex.name}
                >
                  <ExerciseThumb
                    youtubeId={media?.youtubeId}
                    category={ex.category}
                    alt={ex.name}
                    seconds={media?.seconds}
                    showPlay={Boolean(media)}
                    className="rounded-none"
                  />
                </button>
                <div className="flex flex-1 flex-col gap-2 p-3">
                  <div className="min-w-0">
                    <Link
                      href={`/exercises/${ex.id}`}
                      className="break-words text-sm font-medium text-foreground hover:text-accent"
                    >
                      {ex.name}
                    </Link>
                    <p className="mt-1 text-xs text-muted">
                      {[cat, eqLabel].filter(Boolean).join(" · ") || EXERCISE_TYPE_LABELS[ex.type]}
                      {ex.isUnilateral ? " · 1-str." : ""}
                    </p>
                  </div>
                  <div className="mt-auto flex items-center justify-between gap-2">
                    <p className="font-mono text-xs font-semibold tabular-nums text-foreground">
                      {volumeLabel(ex)}
                      <span className="mx-1.5 text-muted-faint">·</span>
                      {formatRest(ex.defaultRestBetweenSetsSeconds)}
                      {ex.media?.length ? (
                        <>
                          <span className="mx-1.5 text-muted-faint">·</span>
                          {ex.media.length} ▶
                        </>
                      ) : null}
                    </p>
                    <div className="flex shrink-0 gap-1">
                      <Button variant="ghost" size="sm" onClick={() => startEdit(ex)}>
                        Edytuj
                      </Button>
                      <Button variant="danger" size="md" onClick={() => void handleDelete(ex)}>
                        Usuń
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog
        open={showForm}
        title={editingId === null ? "Nowe ćwiczenie" : "Edycja ćwiczenia"}
        confirmLabel={
          saving ? "Zapisywanie…" : editingId === null ? "Dodaj ćwiczenie" : "Zapisz ćwiczenie"
        }
        onConfirm={() => void handleSubmit()}
        onCancel={() => {
          setShowForm(false);
          setEditingId(null);
        }}
      >
        <form
          id="exercise-form"
          onSubmit={(e) => void handleSubmit(e)}
          className="grid max-h-[60vh] gap-3 overflow-y-auto sm:grid-cols-2"
        >
          <div className="sm:col-span-2">
            <Field label="Nazwa *">
              <input
                className={inputClass}
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                required
              />
            </Field>
          </div>
          <Field label="Typ">
            <SegmentedControl
              full
              items={[
                { value: "reps", label: EXERCISE_TYPE_LABELS.reps },
                { value: "time", label: EXERCISE_TYPE_LABELS.time },
                { value: "distance", label: EXERCISE_TYPE_LABELS.distance },
              ]}
              value={form.type}
              onChange={(v) => set("type", v as ExerciseType)}
            />
          </Field>
          <Field label="Partia">
            <select className={inputClass} value={form.category} onChange={(e) => set("category", e.target.value)}>
              <option value="">—</option>
              {CATEGORY_ORDER.map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_LABELS[c]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Serie">
            <input
              className={inputClass}
              type="number"
              inputMode="numeric"
              min={1}
              value={form.defaultSets}
              onChange={(e) => set("defaultSets", Number(e.target.value))}
            />
          </Field>
          <Field label={form.type === "time" ? "Powtórzenia (na serię)" : "Powtórzenia"}>
            <input
              className={inputClass}
              type="number"
              inputMode="numeric"
              min={1}
              value={form.defaultReps}
              onChange={(e) => set("defaultReps", Number(e.target.value))}
            />
          </Field>
          {form.type === "time" ? (
            <Field label="Czas powtórzenia (s)">
              <input
                className={inputClass}
                type="number"
                inputMode="numeric"
                min={5}
                value={form.defaultRepDurationSeconds}
                onChange={(e) => set("defaultRepDurationSeconds", Number(e.target.value))}
              />
            </Field>
          ) : null}
          {form.type === "distance" ? (
            <Field label="Dystans (m)">
              <input
                className={inputClass}
                type="number"
                inputMode="decimal"
                min={1}
                value={form.defaultDistanceMeters}
                onChange={(e) => set("defaultDistanceMeters", Number(e.target.value))}
              />
            </Field>
          ) : null}
          <Field label="Przerwa (s)">
            <input
              className={inputClass}
              type="number"
              inputMode="numeric"
              min={0}
              value={form.defaultRestBetweenSetsSeconds}
              onChange={(e) => set("defaultRestBetweenSetsSeconds", Number(e.target.value))}
            />
          </Field>
          <Field label="Obciążenie (kg)">
            <input
              className={inputClass}
              type="number"
              inputMode="decimal"
              min={0}
              step={0.5}
              value={form.defaultLoadKg}
              onChange={(e) => set("defaultLoadKg", e.target.value)}
              placeholder="brak"
            />
          </Field>
          <Field
            label="YouTube ID (opcjonalnie)"
            hint="ID z URL YouTube — film demo w karcie ćwiczenia"
          >
            <input
              className={inputClass}
              value={form.youtubeId}
              onChange={(e) => set("youtubeId", e.target.value)}
              placeholder="np. 1fwmBAKzW4g"
            />
          </Field>
          <Field label="Sprzęt (po przecinku)">
            <input
              className={inputClass}
              value={form.equipment}
              onChange={(e) => set("equipment", e.target.value)}
              placeholder="sztanga, hantle"
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Opis / wskazówki">
              <textarea
                className={inputClass}
                rows={2}
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
              />
            </Field>
          </div>
        </form>
      </Dialog>

      {preview && previewMedia ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Zamknij"
            className="absolute inset-0 bg-[var(--overlay-scrim)]"
            onClick={() => setPreview(null)}
          />
          <div className="relative w-full max-w-2xl rounded-2xl border border-border bg-surface p-4 shadow-modal sm:p-5">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="break-words font-display text-lg font-semibold">{preview.name}</h2>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {preview.category && preview.category in CATEGORY_LABELS ? (
                    <Badge tone="accent">
                      {CATEGORY_LABELS[preview.category as ExerciseCategory]}
                    </Badge>
                  ) : null}
                  <Tag>{EXERCISE_TYPE_LABELS[preview.type]}</Tag>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setPreview(null)}>
                Zamknij
              </Button>
            </div>
            <YoutubeLite
              youtubeId={previewMedia.youtubeId}
              title={previewMedia.title || preview.name}
              seconds={previewMedia.seconds}
              category={preview.category}
              autoplay
            />
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <YoutubeExternalLink youtubeId={previewMedia.youtubeId} />
              <Link
                href={`/exercises/${preview.id}`}
                className="text-sm font-medium text-accent hover:text-accent-strong"
              >
                Pełne szczegóły →
              </Link>
            </div>
          </div>
        </div>
      ) : null}

      {toastNode}
    </div>
  );
}
