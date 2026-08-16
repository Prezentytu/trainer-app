"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  api,
  ClientDetails,
  Exercise,
  HistoryImportDraft,
  HistoryImportAnalyzeResult,
  HistoryImportSession,
  isAbortError,
} from "@/lib/api";
import { DEFAULT_EXERCISE_INPUT } from "@/lib/exerciseDraft";
import { createOrReuseExercise } from "@/lib/exerciseLibrary";
import { foldDiacritics } from "@/lib/exerciseSearch";
import { fileToHistoryImage, HISTORY_IMPORT_MAX_IMAGES } from "@/lib/compressImage";
import {
  countUnmappedSessions,
  resolvedExerciseId,
  sessionExKey,
  shiftIdMapAfterRemove,
  toWorkoutSessions,
} from "@/lib/historyImportMap";
import {
  historyImportFailMessage,
  historyImportTimeoutMessage,
  historyImportTimeoutMs,
  historyImportWaitCopy,
  HistoryImportWaitPhase,
} from "@/lib/historyImportWait";
import { parseSetList } from "@/lib/setList";
import {
  draftToBuilderHandoff,
  ExerciseIdMap,
  itemMapKey,
  saveImportHandoff,
} from "@/lib/planImportHandoff";
import { HistoryImportReview } from "@/components/HistoryImportReview";
import { ImportWaitStatus } from "@/components/ImportWaitStatus";
import { Icon } from "@/components/Icon";
import { polishRecordCount, polishTrainingCount } from "@/lib/plural";
import {
  Button,
  ErrorBanner,
  Field,
  IconButton,
  PageHeader,
  SegmentedControl,
  Switch,
  inputClass,
} from "@/components/ui";

type Step = "upload" | "review" | "save" | "done";

type PickedImage = { file: File; url: string };

function readTextFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Nie udało się odczytać pliku."));
    reader.readAsText(file);
  });
}

function firstNameOf(name: string | undefined): string | null {
  const first = name?.trim().split(/\s+/)[0];
  return first || null;
}

function polishPlural(n: number, one: string, few: string, many: string): string {
  const abs = Math.abs(n) % 100;
  const last = abs % 10;
  if (abs === 1) return one;
  if (last >= 2 && last <= 4 && (abs < 12 || abs > 14)) return few;
  return many;
}

