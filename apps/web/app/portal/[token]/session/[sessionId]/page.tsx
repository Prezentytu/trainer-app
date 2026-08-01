"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api, Exercise, SessionDetail, WorkoutSessionInput } from "@/lib/api";
import { SessionLogger } from "@/components/SessionLogger";
import { SessionSummaryView } from "@/components/SessionSummaryView";
import { SessionLoggerSkeleton } from "@/components/skeletons";
import { ErrorBanner } from "@/components/ui";
import { enqueuePortalWrite, readPortalQueue, clearPortalQueueItem } from "@/lib/portalQueue";

export default function PortalSessionPage() {
  const params = useParams<{ token: string; sessionId: string }>();
  const token = params.token;
  const sessionId = Number(params.sessionId);
  const router = useRouter();
  const [session, setSession] = useState<SessionDetail | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [editingCompleted, setEditingCompleted] = useState(false);

  const flushQueue = useCallback(async () => {
    if (typeof navigator !== "undefined" && !navigator.onLine) return;
    for (const item of readPortalQueue().filter((q) => q.token === token)) {
      try {
        await api.portal.updateSession(token, item.sessionId, item.body as WorkoutSessionInput);
        if (item.complete) await api.portal.completeSession(token, item.sessionId);
        clearPortalQueueItem(item.id);
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
    Promise.all([api.portal.getSession(token, sessionId), api.portal.exercises(token)])
      .then(([s, ex]) => {
        setSession(s);
        setExercises(ex);
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
          onBack={() => router.push(`/portal/${token}`)}
          onEdit={() => setEditingCompleted(true)}
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
        onUpdated={setSession}
        onPersistFailed={(input, complete) => {
          enqueuePortalWrite({
            token,
            sessionId,
            body: input,
            complete,
          });
        }}
        onCompleted={() => router.push(`/portal/${token}`)}
      />
    </div>
  );
}
