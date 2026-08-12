"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { api, PortalExercise, SessionDetail, WorkoutSessionInput } from "@/lib/api";
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
  // Kontekst wejścia (wayfinding): z historii wracamy do historii, nie na ekran główny.
  const fromHistory = useSearchParams().get("from") === "history";
  const [session, setSession] = useState<SessionDetail | null>(null);
  const [exercises, setExercises] = useState<PortalExercise[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [editingCompleted, setEditingCompleted] = useState(false);
  /** Po live complete — najpierw lekki check-in w SessionLogger, potem SessionSummaryView. */
  const [awaitingCheckin, setAwaitingCheckin] = useState(false);

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

  const showSummary =
    session.status === "completed" && !editingCompleted && !awaitingCheckin;

  if (showSummary) {
    return (
      <div>
        <ErrorBanner message={error} />
        <SessionSummaryView
          session={session}
          fromHistory={fromHistory}
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
        onUpdated={(next) => {
          // Live complete: nie przełączaj od razu na summary — najpierw check-in.
          if (
            session.status === "in_progress" &&
            next.status === "completed" &&
            !editingCompleted
          ) {
            setAwaitingCheckin(true);
          }
          setSession(next);
        }}
        onPersistFailed={(input, complete) => {
          enqueueSessionWrite({
            scope: token,
            sessionId,
            body: input,
            complete,
          });
        }}
        onCompleted={() => {
          if (editingCompleted) {
            // „Popraw wyniki” → zapis wraca do podsumowania (zachowany kontekst).
            setEditingCompleted(false);
          } else {
            // Peak-End: zostań na /session/… i pokaż SessionSummaryView (celebracja PR).
            setAwaitingCheckin(false);
          }
          window.scrollTo(0, 0);
        }}
      />
    </div>
  );
}
