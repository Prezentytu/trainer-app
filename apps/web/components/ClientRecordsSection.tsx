"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  api,
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  ClientRecord,
  Exercise,
  ExerciseCategory,
  ExerciseStats,
} from "@/lib/api";
import { DEFAULT_EXERCISE_INPUT } from "@/lib/exerciseDraft";
import { createOrReuseExercise } from "@/lib/exerciseLibrary";
import { foldDiacritics } from "@/lib/exerciseSearch";
import { daysAgo, formatDayShort } from "@/lib/dates";
import { formatKg } from "@/lib/plates";
import { polishTrainingCount } from "@/lib/plural";
import { ExerciseCombobox } from "@/components/ExerciseCombobox";
import { Icon } from "@/components/Icon";
import { TrendSparkline } from "@/components/TrendSparkline";
import { RepMaxList } from "@/components/RepMaxList";
import {
  Button,
  Dialog,
  EmptyState,
  Pill,
  SearchInput,
  SegmentedControl,
} from "@/components/ui";

type StatsEntry = ExerciseStats | "loading" | "error";
type SortKey = "heaviest" | "recent" | "az";

function staleLabel(iso: string | undefined): string | null {
  if (!iso) return null;
  const days = daysAgo(iso);
  if (days == null || days < 42) return null;
  const weeks = Math.round(days / 7);
  return `ostatnio ${weeks} tyg. temu`;
}

