"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pencil, Search, SlidersHorizontal, Trash2, X } from "lucide-react";
import {
  api,
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  Exercise,
  ExerciseCategory,
  ExerciseType,
  EXERCISE_TYPE_LABELS,
} from "@/lib/api";
import {
  advancedFilterCount,
  equipmentLabel,
  facetCounts,
  filterExercisesLibrary,
  hasActiveFilters,
  patternLabel,
  polishExerciseCount,
  polishPartCount,
  typeLabel,
  type ExerciseFilters,
} from "@/lib/exerciseSearch";
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
  IconButton,
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

const EMPTY_FILTERS: ExerciseFilters = {
  query: "",
  category: "all",
  equipment: "all",
  pattern: "all",
  typeFilter: "all",
  onlyVideo: false,
  unilateralOnly: false,
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
  const [filters, setFilters] = useState<ExerciseFilters>(EMPTY_FILTERS);
  const [moreFilters, setMoreFilters] = useState(false);
  const [preview, setPreview] = useState<Exercise | null>(null);
  const [loading, setLoading] = useState(true);
  const searchRef = useRef<HTMLInputElement>(null);
  const { showUndoToast, toastNode } = useUndoToast();

  const load = useCallback(() => {
    api.exercises
      .list()
      .then(setExercises)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if ((e.target as HTMLElement | null)?.isContentEditable) return;
      e.preventDefault();
      searchRef.current?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const setFilter = <K extends keyof ExerciseFilters>(key: K, value: ExerciseFilters[K]) =>
    setFilters((f) => ({ ...f, [key]: value }));

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

  const facets = useMemo(() => facetCounts(exercises, filters), [exercises, filters]);
  const filtered = useMemo(() => filterExercisesLibrary(exercises, filters), [exercises, filters]);

  const withVideo = exercises.filter((e) => e.media?.length > 0).length;
  const categoriesUsedTotal = CATEGORY_ORDER.filter((c) => exercises.some((e) => e.category === c)).length;
  const previewMedia = preview ? primaryMedia(preview) : null;
  const filtersActive = hasActiveFilters(filters);
  const advancedCount = advancedFilterCount(filters);

  const clearFilters = () => setFilters(EMPTY_FILTERS);

  const subtitle = filtersActive
    ? `Pokazuję ${filtered.length} z ${exercises.length}`
    : `${polishExerciseCount(exercises.length)} · ${polishPartCount(categoriesUsedTotal)} · ${withVideo} z filmem`;

  return (
    <div>
      <PageHeader
        title="Ćwiczenia"
        subtitle={subtitle}
        action={<Button onClick={() => startCreate()}>+ Nowe ćwiczenie</Button>}
      />
      <ErrorBanner message={error} />

      <div className="mb-4 space-y-3 md:sticky md:top-0 md:z-20 md:-mx-1 md:bg-background/95 md:px-1 md:py-3 md:backdrop-blur-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative min-w-0 flex-1">
            <Search
              aria-hidden
              className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-faint"
              strokeWidth={1.75}
            />
            <input
              ref={searchRef}
              type="search"
              className={`${inputClass} pl-9 pr-9`}
              placeholder="Szukaj po nazwie, sprzęcie, mięśniu…"
              value={filters.query}
              onChange={(e) => setFilter("query", e.target.value)}
              aria-label="Szukaj ćwiczenia"
            />
            {filters.query ? (
              <button
                type="button"
                aria-label="Wyczyść wyszukiwanie"
                className="absolute top-1/2 right-2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-muted hover:bg-surface-hover hover:text-foreground"
                onClick={() => setFilter("query", "")}
              >
                <X className="h-4 w-4" strokeWidth={1.75} />
              </button>
            ) : null}
          </div>
          <Button
            variant="secondary"
            onClick={() => setMoreFilters((v) => !v)}
            aria-expanded={moreFilters}
            className="shrink-0"
          >
            <SlidersHorizontal className="h-4 w-4" strokeWidth={1.75} aria-hidden />
            {advancedCount > 0 ? `Filtry · ${advancedCount}` : "Filtry"}
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          <Pill quiet active={filters.category === "all"} onClick={() => setFilter("category", "all")}>
            Wszystkie · {facets.category.all}
          </Pill>
          {CATEGORY_ORDER.filter((c) => (facets.category[c] ?? 0) > 0 || filters.category === c).map((c) => (
            <Pill
              key={c}
              quiet
              active={filters.category === c}
              onClick={() => setFilter("category", c)}
            >
              {CATEGORY_LABELS[c]} · {facets.category[c] ?? 0}
            </Pill>
          ))}
        </div>

        {moreFilters ? (
          <div className="space-y-3 rounded-xl border border-border bg-surface-raised p-3 sm:p-4">
            {facets.equipment.length > 0 || filters.equipment !== "all" ? (
              <div>
                <p className="mb-2 font-mono text-xs font-medium uppercase tracking-caps text-muted">Sprzęt</p>
                <div className="flex flex-wrap gap-2">
                  <Pill quiet active={filters.equipment === "all"} onClick={() => setFilter("equipment", "all")}>
                    Wszystkie
                  </Pill>
                  {facets.equipment
                    .filter(([eq, count]) => count > 0 || filters.equipment === eq)
                    .map(([eq, count]) => (
                      <Pill
                        key={eq}
                        quiet
                        active={filters.equipment === eq}
                        onClick={() => setFilter("equipment", eq)}
                      >
                        {equipmentLabel(eq)} · {count}
                      </Pill>
                    ))}
                </div>
              </div>
            ) : null}

            {facets.pattern.length > 0 || filters.pattern !== "all" ? (
              <div>
                <p className="mb-2 font-mono text-xs font-medium uppercase tracking-caps text-muted">Wzorzec ruchu</p>
                <div className="flex flex-wrap gap-2">
                  <Pill quiet active={filters.pattern === "all"} onClick={() => setFilter("pattern", "all")}>
                    Wszystkie
                  </Pill>
                  {facets.pattern
                    .filter(([p, count]) => count > 0 || filters.pattern === p)
                    .map(([p, count]) => (
                      <Pill
                        key={p}
                        quiet
                        active={filters.pattern === p}
                        onClick={() => setFilter("pattern", p)}
                      >
                        {patternLabel(p)} · {count}
                      </Pill>
                    ))}
                </div>
              </div>
            ) : null}

            <div>
              <p className="mb-2 font-mono text-xs font-medium uppercase tracking-caps text-muted">Typ</p>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(EXERCISE_TYPE_LABELS) as ExerciseType[]).map((t) => (
                  <Pill
                    key={t}
                    quiet
                    active={filters.typeFilter === t}
                    onClick={() => setFilter("typeFilter", filters.typeFilter === t ? "all" : t)}
                  >
                    {typeLabel(t)}
                    {facets.type[t] > 0 ? ` · ${facets.type[t]}` : ""}
                  </Pill>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 font-mono text-xs font-medium uppercase tracking-caps text-muted">Opcje</p>
              <div className="flex flex-wrap gap-2">
                <Pill quiet active={filters.onlyVideo} onClick={() => setFilter("onlyVideo", !filters.onlyVideo)}>
                  Tylko z filmem · {facets.withVideo}
                </Pill>
                <Pill
                  quiet
                  active={filters.unilateralOnly}
                  onClick={() => setFilter("unilateralOnly", !filters.unilateralOnly)}
                >
                  Jednostronne · {facets.unilateral}
                </Pill>
              </div>
            </div>
          </div>
        ) : null}

        {filtersActive ? (
          <div className="flex flex-wrap items-center gap-2">
            {filters.query.trim() ? (
              <Tag onRemove={() => setFilter("query", "")}>„{filters.query.trim()}”</Tag>
            ) : null}
            {filters.category !== "all" ? (
              <Tag onRemove={() => setFilter("category", "all")}>
                {CATEGORY_LABELS[filters.category]}
              </Tag>
            ) : null}
            {filters.equipment !== "all" ? (
              <Tag onRemove={() => setFilter("equipment", "all")}>{equipmentLabel(filters.equipment)}</Tag>
            ) : null}
            {filters.pattern !== "all" ? (
              <Tag onRemove={() => setFilter("pattern", "all")}>{patternLabel(filters.pattern)}</Tag>
            ) : null}
            {filters.typeFilter !== "all" ? (
              <Tag onRemove={() => setFilter("typeFilter", "all")}>{typeLabel(filters.typeFilter)}</Tag>
            ) : null}
            {filters.onlyVideo ? <Tag onRemove={() => setFilter("onlyVideo", false)}>Z filmem</Tag> : null}
            {filters.unilateralOnly ? (
              <Tag onRemove={() => setFilter("unilateralOnly", false)}>Jednostronne</Tag>
            ) : null}
            <button
              type="button"
              className="text-sm font-medium text-accent-text hover:text-accent-strong"
              onClick={clearFilters}
            >
              Wyczyść
            </button>
          </div>
        ) : null}
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
              {filtersActive ? (
                <Button variant="secondary" onClick={clearFilters}>
                  Wyczyść filtry
                </Button>
              ) : null}
              {filters.query.trim() ? (
                <Button onClick={() => startCreate(filters.query.trim())}>
                  Utwórz ćwiczenie „{filters.query.trim()}”
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
              .map((e) => equipmentLabel(e))
              .join(" · ");
            return (
              <div
                key={ex.id}
                className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-card transition-colors duration-[var(--dur-fast)] hover:bg-surface-hover"
              >
                <Link
                  href={`/exercises/${ex.id}`}
                  className="absolute inset-0 z-0"
                  aria-label={ex.name}
                />
                {media ? (
                  <button
                    type="button"
                    className="relative z-10 block w-full text-left focus-visible:outline-none focus-visible:shadow-[var(--glow-accent)]"
                    onClick={() => setPreview(ex)}
                    aria-label={`Podgląd wideo: ${ex.name}`}
                  >
                    <ExerciseThumb
                      youtubeId={media.youtubeId}
                      category={ex.category}
                      alt={ex.name}
                      seconds={media.seconds}
                      play="hover"
                      className="rounded-none"
                    />
                  </button>
                ) : (
                  <div className="relative z-0">
                    <ExerciseThumb
                      youtubeId={null}
                      category={ex.category}
                      alt={ex.name}
                      play="none"
                      className="rounded-none"
                    />
                  </div>
                )}
                <div className="relative z-10 flex flex-1 flex-col gap-2 p-3 pointer-events-none">
                  <div className="min-w-0">
                    <p className="min-h-[2.5rem] break-words text-sm font-medium text-foreground">
                      {ex.name}
                    </p>
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
                    </p>
                    <div className="flex shrink-0 gap-0.5 opacity-100 transition-opacity duration-[var(--dur-fast)] pointer-events-auto md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100">
                      <IconButton
                        title="Edytuj"
                        size="sm"
                        onClick={() => startEdit(ex)}
                      >
                        <Pencil className="h-4 w-4" strokeWidth={1.4} />
                      </IconButton>
                      <IconButton
                        title="Usuń"
                        variant="danger"
                        size="sm"
                        onClick={() => void handleDelete(ex)}
                      >
                        <Trash2 className="h-4 w-4" strokeWidth={1.4} />
                      </IconButton>
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

      <Dialog
        open={Boolean(preview && previewMedia)}
        title={preview?.name ?? "Podgląd wideo"}
        onCancel={() => setPreview(null)}
        footer={null}
        className="max-w-2xl"
      >
        {preview && previewMedia ? (
          <>
            <div className="mb-3 flex flex-wrap gap-1.5">
              {preview.category && preview.category in CATEGORY_LABELS ? (
                <Badge tone="accent">
                  {CATEGORY_LABELS[preview.category as ExerciseCategory]}
                </Badge>
              ) : null}
              <Tag>{EXERCISE_TYPE_LABELS[preview.type]}</Tag>
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
                className="text-sm font-medium text-accent-text hover:text-accent-strong"
              >
                Pełne szczegóły →
              </Link>
            </div>
          </>
        ) : null}
      </Dialog>

      {toastNode}
    </div>
  );
}
