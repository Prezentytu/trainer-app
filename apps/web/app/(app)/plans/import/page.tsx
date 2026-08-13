"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  api,
  Exercise,
  PlanImportDraft,
  PlanImportItem,
} from "@/lib/api";
import { DEFAULT_EXERCISE_INPUT, ExerciseInput } from "@/lib/exerciseDraft";
import { createOrReuseExercise } from "@/lib/exerciseLibrary";
import { foldDiacritics } from "@/lib/exerciseSearch";
import {
  allItemsMapped,
  countUnmapped,
  draftToBuilderHandoff,
  ExerciseIdMap,
  itemMapKey,
  saveImportHandoff,
} from "@/lib/planImportHandoff";
import { ExerciseCombobox } from "@/components/ExerciseCombobox";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorBanner,
  Field,
  PageHeader,
  inputClass,
} from "@/components/ui";

type Step = "paste" | "review";

const ACCEPTED_EXT = [".txt", ".md", ".csv"];

function readTextFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Nie udało się odczytać pliku."));
    reader.readAsText(file);
  });
}

function itemSummary(it: PlanImportItem): string {
  const parts: string[] = [];
  if (it.setScheme) parts.push(it.setScheme);
  else if (it.sets != null && it.reps != null) {
    parts.push(`${it.sets}×${it.reps}${it.repsMax != null ? `–${it.repsMax}` : ""}`);
  } else if (it.sets != null) parts.push(`${it.sets} serii`);
  if (it.loadKg != null) parts.push(`${it.loadKg} kg`);
  if (it.tempo) parts.push(it.tempo);
  return parts.join(" · ") || "—";
}

function draftWeekBadge(draft: PlanImportDraft): string {
  const days = draft.days ?? [];
  const weeks = [...new Set(days.map((d) => d.weekNumber))].sort((a, b) => a - b);
  const items = days.reduce((s, d) => s + (d.items?.length ?? 0), 0);
  const weekLabel =
    weeks.length === 0
      ? "—"
      : weeks.length === 1
        ? `T${weeks[0]}`
        : `T${weeks[0]}–T${weeks[weeks.length - 1]}`;
  return `${weekLabel} · ${days.length} dni · ${items} poz.`;
}

function importItemCreateInput(item: PlanImportItem, name?: string): ExerciseInput {
  return {
    ...DEFAULT_EXERCISE_INPUT,
    name: (name ?? item.exerciseName).trim().replace(/\s+/g, " "),
    type: item.measureType === "time" || item.measureType === "distance" ? item.measureType : "reps",
    defaultSets: item.sets ?? 3,
    defaultReps: item.reps ?? 10,
    defaultRepDurationSeconds: item.repDurationSeconds,
    defaultDistanceMeters: item.distanceMeters,
    defaultLoadKg: item.loadKg,
  };
}