export function ClientRecordsSection({
  clientId,
  records,
  exercises,
  onExercisesChange,
  onReload,
  onError,
  emptyAction,
}: {
  clientId: number;
  records: ClientRecord[];
  exercises: Exercise[];
  onExercisesChange: (next: Exercise[]) => void;
  onReload: () => void;
  onError: (message: string) => void;
  emptyAction?: React.ReactNode;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<ExerciseCategory | "all">("all");
  const [sort, setSort] = useState<SortKey>("heaviest");
  const [limit, setLimit] = useState(8);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [statsCache, setStatsCache] = useState<Record<number, StatsEntry>>({});
  const [remap, setRemap] = useState<{
    source: ClientRecord;
    targetId: number | null;
    usage: { sessions: number; sets: number } | null;
    busy: boolean;
  } | null>(null);

  const facets = useMemo(() => {
    const counts: Record<string, number> = { all: records.length };
    for (const r of records) {
      const key = r.category ?? "";
      if (key) counts[key] = (counts[key] ?? 0) + 1;
    }
    return counts;
  }, [records]);

  const filtered = useMemo(() => {
    const q = foldDiacritics(query.trim());
    const rows = records.filter((r) => {
      if (category !== "all" && r.category !== category) return false;
      if (q && !foldDiacritics(r.exerciseName).includes(q)) return false;
      return true;
    });
    rows.sort((a, b) => {
      if (sort === "az") return a.exerciseName.localeCompare(b.exerciseName, "pl");
      if (sort === "recent") {
        return (b.lastPerformedOn ?? b.performedOn).localeCompare(a.lastPerformedOn ?? a.performedOn);
      }
      return b.estimated1Rm - a.estimated1Rm;
    });
    return rows;
  }, [records, query, category, sort]);

  const visible = filtered.slice(0, limit);

  const toggle = (exerciseId: number) => {
    if (expandedId === exerciseId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(exerciseId);
    if (statsCache[exerciseId]) return;
    setStatsCache((prev) => ({ ...prev, [exerciseId]: "loading" }));
    api.clients
      .exerciseStats(clientId, exerciseId)
      .then((stats) => setStatsCache((prev) => ({ ...prev, [exerciseId]: stats })))
      .catch(() => setStatsCache((prev) => ({ ...prev, [exerciseId]: "error" })));
  };

  const startRemap = async (record: ClientRecord) => {
    setRemap({ source: record, targetId: null, usage: null, busy: true });
    try {
      const usage = await api.clients.exerciseUsage(clientId, record.exerciseId);
      setRemap({ source: record, targetId: null, usage, busy: false });
    } catch (err) {
      setRemap(null);
      onError((err as Error).message);
    }
  };

  const confirmRemap = async () => {
    if (!remap?.targetId || remap.targetId === remap.source.exerciseId) return;
    setRemap({ ...remap, busy: true });
    try {
      await api.clients.remapExercise(clientId, remap.source.exerciseId, remap.targetId);
      setRemap(null);
      setExpandedId(null);
      onReload();
    } catch (err) {
      setRemap((prev) => (prev ? { ...prev, busy: false } : prev));
      onError((err as Error).message);
    }
  };

  return (
    <section>
      <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-semibold">
        <Icon name="trophy" size={16} className="text-pr" decorative />
        Rekordy
      </h2>
      {records.length === 0 ? (
        <EmptyState title="Jeszcze bez rekordów siłowych" action={emptyAction}>
          Rekordy (est. 1RM) pojawią się po seriach z ciężarem i powtórzeniami.
        </EmptyState>
      ) : (
        <div className="space-y-3">
          <SearchInput
            value={query}
            onChange={(v) => {
              setQuery(v);
              setLimit(8);
            }}
            placeholder="Szukaj ćwiczenia…"
            aria-label="Szukaj rekordu"
          />
          <div className="flex flex-wrap gap-2">
            <Pill
              quiet
              active={category === "all"}
              onClick={() => {
                setCategory("all");
                setLimit(8);
              }}
            >
              Wszystkie · {facets.all}
            </Pill>
            {CATEGORY_ORDER.filter((c) => (facets[c] ?? 0) > 0 || category === c).map((c) => (
              <Pill
                key={c}
                quiet
                active={category === c}
                onClick={() => {
                  setCategory(c);
                  setLimit(8);
                }}
              >
                {CATEGORY_LABELS[c]} · {facets[c] ?? 0}
              </Pill>
            ))}
          </div>
          <SegmentedControl
            items={[
              { value: "heaviest", label: "Najcięższe" },
              { value: "recent", label: "Ostatnie" },
              { value: "az", label: "A–Z" },
            ]}
            value={sort}
            onChange={(v) => setSort(v as SortKey)}
          />
          <div className="divide-y divide-border border-y border-border">
            {visible.map((r) => {
              const open = expandedId === r.exerciseId;
              const stats = statsCache[r.exerciseId];
              const stale = staleLabel(r.lastPerformedOn ?? r.performedOn);
              return (
                <div key={r.exerciseId}>
                  <button
                    type="button"
                    onClick={() => toggle(r.exerciseId)}
                    className="flex w-full min-h-11 items-center justify-between gap-3 py-2.5 text-left hover:bg-surface-hover"
                    aria-expanded={open}
                  >
                    <div className="min-w-0">
                      <p className="min-w-0 break-words text-sm font-medium text-foreground">
                        {r.exerciseName}
                      </p>
                      <p className="font-mono text-xs tabular-nums text-muted">
                        {r.weightKg} × {r.reps}
                        {stale ? ` · ${stale}` : ""}
                      </p>
                    </div>
                    <p className="shrink-0 font-mono text-sm font-semibold tabular-nums text-pr">
                      ★ {formatKg(r.estimated1Rm)}
                    </p>
                  </button>
                  {open ? (
                    <div className="pb-3">
                      {stats === "loading" || stats == null ? (
                        <p className="text-sm text-muted">Ładowanie trendu…</p>
                      ) : stats === "error" ? (
                        <p className="text-sm text-danger">Nie udało się wczytać trendu.</p>
                      ) : (
                        <>
                          <TrendSparkline points={stats.trend} />
                          <p className="mt-4 font-mono text-xs font-medium uppercase tracking-caps text-muted">
                            Rep-maxy
                          </p>
                          <RepMaxList items={stats.repMaxes} />
                        </>
                      )}
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button variant="secondary" size="sm" onClick={() => void startRemap(r)}>
                          To nie to ćwiczenie
                        </Button>
                        {r.sessionId ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/clients/${clientId}/sessions/${r.sessionId}/edit`)}
                          >
                            Popraw serię
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
          {filtered.length > limit ? (
            <Button variant="ghost" onClick={() => setLimit((n) => n + 50)}>
              Pokaż wszystkie ({filtered.length})
            </Button>
          ) : null}
        </div>
      )}

      <Dialog
        open={remap != null}
        title="To nie to ćwiczenie"
        description={
          remap?.usage
            ? `Podmienię w ${polishTrainingCount(remap.usage.sessions)} i ${remap.usage.sets} seriach. Danych nie skasuję.`
            : "Wybierz właściwe ćwiczenie — historia i max zostaną przepisane."
        }
        confirmLabel="Podmień w historii"
        busy={remap?.busy}
        onCancel={() => setRemap(null)}
        onConfirm={() => void confirmRemap()}
        className="max-w-md"
      >
        {remap ? (
          <ExerciseCombobox
            exercises={exercises}
            value={remap.targetId}
            placeholder="Właściwe ćwiczenie…"
            onSelect={(exercise) =>
              setRemap((prev) => (prev ? { ...prev, targetId: exercise.id } : prev))
            }
            onCreate={async (input) => {
              const { exercise } = await createOrReuseExercise({
                ...DEFAULT_EXERCISE_INPUT,
                ...input,
              });
              onExercisesChange(
                exercises.some((e) => e.id === exercise.id)
                  ? exercises
                  : [...exercises, exercise].sort((a, b) => a.name.localeCompare(b.name, "pl")),
              );
              return exercise;
            }}
          />
        ) : null}
      </Dialog>
    </section>
  );
}
