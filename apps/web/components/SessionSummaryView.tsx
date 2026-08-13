"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { api, ProgressReport, SessionCheckinInput, SessionDetail } from "@/lib/api";
import { Button, SegmentedControl, Sheet, StatBlock, inputClass } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { formatKg } from "@/lib/plates";
import { formatSetLoadReps } from "@/lib/weight";
import { parseShareVariant, type ShareVariant } from "@/lib/shareCard";
import { PerformedExerciseList } from "@/components/session/PerformedExerciseList";

function formatDay(iso: string): string {
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("pl-PL", { day: "numeric", month: "short", year: "numeric" });
}

function formatDurationClock(seconds: number | null): string {
  const sec = seconds ?? 0;
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function prHeadline(count: number): string {
  if (count === 1) return "Rekord osobisty";
  if (count >= 2 && count <= 4) return `${count} rekordy`;
  return `${count} rekordów`;
}

function variantLabel(v: ShareVariant): string {
  if (v === "pr") return "Rekord";
  if (v === "story") return "Story";
  return "Statystyki";
}

async function shareOrDownload(blob: Blob, title: string, preferShare: boolean) {
  const file = new File([blob], "trening-repmaxer.png", { type: "image/png" });
  if (preferShare) {
    const canFiles =
      typeof navigator !== "undefined" &&
      typeof navigator.canShare === "function" &&
      navigator.canShare({ files: [file] });
    if (canFiles && typeof navigator.share === "function") {
      await navigator.share({ files: [file], title, text: title });
      return;
    }
  }
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = "trening-repmaxer.png";
  a.click();
  URL.revokeObjectURL(objectUrl);
}

export function SessionSummaryView({
  session,
  onBack,
  onEdit,
  shareImageUrl,
  fromHistory = false,
  facts,
  portalToken,
  onSessionPatched,
}: {
  session: SessionDetail;
  onBack: () => void;
  onEdit: () => void;
  /** Relative path do PNG (bez ujawniania tokenu przez share URL). */
  shareImageUrl?: string | null;
  /** Wejście z zakładki historii — górny back „Historia”, CTA wraca do listy. */
  fromHistory?: boolean;
  facts?: ProgressReport["facts"];
  portalToken?: string;
  onSessionPatched?: (next: SessionDetail) => void;
}) {
  const hasPrs = session.prs.length > 0;
  const [sheetOpen, setSheetOpen] = useState(false);
  const [variant, setVariant] = useState<ShareVariant>(() =>
    parseShareVariant(hasPrs ? "pr" : "stats", hasPrs),
  );
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);
  const blobCache = useRef<Map<ShareVariant, Blob>>(new Map());
  const [feeling, setFeeling] = useState<number | null>(session.feelingScore);
  const [note, setNote] = useState(session.note ?? "");
  const [checkinBusy, setCheckinBusy] = useState(false);
  const showFeeling = Boolean(portalToken) && !fromHistory;

  const doneTotal = session.exercises.reduce(
    (acc, ex) => {
      const done = ex.sets.filter((s) => s.completed).length;
      return { done: acc.done + done, total: acc.total + ex.sets.length };
    },
    { done: 0, total: 0 },
  );
  const volume = Math.round(session.totalVolumeKg).toLocaleString("pl-PL");
  const shareTitle = `${session.dayLabel ?? "Trening"}${session.planName ? ` · ${session.planName}` : ""}`;

  const previewSrc = useMemo(() => {
    if (!shareImageUrl) return null;
    const base = shareImageUrl.split("?")[0];
    return `${base}?v=${variant}`;
  }, [shareImageUrl, variant]);
  const previewReady = loadedSrc === previewSrc;

  const segmentItems = useMemo(() => {
    const items: { value: ShareVariant; label: string }[] = [
      { value: "stats", label: "Statystyki" },
    ];
    if (hasPrs) items.push({ value: "pr", label: "Rekord" });
    items.push({ value: "story", label: "Story" });
    return items;
  }, [hasPrs]);

  const ensureBlob = useCallback(async (): Promise<Blob> => {
    if (!previewSrc) throw new Error("Brak karty do udostępnienia.");
    const cached = blobCache.current.get(variant);
    if (cached) return cached;
    const blob = await api.shareSessionCardBlob(previewSrc);
    blobCache.current.set(variant, blob);
    return blob;
  }, [previewSrc, variant]);

  const runShare = useCallback(
    async (preferShare: boolean) => {
      setSharing(true);
      setShareError(null);
      try {
        const blob = await ensureBlob();
        await shareOrDownload(blob, shareTitle, preferShare);
      } catch (e) {
        const err = e as Error;
        if (err.name === "AbortError") return;
        setShareError(err.message || "Nie udało się udostępnić.");
      } finally {
        setSharing(false);
      }
    },
    [ensureBlob, shareTitle],
  );

  const saveFeeling = async (score: number) => {
    if (!portalToken) return;
    setFeeling(score);
    setCheckinBusy(true);
    try {
      const input: SessionCheckinInput = {
        feelingScore: score,
        sleepScore: session.sleepScore,
        energyScore: session.energyScore,
      };
      const next = await api.portal.checkinSession(portalToken, session.id, input);
      onSessionPatched?.(next);
    } catch {
      /* zostaw lokalny wybór */
    } finally {
      setCheckinBusy(false);
    }
  };

  const saveNote = async () => {
    if (!portalToken) return;
    const trimmed = note.trim();
    if (trimmed === (session.note ?? "")) return;
    setCheckinBusy(true);
    try {
      const next = await api.portal.updateSession(portalToken, session.id, {
        clientId: session.clientId,
        performedOn: session.performedOn,
        assignmentId: session.assignmentId,
        planDayId: session.planDayId,
        planId: session.planId,
        durationSeconds: session.durationSeconds,
        note: trimmed || null,
        status: session.status,
        exercises: session.exercises.map((e) => ({
          id: e.id > 0 ? e.id : null,
          exerciseId: e.exerciseId,
          substitutedFromExerciseId: e.substitutedFromExerciseId ?? null,
          order: e.order,
          note: e.note,
          sets: e.sets.map((s) => ({
            id: s.id > 0 ? s.id : null,
            setNumber: s.setNumber,
            weightKg: s.weightKg,
            reps: s.reps,
            durationSeconds: s.durationSeconds,
            distanceMeters: s.distanceMeters,
            rir: s.rir,
            rpe: s.rpe,
            isWarmup: s.isWarmup,
            completed: s.completed,
            note: s.note ?? null,
            side: s.side ?? null,
          })),
        })),
      });
      onSessionPatched?.(next);
    } catch {
      /* ignore */
    } finally {
      setCheckinBusy(false);
    }
  };

  const highlightFacts = (facts ?? []).slice(0, 3);

  const aspectClass = variant === "story" ? "aspect-[9/16]" : "aspect-[4/5]";

  return (
    // pb pod sticky bar (CTA + share + safe area) — treść przewija się pod chrome, nic nie ginie
    <div className="mx-auto max-w-lg space-y-8 pb-44">
      <header>
        {fromHistory ? (
          // Drill-in z listy (Jakob's Law): back u góry-lewej, tap ≥44px, wyjście tą samą drogą
          <button
            type="button"
            onClick={onBack}
            className="-ml-2 mb-3 inline-flex min-h-11 items-center gap-1 rounded-[10px] px-2 text-sm font-medium text-muted transition-[color,transform] duration-[var(--dur-fast)] ease-[var(--ease-out)] hover:text-foreground focus-visible:outline-none focus-visible:shadow-[var(--focus-ring)] active:scale-[0.97]"
          >
            <Icon name="caret-left" size={16} decorative />
            Historia
          </button>
        ) : null}
        <p className="text-xs font-medium uppercase tracking-caps text-muted">Trening ukończony</p>
        <h1 className="mt-2 break-words font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          {session.dayLabel ?? "Trening"}
        </h1>
        <p className="mt-1.5 text-sm text-muted">
          {formatDay(session.performedOn)}
          {session.planName ? ` · ${session.planName}` : ""}
        </p>
      </header>

      {hasPrs ? (
        // Celebracja samą typografią (Styrka: odejmowanie) — bez boxa. Złoto na danych:
        // wynik rekordu w text-pr (spójnie z SessionReview / kartą klienta), jedna dominanta
        // na widoku (Peak-End). Szacowany max w osobnej linii — nie konkuruje z bohaterem.
        // Animacja wejścia tylko przy świeżym ukończeniu — przegląd archiwum bez celebracji
        <section
          aria-label={prHeadline(session.prs.length)}
          className={fromHistory ? undefined : "pr-celebrate-in"}
        >
          <p className="font-mono text-xs font-medium uppercase tracking-caps text-pr">
            ★ {prHeadline(session.prs.length)}
          </p>
          <ul className="mt-3 space-y-6">
            {session.prs.map((p) => {
              const ex = session.exercises.find((e) => e.exerciseId === p.exerciseId);
              const loadReps =
                p.weightKg != null && p.reps != null
                  ? formatSetLoadReps(p.weightKg, p.reps, ex)
                  : "—";
              const delta =
                p.estimated1Rm != null && p.previousBest1Rm != null
                  ? Math.round((p.estimated1Rm - p.previousBest1Rm) * 10) / 10
                  : null;
              return (
                <li key={`${p.exerciseId}-${p.setNumber}`}>
                  <p className="break-words text-[15px] font-medium leading-snug text-foreground">
                    {p.exerciseName}
                  </p>
                  <p className="mt-1 font-mono text-4xl font-semibold tabular-nums tracking-tight text-pr">
                    {loadReps}
                  </p>
                  {p.estimated1Rm != null ? (
                    <p className="mt-1.5 font-mono text-sm tabular-nums text-muted">
                      Szacowany max {formatKg(p.estimated1Rm)} kg
                      {delta != null && delta > 0 ? (
                        <span className="text-gain"> ▲ +{formatKg(delta)}</span>
                      ) : null}
                    </p>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {highlightFacts.length > 0 ? (
        <section aria-label="Twój progres">
          <p className="font-mono text-xs font-medium uppercase tracking-caps text-muted">
            Twój progres
          </p>
          <ul className="mt-3 space-y-3">
            {highlightFacts.map((fact, index) => {
              const isHero = !hasPrs && index === 0;
              const prTone = fact.kind === "pr";
              const gainTone =
                fact.kind === "gain" || (fact.deltaKg != null && fact.deltaKg > 0);
              const text =
                prTone && !String(fact.text).includes("★")
                  ? `★ ${fact.text}`
                  : gainTone
                    ? `▲ ${fact.text}`
                    : fact.text;
              return (
                <li
                  key={`${fact.kind}-${index}`}
                  className={
                    isHero
                      ? "text-[1.375rem] font-semibold leading-snug tracking-tight text-foreground"
                      : prTone
                        ? "text-[15px] font-medium leading-snug text-pr"
                        : "text-[15px] leading-snug text-foreground-secondary"
                  }
                >
                  {text}
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      <section
        aria-label="Podsumowanie"
        className="grid grid-cols-3 gap-3 border-y border-border py-5"
      >
        <StatBlock label="Czas" value={formatDurationClock(session.durationSeconds)} />
        <StatBlock label="Objętość" value={volume} unit="kg" />
        <StatBlock label="Serie" value={`${doneTotal.done}/${doneTotal.total}`} />
      </section>

      {showFeeling ? (
        <section aria-label="Samopoczucie">
          <p className="font-mono text-xs font-medium uppercase tracking-caps text-muted">
            Samopoczucie
          </p>
          <p className="mt-1 text-sm text-muted">Opcjonalnie — sen zostaje na ekranie Dziś.</p>
          <div className="mt-3 grid grid-cols-5 gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                disabled={checkinBusy}
                onClick={() => void saveFeeling(n)}
                className={`min-h-11 rounded-[8px] border py-2 font-mono text-sm font-semibold tabular-nums transition-colors ${
                  feeling === n
                    ? "border-accent-border bg-accent-dim text-foreground"
                    : "border-border-strong text-muted hover:border-border-strong hover:bg-surface-hover"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
          <textarea
            className={`${inputClass} mt-3 min-h-[72px] resize-none py-3`}
            placeholder="Wiadomość do trenera (opcjonalnie)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onBlur={() => void saveNote()}
            rows={2}
          />
        </section>
      ) : null}

      <div>
        <PerformedExerciseList session={session} />
        {/* Korekta w kontekście wyników (grouping & mapping) — nie konkuruje z głównym CTA */}
        <div className="mt-2">
          <Button variant="ghost" onClick={onEdit}>
            Popraw wyniki
          </Button>
        </div>
      </div>

      {session.note && !showFeeling ? (
        <section>
          <p className="font-mono text-xs font-medium uppercase tracking-caps text-muted">
            Wiadomość do trenera
          </p>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground-secondary">
            {session.note}
          </p>
        </section>
      ) : null}

      {/* Sticky CTA — zawsze w thumb zone; user nie musi wiedzieć, że trzeba scrollować */}
      <div
        className="session-chrome fixed inset-x-0 bottom-0 z-40 border-t border-border px-5 pt-3"
        style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
      >
        <div className="mx-auto flex w-full max-w-lg flex-col gap-2">
          {shareError && !sheetOpen ? (
            <p className="text-sm text-danger">{shareError}</p>
          ) : null}
          {shareImageUrl ? (
            <Button
              variant="secondary"
              full
              onClick={() => {
                setShareError(null);
                setVariant(parseShareVariant(hasPrs ? "pr" : "stats", hasPrs));
                setSheetOpen(true);
              }}
            >
              Udostępnij trening
            </Button>
          ) : null}
          <Button full size="lg" onClick={onBack}>
            {fromHistory ? "Wróć do historii" : "Wróć do ekranu głównego"}
          </Button>
        </div>
      </div>

      <Sheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="Udostępnij trening">
        <div className="space-y-4">
          <SegmentedControl
            full
            items={segmentItems}
            value={variant}
            onChange={(v) => setVariant(parseShareVariant(v, hasPrs))}
          />
          <div
            className={`relative mx-auto w-full max-w-[240px] max-h-[46vh] overflow-hidden rounded-xl border border-border bg-background ${aspectClass}`}
          >
            {!previewReady ? (
              <div className="absolute inset-0 skeleton-pulse bg-surface" aria-hidden />
            ) : null}
            {previewSrc ? (
              // eslint-disable-next-line @next/next/no-img-element -- same-origin PNG z ImageResponse
              <img
                key={previewSrc}
                src={previewSrc}
                alt={`Podgląd karty: ${variantLabel(variant)}`}
                className={`h-full w-full object-cover transition-opacity duration-[var(--dur-med)] ${
                  previewReady ? "opacity-100" : "opacity-0"
                }`}
                onLoad={() => setLoadedSrc(previewSrc)}
                onError={() => {
                  setLoadedSrc(null);
                  setShareError("Nie udało się załadować podglądu karty.");
                }}
              />
            ) : null}
          </div>
          {shareError ? <p className="text-sm text-danger">{shareError}</p> : null}
          <p className="text-center text-xs text-muted">
            {variant === "story"
              ? "Stories — duża objętość i top serie"
              : variant === "pr"
                ? "Rekord na pierwszym planie"
                : "Objętość i najlepsze serie"}
          </p>
          <div className="flex flex-col gap-2 pt-1">
            <Button full disabled={sharing || !previewReady} onClick={() => void runShare(true)}>
              {sharing ? "Przygotowuję…" : "Udostępnij"}
            </Button>
            <Button
              variant="ghost"
              full
              disabled={sharing || !previewReady}
              onClick={() => void runShare(false)}
            >
              Zapisz obraz
            </Button>
          </div>
        </div>
      </Sheet>
    </div>
  );
}
