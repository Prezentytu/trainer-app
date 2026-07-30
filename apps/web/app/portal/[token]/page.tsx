"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api, ClientRecord, PortalHome, PortalSessionSummary } from "@/lib/api";
import { ExerciseThumb } from "@/components/ExerciseThumb";
import { YoutubeLite } from "@/components/YoutubeLite";
import { Badge, Button, ErrorBanner, formatRest } from "@/components/ui";

type Tab = "today" | "week" | "history" | "records";

function formatDay(iso: string): string {
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("pl-PL", { day: "numeric", month: "short", year: "numeric" });
}

export default function PortalHomePage() {
  const params = useParams<{ token: string }>();
  const token = params.token;
  const router = useRouter();
  const [home, setHome] = useState<PortalHome | null>(null);
  const [history, setHistory] = useState<PortalSessionSummary[]>([]);
  const [records, setRecords] = useState<ClientRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [tab, setTab] = useState<Tab>("today");
  const [video, setVideo] = useState<{ id: string; title: string } | null>(null);

  const load = useCallback(() => {
    Promise.all([
      api.portal.home(token),
      api.portal.sessions(token).catch(() => [] as PortalSessionSummary[]),
      api.portal.records(token).catch(() => [] as ClientRecord[]),
    ])
      .then(([h, s, r]) => {
        setHome(h);
        setHistory(s);
        setRecords(r);
      })
      .catch((e: Error) => setError(e.message));
  }, [token]);

  useEffect(load, [load]);

  useEffect(() => {
    const href = `/portal/${token}/manifest.webmanifest`;
    let link = document.querySelector<HTMLLinkElement>('link[data-portal-manifest="1"]');
    if (!link) {
      link = document.createElement("link");
      link.rel = "manifest";
      link.dataset.portalManifest = "1";
      document.head.appendChild(link);
    }
    link.href = href;
  }, [token]);

  const start = async () => {
    if (!home?.today) return;
    setStarting(true);
    setError(null);
    try {
      if (home.inProgressSession) {
        router.push(`/portal/${token}/session/${home.inProgressSession.id}`);
        return;
      }
      const session = await api.portal.startSession(token, {
        clientId: home.client.id,
        assignmentId: home.today.assignmentId,
        planId: home.today.planId,
        planDayId: home.today.day.id,
      });
      router.push(`/portal/${token}/session/${session.id}`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setStarting(false);
    }
  };

  if (!home) {
    return (
      <div>
        <ErrorBanner message={error} />
        <p className="text-muted">Ładowanie…</p>
      </div>
    );
  }

  const today = home.today;
  const week = home.week ?? [];

  return (
    <div className="space-y-5">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">Workout Alchemist</p>
        <h1 className="font-display text-2xl font-bold">Cześć, {home.client.name.split(" ")[0]}</h1>
      </header>
      <ErrorBanner message={error} />

      <div
        role="tablist"
        aria-label="Nawigacja portalu"
        className="flex gap-1 rounded-xl border border-border bg-surface p-1"
      >
        {(
          [
            ["today", "Dziś"],
            ["week", "Tydzień"],
            ["history", "Historia"],
            ["records", "Rekordy"],
          ] as const
        ).map(([id, label]) => {
          const active = tab === id;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setTab(id)}
              className={`min-h-11 flex-1 rounded-lg px-2 py-2 text-xs transition-colors sm:text-sm ${
                active
                  ? "bg-accent-dim font-semibold text-accent-strong"
                  : "font-medium text-muted hover:text-foreground"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {video ? (
        <div className="rounded-xl border border-border bg-surface p-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-semibold">{video.title}</p>
            <button type="button" className="text-xs text-muted" onClick={() => setVideo(null)}>
              Zamknij
            </button>
          </div>
          <YoutubeLite youtubeId={video.id} title={video.title} autoplay />
        </div>
      ) : null}

      {tab === "today" ? (
        !today ? (
          <div className="rounded-2xl border border-border bg-surface p-5 text-muted">
            Nie masz aktywnego planu. Poproś trenera o przypisanie.
          </div>
        ) : (
          <>
            <div className="rounded-2xl border border-border bg-surface p-4">
              <div className="mb-2 flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">
                    Dzisiejszy trening
                  </p>
                  <h2 className="font-display text-xl font-bold">{today.day.label}</h2>
                  <p className="text-sm text-muted">{today.planName}</p>
                </div>
                <div className="text-right font-mono text-xs tabular-nums text-muted">
                  {today.completed} / {today.total}
                  <div className="mt-1 h-1.5 w-20 overflow-hidden rounded-full bg-surface-hover">
                    <div className="h-full rounded-full bg-accent" style={{ width: `${today.percent}%` }} />
                  </div>
                </div>
              </div>

              <ul className="mt-4 space-y-2">
                {today.day.items.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center gap-3 rounded-xl border border-border bg-surface-sunken px-3 py-2.5"
                  >
                    <button
                      type="button"
                      className="h-12 w-12 shrink-0"
                      onClick={() => {
                        if (item.demoYoutubeId) {
                          setVideo({ id: item.demoYoutubeId, title: item.exerciseName });
                        }
                      }}
                    >
                      <ExerciseThumb
                        variant="square"
                        youtubeId={item.demoYoutubeId}
                        category={item.category}
                        alt={item.exerciseName}
                      />
                    </button>
                    <div className="min-w-0 flex-1">
                      <p className="break-words text-sm font-semibold">{item.exerciseName}</p>
                      <p className="font-mono text-xs tabular-nums text-muted">
                        {item.sets}×{item.reps}
                        {item.loadKg != null ? ` · ${item.loadKg} kg` : ""}
                        {item.loadPercent != null && item.computedLoadKg == null
                          ? ` · ${item.loadPercent}% 1RM`
                          : ""}
                        {" · "}
                        {formatRest(item.restBetweenSetsSeconds)}
                      </p>
                    </div>
                    {item.targetRir != null ? (
                      <span className="shrink-0 rounded-full bg-accent-dim px-2 py-0.5 font-mono text-xs tabular-nums text-accent-strong">
                        RIR {item.targetRir}
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>

            <Button full disabled={starting} onClick={() => void start()}>
              {home.inProgressSession
                ? "Kontynuuj trening"
                : starting
                  ? "Startuję…"
                  : "Rozpocznij trening"}
            </Button>
          </>
        )
      ) : null}

      {tab === "week" ? (
        <div className="space-y-2">
          {week.length === 0 ? (
            <p className="text-muted">Brak dni w planie.</p>
          ) : (
            week.map((d) => (
              <div
                key={d.id}
                className={`rounded-xl border px-4 py-3 ${
                  d.isToday
                    ? "border-accent-border bg-accent-dim/40"
                    : "border-border bg-surface"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold">{d.label}</p>
                    <p className="font-mono text-xs tabular-nums text-muted">
                      Tydzień {d.weekNumber} · dzień {d.order}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      d.completed
                        ? "bg-positive-dim text-positive"
                        : d.isToday
                          ? "bg-accent-dim text-accent-strong"
                          : "bg-surface-hover text-muted"
                    }`}
                  >
                    {d.completed ? "Zrobione" : d.isToday ? "Dziś" : "Do zrobienia"}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      ) : null}

      {tab === "history" ? (
        history.length === 0 ? (
          <div className="rounded-xl border border-border bg-surface px-4 py-6 text-center">
            <p className="text-sm text-muted">Brak ukończonych treningów.</p>
            <button
              type="button"
              className="mt-3 text-sm font-semibold text-accent hover:text-accent-strong"
              onClick={() => setTab("today")}
            >
              Idź do dzisiejszego treningu
            </button>
          </div>
        ) : (
          <ul className="space-y-2">
            {history.map((s) => {
              const sessionPrs = s.prs ?? [];
              return (
                <li key={s.id}>
                  <Link
                    href={`/portal/${token}/session/${s.id}`}
                    className="block rounded-xl border border-border bg-surface px-4 py-3 transition-colors hover:border-accent-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="break-words text-sm font-semibold">{s.dayLabel ?? "Trening"}</p>
                        <p className="font-mono text-xs tabular-nums text-muted">
                          {formatDay(s.performedOn)}
                        </p>
                      </div>
                      <p className="shrink-0 font-mono text-xs tabular-nums text-muted">
                        {Math.round(s.totalVolumeKg)} kg · {s.totalSets} serii
                      </p>
                    </div>
                    {sessionPrs.length > 0 ? (
                      <ul className="mt-2 space-y-1 border-t border-border pt-2">
                        {sessionPrs.slice(0, 3).map((r, i) => (
                          <li
                            key={`${r.exerciseId}-${r.estimated1Rm}-${i}`}
                            className="flex min-w-0 items-baseline gap-2 text-xs"
                          >
                            <span className="shrink-0 font-semibold text-pr">PR</span>
                            <span className="min-w-0 break-words text-foreground-secondary">
                              {r.exerciseName}
                            </span>
                            <span className="ml-auto shrink-0 font-mono tabular-nums text-muted">
                              {r.weightKg != null && r.reps != null
                                ? `${r.weightKg}×${r.reps}`
                                : "—"}
                              <span className="text-pr"> · {r.estimated1Rm}</span>
                              <span className="text-muted"> e1RM</span>
                            </span>
                          </li>
                        ))}
                        {sessionPrs.length > 3 ? (
                          <li className="text-xs text-muted">+{sessionPrs.length - 3} więcej</li>
                        ) : null}
                      </ul>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        )
      ) : null}

      {tab === "records" ? (
        <div className="space-y-3">
          {records.length === 0 ? (
            <div className="rounded-xl border border-border bg-surface px-4 py-6 text-center">
              <p className="text-sm text-muted">
                Tu zobaczysz rekordy per ćwiczenie — po zalogowaniu serii z checkmarkiem.
              </p>
              <button
                type="button"
                className="mt-3 text-sm font-semibold text-accent hover:text-accent-strong"
                onClick={() => setTab("today")}
              >
                Rozpocznij trening
              </button>
            </div>
          ) : (
            <>
              <p className="font-mono text-xs tabular-nums text-muted">
                {records.length} {records.length === 1 ? "ćwiczenie" : "ćwiczeń"} z rekordem
              </p>
              <ul className="space-y-2">
                {records.map((r) => (
                  <li
                    key={r.exerciseId}
                    className="rounded-xl border border-pr/25 bg-pr-dim/25 px-4 py-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge tone="pr">PR</Badge>
                          <p className="min-w-0 break-words text-sm font-semibold">{r.exerciseName}</p>
                        </div>
                        <p className="mt-1 font-mono text-xs tabular-nums text-muted">
                          {r.weightKg != null && r.reps != null
                            ? `${r.weightKg} kg × ${r.reps}`
                            : "—"}
                          {" · "}
                          {formatDay(r.performedOn)}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="font-mono text-lg font-semibold tabular-nums text-pr">
                          {r.estimated1Rm}
                        </p>
                        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">
                          e1RM
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}
