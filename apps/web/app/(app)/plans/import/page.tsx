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
import { DEFAULT_EXERCISE_INPUT } from "@/lib/exerciseDraft";
import {
  allItemsMapped,
  countUnmapped,
  draftToBuilderHandoff,
  ExerciseIdMap,
  itemMapKey,
  saveImportHandoff,
} from "@/lib/planImportHandoff";
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
  const [creatingKey, setCreatingKey] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    api.exercises.list().then(setExercises).catch((e: Error) => setError(e.message));
  }, []);

  const unmapped = useMemo(
    () => (draft ? countUnmapped(draft, idMap) : 0),
    [draft, idMap]
  );
  const canOpen = draft != null && allItemsMapped(draft, idMap);

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

  const setMappedId = (dayIdx: number, itemIdx: number, exerciseId: number) => {
    setIdMap((prev) => ({ ...prev, [itemMapKey(dayIdx, itemIdx)]: exerciseId }));
  };

  const createMissing = async (dayIdx: number, itemIdx: number, item: PlanImportItem) => {
    const key = itemMapKey(dayIdx, itemIdx);
    setCreatingKey(key);
    setError(null);
    try {
      const created = await api.exercises.create({
        ...DEFAULT_EXERCISE_INPUT,
        name: item.exerciseName,
        type: item.measureType === "time" || item.measureType === "distance" ? item.measureType : "reps",
        defaultSets: item.sets ?? 3,
        defaultReps: item.reps ?? 10,
        defaultRepDurationSeconds: item.repDurationSeconds,
        defaultDistanceMeters: item.distanceMeters,
        defaultLoadKg: item.loadKg,
      });
      setExercises((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name, "pl")));
      setMappedId(dayIdx, itemIdx, created.id);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setCreatingKey(null);
    }
  };

  const openInBuilder = () => {
    if (!draft || !canOpen) return;
    const handoff = draftToBuilderHandoff(draft, idMap, exercises);
    saveImportHandoff(handoff);
    router.push("/plans/new");
  };

  return (
    <div className="mx-auto max-w-3xl">
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
              <div className="flex shrink-0 flex-wrap gap-2">
                <Badge tone={unmapped === 0 ? "positive" : "neutral"}>
                  {unmapped === 0 ? "Wszystko dopasowane" : `${unmapped} bez dopasowania`}
                </Badge>
                <Badge tone="accent">
                  {draft.days?.length ?? 0} dni ·{" "}
                  {draft.days?.reduce((s, d) => s + (d.items?.length ?? 0), 0) ?? 0} poz.
                </Badge>
              </div>
            </div>
          </Card>

          {(draft.days ?? []).length === 0 ? (
            <EmptyState>Brak dni w odpowiedzi AI.</EmptyState>
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
                        <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
                          <select
                            className={`${inputClass} min-w-0 flex-1`}
                            value={mappedId ?? ""}
                            onChange={(e) => {
                              const v = Number(e.target.value);
                              if (Number.isFinite(v) && v > 0) setMappedId(di, ii, v);
                            }}
                          >
                            <option value="">— wybierz ćwiczenie —</option>
                            {exercises.map((e) => (
                              <option key={e.id} value={e.id}>
                                {e.name}
                              </option>
                            ))}
                          </select>
                          {mappedId == null && (
                            <Button
                              variant="secondary"
                              size="sm"
                              disabled={creatingKey === key}
                              onClick={() => void createMissing(di, ii, it)}
                            >
                              {creatingKey === key ? "Tworzę…" : "Utwórz w bibliotece"}
                            </Button>
                          )}
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
