"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { api, PortalExercise, ProgressReport, SessionDetail, WorkoutSessionInput } from "@/lib/api";
import { SessionLogger } from "@/components/SessionLogger";
import { SessionSummaryView } from "@/components/SessionSummaryView";
import { SessionLoggerSkeleton } from "@/components/skeletons";
import { ErrorBanner } from "@/components/ui";
import {
  clearSessionQueueItem,
  enqueueSessionWrite,
  readSessionQueue,
} from "@/lib/sessionQueue";

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
        await api.portal.updateSession(token, item.sessionId, item.body as WorkoutSessionInput);
        if (item.complete) await api.portal.completeSession(token, item.sessionId);
        clearSessionQueueItem(item.id);
      } catch {
        // zostaw w kolejce
      }
    }
  }, [token]);

  useEffect(() => {
    void flushQueue();
    const onOnline = () => {
      void flushQueue();
    };
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, [flushQueue]);

  useEffect(() => {
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
    return (
      <div>
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
