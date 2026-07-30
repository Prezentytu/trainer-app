"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api, PortalHome } from "@/lib/api";
import { ExerciseThumb } from "@/components/ExerciseThumb";
import { Button, ErrorBanner, formatRest } from "@/components/ui";
export default function PortalHomePage() {
  const params = useParams<{ token: string }>();
  const token = params.token;
  const router = useRouter();
  const [home, setHome] = useState<PortalHome | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);

  const load = useCallback(() => {
    api.portal
      .home(token)
      .then(setHome)
      .catch((e: Error) => setError(e.message));
  }, [token]);

  useEffect(load, [load]);

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

  return (
    <div className="space-y-5">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">Workout Alchemist</p>
        <h1 className="font-display text-2xl font-bold">Cześć, {home.client.name.split(" ")[0]}</h1>
      </header>
      <ErrorBanner message={error} />

      {!today ? (
        <div className="rounded-2xl border border-border bg-surface p-5 text-muted">
          Nie masz aktywnego planu. Poproś trenera o przypisanie.
        </div>
      ) : (
        <>
          <div className="rounded-2xl border border-border bg-surface p-4">
            <div className="mb-2 flex items-center justify-between gap-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">Dzisiejszy trening</p>
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
              {today.day.items.map((item) => {
                return (
                  <li
                    key={item.id}
                    className="flex items-center gap-3 rounded-xl border border-border bg-surface-sunken px-3 py-2.5"
                  >
                    <div className="h-12 w-12 shrink-0">
                      <ExerciseThumb
                        variant="square"
                        youtubeId={item.demoYoutubeId}
                        category={item.category}
                        alt={item.exerciseName}
                      />
                    </div>
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
                );
              })}
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
      )}
    </div>
  );
}
