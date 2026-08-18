"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  api,
  CATEGORY_LABELS,
  EQUIPMENT_LABELS,
  Exercise,
  ExerciseCategory,
  EXERCISE_TYPE_LABELS,
  MEDIA_KIND_LABELS,
  ExerciseMediaKind,
  PATTERN_LABELS,
  ExercisePattern,
} from "@/lib/api";
import { YoutubeExternalLink, YoutubeLite } from "@/components/YoutubeLite";
import { ExerciseThumb } from "@/components/ExerciseThumb";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorBanner,
  formatRest,
  PageHeader,
  StatBlock,
  Tag,
} from "@/components/ui";
import { ExerciseDetailSkeleton } from "@/components/skeletons";
import { splitExerciseName } from "@/lib/exerciseName";
import { polishFilmLabel } from "@/lib/plural";

function volumeValue(exercise: Exercise): string {
  if (exercise.type === "time") {
    return exercise.defaultRepDurationSeconds ? `${exercise.defaultRepDurationSeconds} s` : "—";
  }
  if (exercise.type === "distance") {
    return exercise.defaultDistanceMeters ? `${exercise.defaultDistanceMeters} m` : "—";
  }
  return `${exercise.defaultReps}`;
}

function restStat(seconds: number): { value: string; unit?: string } {
  if (seconds < 60) return { value: String(seconds), unit: "s" };
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  if (sec === 0) return { value: String(min), unit: "min" };
  return { value: formatRest(seconds) };
}