export default function PlanImportPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("paste");
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingHint, setLoadingHint] = useState("AI analizuje plan…");
  const [draft, setDraft] = useState<PlanImportDraft | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [idMap, setIdMap] = useState<ExerciseIdMap>({});
  const [bulkCreating, setBulkCreating] = useState(false);
  const [bulkProgress, setBulkProgress] = useState<{ done: number; total: number } | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    api.exercises.list().then(setExercises).catch((e: Error) => setError(e.message));
  }, []);

  const unmapped = useMemo(
    () => (draft ? countUnmapped(draft, idMap) : 0),
    [draft, idMap]
  );
  const canOpen = draft != null && allItemsMapped(draft, idMap);
  const failedWeeks = draft?.failedWeeks ?? [];

  const seedMapFromDraft = useCallback((d: PlanImportDraft) => {
    const next: ExerciseIdMap = {};
    d.days?.forEach((day, di) => {
      day.items?.forEach((it, ii) => {
        if (it.matchedExerciseId != null) next[itemMapKey(di, ii)] = it.matchedExerciseId;
      });
    });
    setIdMap(next);
  }, []);

  const runImport = async () => {
    setError(null);
    setLoading(true);
    setLoadingHint("AI analizuje plan…");
    const hintTimer = window.setTimeout(() => setLoadingHint("Dopasowuję ćwiczenia z biblioteki…"), 2500);
    try {
      const result = await api.ai.importPlan(text);
      setDraft(result);
      seedMapFromDraft(result);
      setStep("review");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      window.clearTimeout(hintTimer);
      setLoading(false);
    }
  };

  /** Ponawia tylko nieudane tygodnie i scala z bieżącym draftem (zachowuje ręczne mapowania). */
  const retryFailedWeeks = async () => {
    if (!draft || failedWeeks.length === 0) return;
    setError(null);
    setRetrying(true);
    setLoadingHint("Ponawiam brakujące tygodnie…");
    try {
      const result = await api.ai.importPlan(text, failedWeeks);
      const oldDays = draft.days ?? [];
      const recovered = result.days ?? [];

      // Zachowaj ręczne mapowania po (weekNumber, order, itemIdx).
      const stableIds: Record<string, number> = {};
      oldDays.forEach((day, di) => {
        day.items?.forEach((it, ii) => {
          const id = idMap[itemMapKey(di, ii)] ?? it.matchedExerciseId;
          if (id != null) stableIds[`${day.weekNumber}:${day.order}:${ii}`] = id;
        });
      });
      recovered.forEach((day) => {
        day.items?.forEach((it, ii) => {
          if (it.matchedExerciseId != null) {
            stableIds[`${day.weekNumber}:${day.order}:${ii}`] = it.matchedExerciseId;
          }
        });
      });

      const recoveredWeeks = new Set(recovered.map((d) => d.weekNumber));
      const kept = oldDays.filter((d) => !recoveredWeeks.has(d.weekNumber));
      const mergedDays = [...kept, ...recovered].sort(
        (a, b) => a.weekNumber - b.weekNumber || a.order - b.order
      );

      const nextMap: ExerciseIdMap = {};
      mergedDays.forEach((day, di) => {
        day.items?.forEach((it, ii) => {
          const id = stableIds[`${day.weekNumber}:${day.order}:${ii}`];
          if (id != null) nextMap[itemMapKey(di, ii)] = id;
        });
      });

      setDraft({
        ...draft,
        name: draft.name || result.name,
        description: draft.description ?? result.description,
        days: mergedDays,
        warnings: result.warnings ?? null,
        failedWeeks: result.failedWeeks ?? null,
      });
      setIdMap(nextMap);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setRetrying(false);
    }
  };

  const onFile = async (file: File | null) => {
    if (!file) return;
    const lower = file.name.toLowerCase();
    if (!ACCEPTED_EXT.some((ext) => lower.endsWith(ext))) {
      setError("Obsługiwane pliki: .txt, .md, .csv");
      return;
    }
    try {
      const content = await readTextFile(file);
      setText(content);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const resolveId = (dayIdx: number, itemIdx: number, item: PlanImportItem) =>
    idMap[itemMapKey(dayIdx, itemIdx)] ?? item.matchedExerciseId ?? null;

  /** Mapuje pozycję + wszystkie niezmapowane o tej samej (folded) nazwie. */
  const mapExerciseAndDuplicates = useCallback(
    (dayIdx: number, itemIdx: number, exercise: Exercise) => {
      if (!draft) {
        setIdMap((prev) => ({ ...prev, [itemMapKey(dayIdx, itemIdx)]: exercise.id }));
        return;
      }
      const sourceName = foldDiacritics(
        draft.days?.[dayIdx]?.items?.[itemIdx]?.exerciseName ?? ""
      );
      setIdMap((prev) => {
        const next = { ...prev, [itemMapKey(dayIdx, itemIdx)]: exercise.id };
        if (!sourceName) return next;
        draft.days?.forEach((day, di) => {
          day.items?.forEach((it, ii) => {
            if (di === dayIdx && ii === itemIdx) return;
            const key = itemMapKey(di, ii);
            const already = next[key] ?? it.matchedExerciseId;
            if (already != null) return;
            if (foldDiacritics(it.exerciseName) === sourceName) {
              next[key] = exercise.id;
            }
          });
        });
        return next;
      });
      setExercises((prev) => {
        if (prev.some((e) => e.id === exercise.id)) return prev;
        return [...prev, exercise].sort((a, b) => a.name.localeCompare(b.name, "pl"));
      });
    },
    [draft]
  );

  const createForItem = async (
    dayIdx: number,
    itemIdx: number,
    item: PlanImportItem,
    input: ExerciseInput
  ): Promise<Exercise> => {
    setError(null);
    const { exercise } = await createOrReuseExercise(input);
    mapExerciseAndDuplicates(dayIdx, itemIdx, exercise);
    return exercise;
  };

  const createAllMissing = async () => {
    if (!draft || unmapped === 0 || bulkCreating) return;
    setError(null);
    setBulkCreating(true);
    const working: ExerciseIdMap = { ...idMap };
    const pending: { di: number; ii: number; item: PlanImportItem }[] = [];
    draft.days?.forEach((day, di) => {
      day.items?.forEach((it, ii) => {
        const id = working[itemMapKey(di, ii)] ?? it.matchedExerciseId;
        if (id == null) pending.push({ di, ii, item: it });
      });
    });
    // dedupe po folded nazwie — jedna create, potem auto-map duplikatów
    const seen = new Set<string>();
    const unique = pending.filter(({ item }) => {
      const key = foldDiacritics(item.exerciseName);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    setBulkProgress({ done: 0, total: unique.length });
    try {
      for (let i = 0; i < unique.length; i++) {
        const { di, ii, item } = unique[i];
        const key = itemMapKey(di, ii);
        if ((working[key] ?? item.matchedExerciseId) != null) {
          setBulkProgress({ done: i + 1, total: unique.length });
          continue;
        }
        const { exercise } = await createOrReuseExercise(importItemCreateInput(item));
        const folded = foldDiacritics(item.exerciseName);
        working[key] = exercise.id;
        draft.days?.forEach((day, ddi) => {
          day.items?.forEach((it, iii) => {
            const k = itemMapKey(ddi, iii);
            if ((working[k] ?? it.matchedExerciseId) != null) return;
            if (foldDiacritics(it.exerciseName) === folded) working[k] = exercise.id;
          });
        });
        setExercises((prev) => {
          if (prev.some((e) => e.id === exercise.id)) return prev;
          return [...prev, exercise].sort((a, b) => a.name.localeCompare(b.name, "pl"));
        });
        setIdMap({ ...working });
        setBulkProgress({ done: i + 1, total: unique.length });
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBulkCreating(false);
      setBulkProgress(null);
    }
  };

  const openInBuilder = () => {
    if (!draft || !canOpen) return;
    const handoff = draftToBuilderHandoff(draft, idMap, exercises);
    saveImportHandoff(handoff);
    router.push("/plans/new");
  };

  return (
    <div>
      <PageHeader
        title="Import planu"
        subtitle="Wklej tekst lub wrzuć plik — AI zbuduje strukturę, Ty dopasujesz ćwiczenia"
        action={
          <Link href="/plans">
            <Button variant="ghost">← Plany</Button>
          </Link>
        }
      />

      <div className="mb-6 flex items-center gap-2" aria-label={`Krok ${step === "paste" ? 1 : 2} z 3`}>
        <div className={`h-1.5 flex-1 rounded-full ${step === "paste" || step === "review" ? "bg-accent" : "bg-surface-hover"}`} />
        <div className={`h-1.5 flex-1 rounded-full ${step === "review" ? "bg-accent" : "bg-surface-hover"}`} />
        <div className="h-1.5 flex-1 rounded-full bg-surface-hover" />
      </div>
      <p className="mb-4 text-xs font-medium uppercase tracking-wide text-muted">
        {step === "paste" ? "Krok 1 z 3 · wklej tekst" : "Krok 2 z 3 · sprawdź i mapuj ćwiczenia"}
      </p>

      <ErrorBanner message={error} />

      {step === "paste" && (
        <Card className="space-y-4">
          <Field label="Tekst planu">
            <textarea
              className={`${inputClass} min-h-[220px] w-full resize-y font-mono text-sm`}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={`TYDZIEŃ 5\nTrening A\n* 1. High bar squat: Rampa 3 (47,5 kg) + BO 80%: 38 kg (5-10 powt.)\n* 2. …`}
              disabled={loading}
            />
          </Field>

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              void onFile(e.dataTransfer.files?.[0] ?? null);
            }}
            className={`rounded-xl border border-dashed px-4 py-6 text-center transition-colors ${
              dragOver
                ? "border-accent-border bg-accent-dim"
                : "border-border-strong bg-surface-sunken"
            }`}
          >
            <p className="text-sm text-foreground-secondary">
              Upuść plik <span className="font-mono text-muted">.txt / .md / .csv</span> albo{" "}
              <label className="cursor-pointer font-semibold text-accent-strong underline-offset-2 hover:underline">
                wybierz z dysku
                <input
                  type="file"
                  accept=".txt,.md,.csv,text/plain,text/markdown,text/csv"
                  className="hidden"
                  onChange={(e) => void onFile(e.target.files?.[0] ?? null)}
                />
              </label>
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-muted">
              Nic nie zapisujemy od razu — najpierw podgląd w kreatorze.
            </p>
            <Button
              onClick={() => void runImport()}
              disabled={loading || text.trim().length < 10}
            >
              {loading ? loadingHint : "Analizuj z AI →"}
            </Button>
          </div>
        </Card>
      )}

      {step === "review" && draft && (
        <div className="space-y-4">
          <Card>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="font-display text-lg font-semibold break-words text-foreground">
                  {draft.name || "Zaimportowany plan"}
                </p>
                {draft.description ? (
                  <p className="mt-1 text-sm text-muted break-words">{draft.description}</p>
                ) : null}
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <Badge tone={unmapped === 0 ? "positive" : "neutral"}>
                  {unmapped === 0 ? "Wszystko dopasowane" : `${unmapped} bez dopasowania`}
                </Badge>
                <Badge tone="accent">{draftWeekBadge(draft)}</Badge>
                {unmapped > 0 ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={bulkCreating || loading}
                    onClick={() => void createAllMissing()}
                  >
                    {bulkProgress
                      ? `Tworzę… ${bulkProgress.done}/${bulkProgress.total}`
                      : `Utwórz wszystkie brakujące (${unmapped})`}
                  </Button>
                ) : null}
              </div>
            </div>
          </Card>

          {(draft.warnings?.length ?? 0) > 0 || failedWeeks.length > 0 ? (
            <div
              role="alert"
              className="rounded-md border border-danger-border bg-danger-bg/60 px-4 py-3 text-sm leading-[var(--leading-body)] text-danger"
            >
              <p className="font-semibold">Import może być niekompletny</p>
              {(draft.warnings?.length ?? 0) > 0 ? (
                <ul className="mt-1 list-disc space-y-0.5 pl-5">
                  {draft.warnings!.map((w) => (
                    <li key={w}>{w}</li>
                  ))}
                </ul>
              ) : null}
              {failedWeeks.length > 0 ? (
                <div className="mt-3">
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={retrying || loading}
                    onClick={() => void retryFailedWeeks()}
                  >
                    {retrying
                      ? "Ponawiam…"
                      : `Ponów brakujące tygodnie (${failedWeeks.length})`}
                  </Button>
                </div>
              ) : null}
            </div>
          ) : null}

          {(draft.days ?? []).length === 0 ? (
            <EmptyState
              title="AI nie zwróciło dni treningowych"
              action={
                <Button variant="secondary" size="sm" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
                  Popraw prompt i spróbuj ponownie
                </Button>
              }
            >
              Sprawdź opis planu albo wygeneruj jeszcze raz — bez dni nie zapiszesz importu.
            </EmptyState>
          ) : (
            (draft.days ?? []).map((day, di) => (
              <Card key={`${day.weekNumber}-${day.order}-${di}`}>
                <p className="mb-3 text-sm font-semibold text-foreground">
                  T{day.weekNumber} ·{" "}
                  <span className="break-words">{day.label}</span>
                </p>
                <ul className="space-y-3">
                  {(day.items ?? []).map((it, ii) => {
                    const mappedId = resolveId(di, ii, it);
                    const mapped = mappedId != null ? exercises.find((e) => e.id === mappedId) : null;
                    const key = itemMapKey(di, ii);
                    return (
                      <li
                        key={key}
                        className="rounded-xl border border-border bg-surface-sunken p-3"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold break-words text-foreground">
                              {it.order}. {it.exerciseName}
                              {it.supersetGroup != null ? (
                                <span className="ml-2 text-xs font-normal text-accent-strong">
                                  superseria {it.supersetGroup}
                                </span>
                              ) : null}
                            </p>
                            <p className="mt-0.5 font-mono text-xs tabular-nums text-muted">
                              {itemSummary(it)}
                            </p>
                            {it.notes ? (
                              <p className="mt-1 text-xs text-muted-strong break-words">{it.notes}</p>
                            ) : null}
                          </div>
                          {mapped ? (
                            <Badge tone="accent">✓ {mapped.name}</Badge>
                          ) : (
                            <Badge tone="danger">Brak w bibliotece</Badge>
                          )}
                        </div>
                        <div className="mt-2">
                          <ExerciseCombobox
                            key={key}
                            exercises={exercises}
                            value={mappedId}
                            suggestedName={it.exerciseName}
                            placeholder="Szukaj lub utwórz ćwiczenie…"
                            disabled={bulkCreating}
                            onSelect={(exercise) => mapExerciseAndDuplicates(di, ii, exercise)}
                            buildCreateInput={(name) => importItemCreateInput(it, name)}
                            onCreate={async (input) => createForItem(di, ii, it, input)}
                          />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </Card>
            ))
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 pb-8">
            <Button
              variant="ghost"
              onClick={() => {
                setStep("paste");
                setDraft(null);
              }}
            >
              ← Wróć do tekstu
            </Button>
            <Button onClick={openInBuilder} disabled={!canOpen}>
              Otwórz w kreatorze →
            </Button>
          </div>
          {!canOpen && unmapped > 0 ? (
            <p className="pb-6 text-center text-xs text-muted">
              Dopasuj lub utwórz {unmapped}{" "}
              {unmapped === 1 ? "ćwiczenie" : "ćwiczenia"}, żeby przejść dalej.
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}