export default function ClientHistoryImportPage() {
  const params = useParams<{ id: string }>();
  const clientId = Number(params.id);
  const router = useRouter();

  const [step, setStep] = useState<Step>("upload");
  const [client, setClient] = useState<ClientDetails | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [text, setText] = useState("");
  const [images, setImages] = useState<PickedImage[]>([]);
  const imagesRef = useRef<PickedImage[]>([]);
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [sessions, setSessions] = useState<HistoryImportSession[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [idMap, setIdMap] = useState<Record<string, number>>({});
  const [saveHistory, setSaveHistory] = useState(true);
  const [saveMaxes, setSaveMaxes] = useState(true);
  const [savePlan, setSavePlan] = useState(true);
  const [topKgDelta, setTopKgDelta] = useState("2.5");
  const [analyze, setAnalyze] = useState<HistoryImportAnalyzeResult | null>(null);
  const [applied, setApplied] = useState<{ sessions: number; maxes: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [parsePhase, setParsePhase] = useState<HistoryImportWaitPhase | null>(null);
  const [compressDone, setCompressDone] = useState(0);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [textOpen, setTextOpen] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const cancelReasonRef = useRef<"user" | "timeout" | null>(null);
  const actionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!Number.isFinite(clientId)) return;
    Promise.all([api.clients.get(clientId), api.exercises.list()])
      .then(([c, ex]) => {
        setClient(c);
        setExercises(ex);
      })
      .catch((e: Error) => setError(e.message));
  }, [clientId]);

  const applyDraft = (draft: HistoryImportDraft) => {
    const list = draft.sessions ?? [];
    setSessions(list);
    setWarnings(draft.warnings ?? []);
    const next: Record<string, number> = {};
    list.forEach((s, si) => {
      s.exercises.forEach((e, ei) => {
        if (e.matchedExerciseId != null) next[sessionExKey(si, ei)] = e.matchedExerciseId;
      });
    });
    setIdMap(next);
  };

  useEffect(() => {
    if (!Number.isFinite(clientId)) return;
    api.clients
      .historyImportPending(clientId)
      .then((row) => {
        if (!row?.draft?.sessions?.length) return;
        setPendingId(row.id);
        applyDraft(row.draft);
        setStep("review");
      })
      .catch(() => undefined);
  }, [clientId]);

  useEffect(() => {
    imagesRef.current = images;
  }, [images]);

  useEffect(() => {
    return () => {
      imagesRef.current.forEach((item) => URL.revokeObjectURL(item.url));
    };
  }, []);

  useEffect(() => {
    if (!busy) return;
    const started = Date.now();
    const id = window.setInterval(() => {
      setElapsedSec(Math.floor((Date.now() - started) / 1000));
    }, 1000);
    return () => window.clearInterval(id);
  }, [busy]);

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  useEffect(() => {
    if (!error) return;
    actionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [error]);

  const unmapped = useMemo(() => countUnmappedSessions(sessions, idMap), [sessions, idMap]);

  const mappedDraft = (): HistoryImportDraft => ({
    sessions: sessions.map((s, si) => ({
      ...s,
      exercises: s.exercises.map((e, ei) => ({
        ...e,
        matchedExerciseId: resolvedExerciseId(s, si, ei, idMap),
      })),
    })),
    warnings,
  });

  const persistDraft = async () => {
    if (pendingId == null) return;
    try {
      await api.clients.updateHistoryImport(clientId, pendingId, mappedDraft());
    } catch {
      /* review zostaje w pamięci — kolejny zapis spróbuje ponownie */
    }
  };

  useEffect(() => {
    if (step !== "review" || pendingId == null) return;
    const draft: HistoryImportDraft = {
      sessions: sessions.map((s, si) => ({
        ...s,
        exercises: s.exercises.map((e, ei) => ({
          ...e,
          matchedExerciseId: resolvedExerciseId(s, si, ei, idMap),
        })),
      })),
      warnings,
    };
    const timer = window.setTimeout(() => {
      void api.clients.updateHistoryImport(clientId, pendingId, draft).catch(() => undefined);
    }, 700);
    return () => window.clearTimeout(timer);
  }, [step, pendingId, clientId, sessions, idMap, warnings]);

  const mapExercise = (sessionIdx: number, exerciseIdx: number, exercise: Exercise) => {
    const source = foldDiacritics(sessions[sessionIdx]?.exercises[exerciseIdx]?.exerciseName ?? "");
    setIdMap((prev) => {
      const next = { ...prev, [sessionExKey(sessionIdx, exerciseIdx)]: exercise.id };
      if (!source) return next;
      sessions.forEach((s, si) => {
        s.exercises.forEach((e, ei) => {
          if (si === sessionIdx && ei === exerciseIdx) return;
          const key = sessionExKey(si, ei);
          if (next[key] != null || e.matchedExerciseId != null) return;
          if (foldDiacritics(e.exerciseName) === source) next[key] = exercise.id;
        });
      });
      return next;
    });
    setExercises((prev) => {
      if (prev.some((e) => e.id === exercise.id)) return prev;
      return [...prev, exercise].sort((a, b) => a.name.localeCompare(b.name, "pl"));
    });
  };

  const createMissing = async () => {
    setBusy(true);
    setError(null);
    try {
      const next = { ...idMap };
      for (let si = 0; si < sessions.length; si++) {
        for (let ei = 0; ei < sessions[si].exercises.length; ei++) {
          if (resolvedExerciseId(sessions[si], si, ei, next) != null) continue;
          const name = sessions[si].exercises[ei].exerciseName.trim();
          if (!name) continue;
          const { exercise } = await createOrReuseExercise({
            ...DEFAULT_EXERCISE_INPUT,
            name,
          });
          next[sessionExKey(si, ei)] = exercise.id;
          setExercises((prev) =>
            prev.some((e) => e.id === exercise.id)
              ? prev
              : [...prev, exercise].sort((a, b) => a.name.localeCompare(b.name, "pl")),
          );
        }
      }
      setIdMap(next);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const handleParse = async () => {
    if (busy) return;
    cancelReasonRef.current = null;
    const controller = new AbortController();
    abortRef.current = controller;
    const imageCount = Math.min(images.length, HISTORY_IMPORT_MAX_IMAGES);
    const timeoutId = window.setTimeout(() => {
      cancelReasonRef.current = "timeout";
      controller.abort();
    }, historyImportTimeoutMs(imageCount));

    setBusy(true);
    setError(null);
    setElapsedSec(0);
    setCompressDone(0);
    setParsePhase(imageCount > 0 ? "compress" : "read");
    try {
      const encoded = [];
      const slice = images.slice(0, HISTORY_IMPORT_MAX_IMAGES);
      for (let i = 0; i < slice.length; i++) {
        if (controller.signal.aborted) throw new DOMException("Aborted", "AbortError");
        encoded.push(await fileToHistoryImage(slice[i].file));
        setCompressDone(i + 1);
      }
      setParsePhase("read");
      const draft = await api.ai.importHistory(
        {
          text: text.trim() || undefined,
          images: encoded.length ? encoded : undefined,
        },
        { signal: controller.signal },
      );
      if (!draft.sessions?.length) {
        setError("Nie wczytałem żadnego treningu. Sprawdź zdjęcia albo wklej tekst.");
        return;
      }
      applyDraft(draft);
      const saved = await api.clients.saveHistoryImport(clientId, draft);
      setPendingId(saved.id);
      setStep("review");
    } catch (e) {
      if (isAbortError(e)) {
        if (cancelReasonRef.current === "timeout") {
          setError(historyImportTimeoutMessage(imageCount));
        }
        return;
      }
      setError(historyImportFailMessage(e, imageCount));
    } finally {
      window.clearTimeout(timeoutId);
      if (abortRef.current === controller) abortRef.current = null;
      setBusy(false);
      setParsePhase(null);
    }
  };

  const cancelParse = () => {
    cancelReasonRef.current = "user";
    abortRef.current?.abort();
  };

  const handleFiles = (list: FileList | null) => {
    if (busy) return;
    if (!list?.length) return;
    const incoming = [...list];
    const csv = incoming.find((f) => f.name.toLowerCase().endsWith(".csv"));
    if (csv) {
      void readTextFile(csv)
        .then((t) => {
          setText(t);
          setTextOpen(true);
          setError(null);
        })
        .catch((e: Error) => setError(e.message));
      return;
    }
    const incomingImages = incoming
      .filter((f) => f.type.startsWith("image/"))
      .map((file) => ({ file, url: URL.createObjectURL(file) }));
    setImages((prev) => {
      const merged = [...prev, ...incomingImages];
      if (merged.length > HISTORY_IMPORT_MAX_IMAGES) {
        merged.slice(HISTORY_IMPORT_MAX_IMAGES).forEach((item) => URL.revokeObjectURL(item.url));
      }
      return merged.slice(0, HISTORY_IMPORT_MAX_IMAGES);
    });
    setError(null);
  };

  const removeFile = (idx: number) => {
    if (busy) return;
    setImages((prev) => {
      const victim = prev[idx];
      if (victim) URL.revokeObjectURL(victim.url);
      return prev.filter((_, i) => i !== idx);
    });
  };

  const patchSession = (idx: number, patch: Partial<HistoryImportSession>) => {
    setSessions((prev) => prev.map((s, i) => (i === idx ? { ...s, ...patch } : s)));
  };

  const removeSession = (idx: number) => {
    setSessions((prev) => prev.filter((_, i) => i !== idx));
    setIdMap((prev) => shiftIdMapAfterRemove(prev, idx));
  };

  const patchSets = (si: number, ei: number, raw: string) => {
    const parsed = parseSetList(raw);
    if (!parsed) return;
    setSessions((prev) =>
      prev.map((s, i) => {
        if (i !== si) return s;
        const exercises = s.exercises.map((e, j) =>
          j === ei
            ? {
                ...e,
                sets: parsed.map((p) => ({
                  reps: p.reps,
                  weightKg: p.loadKg,
                  isBodyweight: p.isBodyweight,
                })),
              }
            : e,
        );
        return { ...s, exercises };
      }),
    );
  };

  const goSave = async () => {
    if (unmapped > 0) {
      setError("Dodaj brakujące ćwiczenia do biblioteki, zanim zapiszesz.");
      return;
    }
    const missingDate = sessions.some((s) => !s.performedOn);
    if (saveHistory && missingDate) {
      setError("Każdy trening potrzebuje daty.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await persistDraft();
      const result = await api.ai.analyzeHistory({
        sessions: sessions.map((s, si) => ({
          ...s,
          exercises: s.exercises.map((e, ei) => ({
            ...e,
            matchedExerciseId: resolvedExerciseId(s, si, ei, idMap),
          })),
        })),
        clientName: client?.name,
        topKgDelta: Number(topKgDelta) || 0,
      });
      setAnalyze(result);
      setStep("save");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const handleConfirm = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      let importId = pendingId;
      if (importId == null) {
        const saved = await api.clients.saveHistoryImport(clientId, { sessions, warnings });
        importId = saved.id;
        setPendingId(importId);
      }
      const mappedSessions = sessions.map((s, si) => ({
        ...s,
        exercises: s.exercises.map((e, ei) => ({
          ...e,
          matchedExerciseId: resolvedExerciseId(s, si, ei, idMap),
        })),
      }));
      if (saveHistory || saveMaxes) {
        const result = await api.clients.applyHistoryImport(clientId, importId, {
          saveHistory,
          saveMaxes,
          sessions: saveHistory ? toWorkoutSessions(clientId, mappedSessions, idMap) : [],
          maxes: saveMaxes
            ? (analyze?.suggestedMaxes ?? []).map((m) => ({
                exerciseId: m.exerciseId,
                maxKg: m.maxKg,
                measuredOn: m.measuredOn,
                note: "z historii",
              }))
            : [],
        });
        setApplied({ sessions: result.sessionIds.length, maxes: result.maxIds.length });
      } else if (importId != null) {
        await api.clients.dismissHistoryImport(clientId, importId);
        setApplied({ sessions: 0, maxes: 0 });
      }
      setStep("done");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const goToPlan = async () => {
    setBusy(true);
    setError(null);
    try {
      let draft = analyze?.planDraft ?? null;
      if (!draft) {
        const result = await api.clients.planFromHistory(clientId, {
          topKgDelta: Number(topKgDelta) || 0,
        });
        draft = result.planDraft;
      }
      if (!draft) {
        setError("Nie udało się złożyć planu z tych treningów.");
        return;
      }
      const planMap: ExerciseIdMap = {};
      draft.days?.forEach((day, di) => {
        day.items?.forEach((it, ii) => {
          if (it.matchedExerciseId != null) planMap[itemMapKey(di, ii)] = it.matchedExerciseId;
        });
      });
      saveImportHandoff(
        draftToBuilderHandoff(draft, planMap, exercises, { isTemplate: false, clientId }),
      );
      router.push(`/plans/new?clientId=${clientId}`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const firstName = firstNameOf(client?.name);
  const title =
    step === "upload"
      ? "Wrzuć zdjęcia treningów"
      : step === "review"
        ? "Czy to się zgadza?"
        : step === "done"
          ? "Historia zapisana"
          : firstName
            ? `Co zapisać u ${firstName}`
            : "Co zapisać";
  const subtitle =
    step === "review"
      ? `${client?.name ?? "Klient"} · ${polishTrainingCount(sessions.length)}. Popraw to, co nie pasuje do zdjęcia.`
      : step === "done"
        ? client
          ? `${client.name} — treningi są już w historii.`
          : "Treningi są już w historii."
        : client
          ? `${client.name} — historia z poprzedniej apki.`
          : "Historia klienta z poprzedniej apki.";
  const stepLabel =
    step === "upload"
      ? "Krok 1 z 3"
      : step === "review"
        ? "Krok 2 z 3"
        : step === "save"
          ? "Krok 3 z 3"
          : "Gotowe";

  return (
    <div>
      <p className="t-label mb-2 text-muted">{stepLabel}</p>
      <PageHeader
        title={title}
        subtitle={subtitle}
        action={
          <Link href={`/clients/${clientId}`}>
            <Button variant="ghost">Wróć do profilu</Button>
          </Link>
        }
      />
      {step !== "upload" ? <ErrorBanner message={error} /> : null}

      {step === "upload" ? (
        <div className="grid gap-6">
          <label
            aria-disabled={busy || undefined}
            className={`flex min-h-64 flex-col items-center justify-center gap-3 rounded-[10px] border border-dashed px-6 py-12 text-center transition-[border-color,background-color,box-shadow,opacity] duration-[var(--dur-fast)] ease-[var(--ease-out)] has-[:focus-visible]:shadow-[var(--focus-ring)] sm:min-h-80 ${
              busy
                ? "pointer-events-none cursor-default opacity-45"
                : "cursor-pointer"
            } ${
              dragOver
                ? "border-foreground bg-surface-hover"
                : "border-border-strong bg-surface hover:border-foreground hover:bg-surface-hover"
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={(e) => {
              if (e.currentTarget.contains(e.relatedTarget as Node)) return;
              setDragOver(false);
            }}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              handleFiles(e.dataTransfer.files);
            }}
          >
            <input
              className="sr-only"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,.csv"
              multiple
              disabled={busy}
              onChange={(e) => {
                handleFiles(e.target.files);
                e.target.value = "";
              }}
            />
            <span className="text-muted">
              <Icon name="image" size={36} decorative />
            </span>
            <span className="text-base font-medium text-foreground">
              Przeciągnij screeny albo kliknij i wybierz z dysku
            </span>
            <span className="text-sm text-muted">
              JPG, PNG, WebP albo CSV z dziennika · maks. {HISTORY_IMPORT_MAX_IMAGES} zdjęć
            </span>
          </label>

          {images.length > 0 ? (
            <div>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                {images.map((item, i) => (
                  <div
                    key={`${item.file.name}-${item.url}`}
                    className="relative aspect-square overflow-hidden rounded-[10px] bg-surface-raised"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element -- blob URL z createObjectURL */}
                    <img src={item.url} alt="" className="h-full w-full object-cover" />
                    {busy ? null : (
                      <div className="absolute right-1 top-1">
                        <IconButton title="Usuń zdjęcie" size="sm" variant="outline" onClick={() => removeFile(i)}>
                          <Icon name="x" size={14} decorative />
                        </IconButton>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <p className="mt-2 text-sm text-muted">
                {images.length} {polishPlural(images.length, "zdjęcie", "zdjęcia", "zdjęć")}
                {images.length >= HISTORY_IMPORT_MAX_IMAGES ? ` · maks. ${HISTORY_IMPORT_MAX_IMAGES}` : ""}
              </p>
            </div>
          ) : null}

          {textOpen || text.trim().length > 0 ? (
            <Field label="Wklej tekst (8 x 30kg, 8 x 35kg)">
              <textarea
                className={`${inputClass} min-h-40 font-mono text-sm`}
                value={text}
                disabled={busy}
                onChange={(e) => setText(e.target.value)}
                placeholder="02.07.2026 · nogi&#10;Wyciskanie żołnierskie&#10;8 x 30kg, 8 x 35kg, 8 x 40kg"
              />
            </Field>
          ) : (
            <div>
              <Button variant="ghost" onClick={() => setTextOpen(true)} disabled={busy}>
                Nie masz screenów? Wklej tekst albo CSV
              </Button>
            </div>
          )}

          <div ref={actionRef} className="grid gap-3">
            <ErrorBanner message={error} />
            {busy && parsePhase ? (
              <ImportWaitStatus
                {...historyImportWaitCopy({
                  phase: parsePhase,
                  imageCount: images.length,
                  compressDone,
                  elapsedSec,
                })}
                elapsedSec={elapsedSec}
              />
            ) : (
              <p className="text-sm text-muted">
                {images.length === 0 && text.trim().length < 10
                  ? "Dodaj zdjęcia albo wklej tekst, żeby zacząć."
                  : images.length > 0
                    ? "Odczytam treningi ze zdjęć — przed zapisem wszystko sprawdzisz."
                    : "Odczytam treningi z wklejki — przed zapisem wszystko sprawdzisz."}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-2">
              <Button
                onClick={() => void handleParse()}
                disabled={busy || (images.length === 0 && text.trim().length < 10)}
                loading={busy}
              >
                {busy ? (images.length > 0 ? "Czytam zdjęcia…" : "Czytam treningi…") : "Wczytaj treningi"}
              </Button>
              {busy ? (
                <Button variant="ghost" onClick={cancelParse}>
                  Przerwij
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {step === "review" ? (
        <HistoryImportReview
          sessions={sessions}
          exercises={exercises}
          idMap={idMap}
          warnings={warnings}
          unmapped={unmapped}
          busy={busy}
          onMapExercise={mapExercise}
          onCreateExercise={async (input) => {
            const { exercise } = await createOrReuseExercise(input);
            return exercise;
          }}
          onCreateMissing={() => void createMissing()}
          onPatchSession={patchSession}
          onPatchSets={patchSets}
          onRemoveSession={removeSession}
          onBack={() => {
            void persistDraft().then(() => setStep("upload"));
          }}
          onContinue={() => void goSave()}
        />
      ) : null}

      {step === "save" ? (
        <div className="grid gap-6">
          {analyze?.hasTestWeek ? (
            <p className="text-sm text-foreground-secondary">
              Ostatnie treningi wyglądają na tydzień testu (mało ćwiczeń, singlety). Kolejny plan biorę z
              ostatniego pełnego dnia, nie z testu.
            </p>
          ) : null}
          <div className="grid gap-4">
            <Switch
              label="Zapisz historię jako ukończone treningi"
              checked={saveHistory}
              onChange={setSaveHistory}
            />
            <Switch
              label={
                analyze?.suggestedMaxes.length
                  ? `Zapisz rekordy (${analyze.suggestedMaxes.length})`
                  : "Zapisz rekordy"
              }
              checked={saveMaxes}
              onChange={setSaveMaxes}
              disabled={!analyze?.suggestedMaxes.length}
            />
            <Switch
              label="Złóż kolejny plan na podstawie tych treningów"
              checked={savePlan}
              onChange={setSavePlan}
            />
          </div>
          {savePlan ? (
            <Field label="Na najcięższej serii">
              <SegmentedControl
                value={topKgDelta}
                onChange={(v) => {
                  setTopKgDelta(v);
                  if (analyze) {
                    void api.ai
                      .analyzeHistory({
                        sessions,
                        clientName: client?.name,
                        topKgDelta: Number(v) || 0,
                      })
                      .then(setAnalyze)
                      .catch((e: Error) => setError(e.message));
                  }
                }}
                items={[
                  { value: "0", label: "Bez zmian" },
                  { value: "2.5", label: "+2,5 kg" },
                ]}
              />
            </Field>
          ) : null}
          {analyze?.clusters.length ? (
            <p className="text-sm text-muted">
              {analyze.clusters.length}{" "}
              {polishPlural(analyze.clusters.length, "dzień", "dni", "dni")} w tygodniu
              {analyze.clusters.map((c) => ` · ${c.label}`).join("")}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <Button variant="ghost" onClick={() => setStep("review")} disabled={busy}>
              Wróć do treningów
            </Button>
            <Button
              onClick={() => void handleConfirm()}
              disabled={busy || (!saveHistory && !saveMaxes && !savePlan)}
              loading={busy}
            >
              {busy ? "Zapisuję…" : "Zatwierdź"}
            </Button>
          </div>
        </div>
      ) : null}

      {step === "done" ? (
        <div className="grid gap-6">
          <p className="text-[15px] leading-snug text-foreground-secondary">
            {applied && applied.sessions > 0 && applied.maxes > 0
              ? `Zapisałem ${polishTrainingCount(applied.sessions)} i ${polishRecordCount(applied.maxes)}.`
              : applied && applied.sessions > 0
                ? `Zapisałem ${polishTrainingCount(applied.sessions)}.`
                : applied && applied.maxes > 0
                  ? `Zapisałem ${polishRecordCount(applied.maxes)}.`
                  : "Draft planu jest gotowy — historia nie została zapisana."}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => void goToPlan()} disabled={busy} loading={busy}>
              Złóż plan z tych treningów
            </Button>
            <Link href={`/clients/${clientId}`}>
              <Button variant="secondary">Wróć do profilu</Button>
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
