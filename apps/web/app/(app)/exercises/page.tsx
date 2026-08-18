"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "@/components/Icon";
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
  DEFAULT_EXERCISE_INPUT,
  ExerciseInput,
  exerciseInputFromQuickEntry,
} from "@/lib/exerciseDraft";
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
import { ExerciseName } from "@/components/ExerciseName";
import { ExerciseFormDialog } from "@/components/ExerciseFormDialog";
import { ExerciseThumb } from "@/components/ExerciseThumb";
import { YoutubeExternalLink, YoutubeLite } from "@/components/YoutubeLite";
import {
  Badge,
  Button,
  Dialog,
  EmptyState,
  ErrorBanner,
  formatRest,
  IconButton,
  ListRow,
  PageHeader,
  Pill,
  SearchInput,
  Tag,
  useUndoToast,
} from "@/components/ui";
import { ExerciseListSkeleton } from "@/components/skeletons";

const EMPTY_FILTERS: ExerciseFilters = {
  query: "",
  category: "all",
  equipment: "all",
  pattern: "all",
  typeFilter: "all",
  onlyVideo: false,
  unilateralOnly: false,
};

type FormDialogState =
  | { open: false }
  | {
      open: true;
      mode: "create" | "edit";
      prefill: ExerciseInput;
      editExercise?: Exercise;
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

export default function ExercisesPage() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [formDialog, setFormDialog] = useState<FormDialogState>({ open: false });
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

  const setFilter = <K extends keyof ExerciseFilters>(key: K, value: ExerciseFilters[K]) =>
    setFilters((f) => ({ ...f, [key]: value }));

  const startCreate = (prefillName = "") => {
    setFormDialog({
      open: true,
      mode: "create",
      prefill: prefillName ? exerciseInputFromQuickEntry(prefillName) : DEFAULT_EXERCISE_INPUT,
    });
  };

  const startEdit = (exercise: Exercise) => {
    setFormDialog({
      open: true,
      mode: "edit",
      prefill: DEFAULT_EXERCISE_INPUT,
      editExercise: exercise,
    });
  };

  const handleFormSubmit = async (input: ExerciseInput) => {
    if (!formDialog.open) return;
    if (formDialog.mode === "edit" && formDialog.editExercise) {
      await api.exercises.update(formDialog.editExercise.id, input);
      load();
      return;
    }
    await api.exercises.create(input);
    showUndoToast(`Dodano „${input.name}” do biblioteki`);
    load();
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
        action={<Button onClick={() => startCreate()}>Dodaj ćwiczenie</Button>}
      />
      <ErrorBanner message={error} />

      <div className="mb-4 space-y-3 md:sticky md:top-0 md:z-20 md:-mx-1 md:border-b md:border-border md:bg-background md:px-1 md:py-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="min-w-0 flex-1">
            <SearchInput
              value={filters.query}
              onChange={(v) => setFilter("query", v)}
              placeholder="Szukaj po nazwie, sprzęcie, mięśniu…"
              aria-label="Szukaj ćwiczenia"
              inputRef={searchRef}
              shortcutHint="/"
            />
          </div>
          <Button
            variant="secondary"
            onClick={() => setMoreFilters((v) => !v)}
            aria-expanded={moreFilters}
            className="shrink-0"
          >
            <Icon name="sliders-horizontal" size={16} decorative />
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
          action={<Button onClick={() => startCreate()}>Dodaj pierwsze ćwiczenie</Button>}
        >
          Dodaj własne ćwiczenie — startowa biblioteka wgra się automatycznie.
        </EmptyState>
      ) : filtered.length === 0 ? (
        <EmptyState
          title="Nic nie pasuje do filtrów"
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
                <Button onClick={() => startCreate()}>Dodaj ćwiczenie</Button>
              )}
            </div>
          }
        >
          Zmień filtry albo utwórz ćwiczenie o tej nazwie.
        </EmptyState>
      ) : (
        <div className="divide-y divide-border border-y border-border">
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
            const meta =
              [cat, eqLabel].filter(Boolean).join(" · ") || EXERCISE_TYPE_LABELS[ex.type];
            return (
              <div key={ex.id} className="group relative">
                <ListRow
                  className="pr-20"
                  leading={
                    media ? (
                      <button
                        type="button"
                        className="relative z-10 block w-12 shrink-0 overflow-hidden rounded-md focus-visible:outline-none focus-visible:shadow-[var(--focus-ring)] active:scale-[0.97]"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setPreview(ex);
                        }}
                        aria-label={`Podgląd wideo: ${ex.name}`}
                      >
                        <ExerciseThumb
                          youtubeId={media.youtubeId}
                          category={ex.category}
                          alt={ex.name}
                          seconds={media.seconds}
                          play="none"
                          variant="square"
                          className="rounded-md"
                        />
                      </button>
                    ) : (
                      <span className="block w-12 shrink-0 overflow-hidden rounded-md">
                        <ExerciseThumb
                          youtubeId={null}
                          category={ex.category}
                          alt={ex.name}
                          play="none"
                          variant="square"
                          className="rounded-md"
                        />
                      </span>
                    )
                  }
                  title={
                    <Link
                      href={`/exercises/${ex.id}`}
                      className="break-words after:absolute after:inset-0 after:z-0 focus-visible:outline-none focus-visible:shadow-[var(--focus-ring)]"
                    >
                      <ExerciseName name={ex.name} />
                    </Link>
                  }
                  sub={`${meta}${ex.isUnilateral ? " · jednostronne" : ""} · ${volumeLabel(ex)} · ${formatRest(ex.defaultRestBetweenSetsSeconds)}`}
                />
                <div className="absolute top-1/2 right-1 z-10 flex -translate-y-1/2 shrink-0 gap-0.5 opacity-100 transition-opacity duration-[var(--dur-fast)] md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100">
                  <IconButton title="Edytuj" size="sm" onClick={() => startEdit(ex)}>
                    <Icon name="edit" size={16} decorative />
                  </IconButton>
                  <IconButton
                    title="Usuń"
                    variant="danger"
                    size="sm"
                    onClick={() => void handleDelete(ex)}
                  >
                    <Icon name="delete" size={16} decorative />
                  </IconButton>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ExerciseFormDialog
        open={formDialog.open}
        mode={formDialog.open ? formDialog.mode : "create"}
        variant="full"
        prefill={formDialog.open ? formDialog.prefill : DEFAULT_EXERCISE_INPUT}
        editExercise={formDialog.open ? formDialog.editExercise : undefined}
        onClose={() => setFormDialog({ open: false })}
        onSubmit={handleFormSubmit}
      />

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
                Otwórz szczegóły
              </Link>
            </div>
          </>
        ) : null}
      </Dialog>

      {toastNode}
    </div>
  );
}