export default function ExerciseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const rawId = params.id;
  const id = typeof rawId === "string" ? Number(rawId) : NaN;
  const validId = Number.isInteger(id) && id > 0;

  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [library, setLibrary] = useState<Exercise[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeMedia, setActiveMedia] = useState(0);

  const load = useCallback(() => {
    if (!validId) return;
    api.exercises
      .get(id)
      .then((ex) => {
        setExercise(ex);
        setActiveMedia(0);
        setError(null);
      })
      .catch((e: Error) => setError(e.message));
    api.exercises
      .list()
      .then(setLibrary)
      .catch((e: Error) => setError(e.message));
  }, [id, validId]);

  useEffect(load, [load]);

  const substitutes = useMemo(() => {
    if (!exercise?.category || !exercise.pattern) return [];
    return library
      .filter(
        (e) =>
          e.id !== exercise.id &&
          e.category === exercise.category &&
          e.pattern === exercise.pattern
      )
      .slice(0, 8);
  }, [exercise, library]);

  if (!validId) {
    return (
      <div>
        <PageHeader
          title="Ćwiczenie"
          action={
            <Button variant="ghost" onClick={() => router.push("/exercises")}>
              ← Biblioteka
            </Button>
          }
        />
        <ErrorBanner message="Nieprawidłowe ID ćwiczenia." />
        <EmptyState
          action={
            <Button variant="secondary" onClick={() => router.push("/exercises")}>
              Wróć do biblioteki
            </Button>
          }
        >
          Nie znaleziono ćwiczenia.
        </EmptyState>
      </div>
    );
  }

  if (error && !exercise) {
    return (
      <div>
        <PageHeader
          title="Ćwiczenie"
          action={
            <Button variant="ghost" onClick={() => router.push("/exercises")}>
              ← Biblioteka
            </Button>
          }
        />
        <ErrorBanner message={error} />
        <EmptyState
          action={
            <Button variant="secondary" onClick={() => router.push("/exercises")}>
              Wróć do biblioteki
            </Button>
          }
        >
          Nie udało się wczytać ćwiczenia.
        </EmptyState>
      </div>
    );
  }

  if (!exercise) {
    return (
      <div>
        <ErrorBanner message={error} />
        <ExerciseDetailSkeleton />
      </div>
    );
  }

  const media = exercise.media ?? [];
  const current = media[activeMedia] ?? media[0];
  const cat =
    exercise.category && exercise.category in CATEGORY_LABELS
      ? CATEGORY_LABELS[exercise.category as ExerciseCategory]
      : null;
  const pattern =
    exercise.pattern && exercise.pattern in PATTERN_LABELS
      ? PATTERN_LABELS[exercise.pattern as ExercisePattern]
      : exercise.pattern;
  const rest = restStat(exercise.defaultRestBetweenSetsSeconds);
  const { primary: exercisePrimary, secondary: exerciseSecondary } = splitExerciseName(exercise.name);

  return (
    <div>
      <PageHeader
        title={exercisePrimary}
        subtitle={[
          exerciseSecondary,
          cat,
          pattern,
          exercise.isUnilateral ? "jednostronne" : null,
        ]
          .filter(Boolean)
          .join(" · ")}
        action={
          <div className="flex flex-wrap gap-2">
            <Button variant="ghost" onClick={() => router.push("/exercises")}>
              ← Biblioteka
            </Button>
          </div>
        }
      />
      <ErrorBanner message={error} />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="space-y-4">
          {current ? (
            <Card className="overflow-hidden p-3 sm:p-4">
              <YoutubeLite
                key={current.youtubeId}
                youtubeId={current.youtubeId}
                title={current.title || exercise.name}
                seconds={current.seconds}
                category={exercise.category}
                autoplay={false}
              />
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="break-words text-sm font-medium">{current.title || exercise.name}</p>
                  <p className="text-xs text-muted">
                    {MEDIA_KIND_LABELS[current.kind as ExerciseMediaKind] ?? "wideo"}
                  </p>
                </div>
                <YoutubeExternalLink youtubeId={current.youtubeId} />
              </div>
            </Card>
          ) : (
            <Card>
              <EmptyState action={null}>Brak filmów dla tego ćwiczenia.</EmptyState>
            </Card>
          )}

          {media.length > 1 ? (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {media.map((m, idx) => (
                <button
                  key={`${m.youtubeId}-${idx}`}
                  type="button"
                  onClick={() => setActiveMedia(idx)}
                  className={`overflow-hidden rounded-[10px] border text-left transition-colors ${
                    idx === activeMedia
                      ? "border-accent"
                      : "border-border hover:border-border-strong"
                  }`}
                >
                  <ExerciseThumb
                    youtubeId={m.youtubeId}
                    category={exercise.category}
                    alt={m.title}
                    seconds={m.seconds}
                    className="rounded-none"
                  />
                  <div className="px-2 py-1.5">
                    <p className="truncate text-xs font-medium">{m.title || "Wideo"}</p>
                    <p className="text-xs uppercase tracking-[0.08em] text-muted">
                      {MEDIA_KIND_LABELS[m.kind as ExerciseMediaKind] ?? "wideo"}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="space-y-4">
          <Card className="overflow-hidden">
            <div className="flex flex-wrap items-center gap-1.5">
              {cat ? <Tag invert>{cat}</Tag> : null}
              <Tag>{EXERCISE_TYPE_LABELS[exercise.type]}</Tag>
              {(exercise.equipment ?? []).map((eq) => (
                <Tag key={eq}>{EQUIPMENT_LABELS[eq] ?? eq}</Tag>
              ))}
            </div>
            <div className="-mx-3.5 mt-3.5 -mb-3.5 grid grid-cols-2 border-t border-border sm:-mx-4 sm:-mb-4">
              <div className="border-r border-b border-border px-3.5 py-3 sm:px-4">
                <StatBlock
                  label={exercise.type === "reps" ? "Serie × powt." : "Serie × wartość"}
                  value={`${exercise.defaultSets}×${volumeValue(exercise)}`}
                />
              </div>
              <div className="border-b border-border px-3.5 py-3 sm:px-4">
                <StatBlock label="Przerwa" value={rest.value} unit={rest.unit} />
              </div>
              <div className="border-r border-border px-3.5 py-3 sm:px-4">
                <StatBlock
                  label="Ciężar"
                  value={exercise.defaultLoadKg ?? "—"}
                  unit={exercise.defaultLoadKg != null ? "kg" : undefined}
                  valueClassName={exercise.defaultLoadKg == null ? "text-muted" : undefined}
                />
              </div>
              <div className="px-3.5 py-3 sm:px-4">
                <StatBlock label={polishFilmLabel(media.length)} value={media.length} />
              </div>
            </div>
          </Card>

          {(exercise.primaryMuscles?.length ?? 0) > 0 ? (
            <Card title="Mięśnie główne">
              <div className="flex flex-wrap gap-1.5">
                {exercise.primaryMuscles.map((m) => (
                  <Badge key={m} tone="neutral">
                    {m}
                  </Badge>
                ))}
              </div>
            </Card>
          ) : null}

          {exercise.description || exercise.instructions ? (
            <Card title="Wskazówki">
              {exercise.description ? (
                <p className="break-words text-sm text-foreground-secondary">{exercise.description}</p>
              ) : null}
              {exercise.instructions ? (
                <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm text-foreground-secondary">
                  {exercise.instructions
                    .split("\n")
                    .map((line) => line.trim())
                    .filter(Boolean)
                    .map((line) => (
                      <li key={line} className="break-words">
                        {line}
                      </li>
                    ))}
                </ol>
              ) : null}
            </Card>
          ) : null}

          {substitutes.length > 0 ? (
            <Card title="Zamienniki" meta="Ta sama partia i wzorzec ruchu">
              <ul className="space-y-2">
                {substitutes.map((s) => {
                  const thumb = s.media?.find((m) => m.kind === "demo") ?? s.media?.[0];
                  return (
                    <li key={s.id}>
                      <Link
                        href={`/exercises/${s.id}`}
                        className="flex items-center gap-3 rounded-[10px] p-1.5 hover:bg-surface-hover"
                      >
                        <div className="w-20 shrink-0">
                          <ExerciseThumb
                            youtubeId={thumb?.youtubeId}
                            category={s.category}
                            alt={s.name}
                            seconds={thumb?.seconds}
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="break-words text-sm font-medium">{s.name}</p>
                          <p className="text-xs text-muted">
                            {(s.equipment ?? [])
                              .slice(0, 2)
                              .map((e) => EQUIPMENT_LABELS[e] ?? e)
                              .join(" · ") || EXERCISE_TYPE_LABELS[s.type]}
                          </p>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}
