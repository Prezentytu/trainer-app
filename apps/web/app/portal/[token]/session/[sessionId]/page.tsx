"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { api, PortalExercise, ProgressReport, SessionDetail, WorkoutSessionInput } from "@/lib/api";
import { SessionLogger } from "@/components/SessionLogger";
import { SessionSummaryView } from "@/components/SessionSummaryView";
import { SessionLoggerSkeleton } from "@/components/skeletons";
import { ErrorBanner } from "@/components/ui";
import { PortalBackLink } from "@/components/portal/PortalBackLink";
import {
  clearSessionQueueItem,
  enqueueSessionWrite,
  readSessionQueue,
} from "@/lib/sessionQueue";
import { readLocalDraft } from "@/lib/sessionDraft";
import { LOCAL_SESSION_ID } from "@/lib/offlineStart";

export default function PortalSessionPage() {
  const params = useParams<{ token: string; sessionId: string }>();
  const token = params.token;
  const sessionId = Number(params.sessionId);
  const router = useRouter();
  const fromHistory = useSearchParams().get("from") === "history";
  const [session, setSession] = useState<SessionDetail | null>(null);
  const [exercises, setExercises] = useState<PortalExercise[]>([]);
  const [progress, setProgress] = useState<ProgressReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editingCompleted, setEditingCompleted] = useState(false);

  const flushQueue = useCallback(async () => {
    if (typeof navigator !== "undefined" && !navigator.onLine) return;
    for (const item of readSessionQueue().filter((q) => q.scope === token)) {
      try {
        const body = item.body as WorkoutSessionInput & { pendingStart?: boolean };
        if (item.sessionId === LOCAL_SESSION_ID || body.pendingStart) {
          const started = await api.portal.startSession(token, {
            clientId: body.clientId,
            assignmentId: body.assignmentId,
            planId: body.planId,
            planDayId: body.planDayId,
            performedOn: body.performedOn,
          });
          const local = readLocalDraft(token, LOCAL_SESSION_ID);
          if (local) {
            await api.portal.updateSession(token, started.id, {
              ...body,
              clientId: started.clientId,
              exercises: local.exercises.map((ex) => ({
                id: ex.id > 0 ? ex.id : null,
                exerciseId: ex.exerciseId,
                substitutedFromExerciseId: ex.substitutedFromExerciseId ?? null,
                order: ex.order,
                note: ex.note,
                sets: ex.sets.map((s) => ({
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
          }
          if (item.complete) await api.portal.completeSession(token, started.id);
          clearSessionQueueItem(item.id);
          if (sessionId === LOCAL_SESSION_ID) {
            router.replace(`/portal/${token}/session/${started.id}`);
          }
          continue;
        }
        await api.portal.updateSession(token, item.sessionId, body);
        if (item.complete) await api.portal.completeSession(token, item.sessionId);
        clearSessionQueueItem(item.id);
      } catch {
        // zostaw w kolejce
      }
    }
  }, [token, sessionId, router]);

  useEffect(() => {
    void flushQueue();
    const onOnline = () => {
      void flushQueue();
    };
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, [flushQueue]);

  useEffect(() => {
    if (sessionId === LOCAL_SESSION_ID) {
      const local = readLocalDraft(token, LOCAL_SESSION_ID);
      Promise.all([
        api.portal.exercises(token).catch(() => [] as PortalExercise[]),
        api.portal.progressReport(token).catch(() => null),
      ])
        .then(([ex, report]) => {
          if (local) setSession(local);
          else setError("Nie znaleziono lokalnego treningu. Wróć do treningów i zacznij ponownie.");
          setExercises(ex);
          setProgress(report);
        })
        .catch((e: Error) => setError(e.message));
      return;
    }
    Promise.all([
      api.portal.getSession(token, sessionId),
      api.portal.exercises(token),
      api.portal.progressReport(token).catch(() => null),
    ])
      .then(([s, ex, report]) => {
        setSession(s);
        setExercises(ex);
        setProgress(report);
      })
      .catch((e: Error) => setError(e.message));
  }, [token, sessionId]);

  if (!session) {
    const homeHref = fromHistory ? `/portal/${token}/history` : `/portal/${token}`;
    return (
      <div className="mx-auto max-w-lg space-y-4">
        <PortalBackLink href={homeHref}>{fromHistory ? "Historia" : "Treningi"}</PortalBackLink>
        <ErrorBanner message={error} />
        {error ? null : <SessionLoggerSkeleton />}
      </div>
    );
  }

  const showSummary = session.status === "completed" && !editingCompleted;

  if (showSummary) {
    return (
      <div>
        <ErrorBanner message={error} />
        <SessionSummaryView
          session={session}
          fromHistory={fromHistory}
          facts={progress?.facts}
          portalToken={token}
          onSessionPatched={setSession}
          onBack={() =>
            router.push(fromHistory ? `/portal/${token}/history` : `/portal/${token}`)
          }
          onEdit={() => setEditingCompleted(true)}
          shareImageUrl={`/portal/${token}/session/${session.id}/share-image`}
        />
      </div>
    );
  }

  return (
    <div>
      <SessionLogger
        key={`${session.id}-${editingCompleted ? "edit" : "live"}`}
        session={session}
        portalToken={token}
        libraryExercises={exercises}
        completedEdit={editingCompleted}
        onPause={
          editingCompleted
            ? undefined
            : () => router.push(`/portal/${token}`)
        }
        onUpdated={setSession}
        onPersistFailed={(input, complete) => {
          enqueueSessionWrite({
            scope: token,
            sessionId,
            body: input,
            complete,
          });
        }}
        onCompleted={(updated) => {
          if (editingCompleted) setEditingCompleted(false);
          setSession(updated);
          window.scrollTo(0, 0);
          void api.portal.progressReport(token).then(setProgress).catch(() => null);
        }}
      />
    </div>
  );
}
