"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { api, Exercise, SessionDetail, WorkoutSessionInput } from "@/lib/api";
import { SessionLogger } from "@/components/SessionLogger";
import { SessionLoggerSkeleton } from "@/components/skeletons";
import { Button, ErrorBanner, PageHeader } from "@/components/ui";
import {
  clearSessionQueueItem,
  enqueueSessionWrite,
  readSessionQueue,
} from "@/lib/sessionQueue";

export default function ClientSessionEditPage() {
  const params = useParams<{ id: string; sessionId: string }>();
  const router = useRouter();
  const clientId = Number(params.id);
  const sessionId = Number(params.sessionId);
  const [session, setSession] = useState<SessionDetail | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [clientName, setClientName] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);

  const flushQueue = useCallback(async () => {
    if (typeof navigator !== "undefined" && !navigator.onLine) return;
    for (const item of readSessionQueue().filter((q) => q.scope === "trainer")) {
      try {
        await api.sessions.update(item.sessionId, item.body as WorkoutSessionInput);
        if (item.complete) await api.sessions.complete(item.sessionId);
        clearSessionQueueItem(item.id);
      } catch {
        // zostaw w kolejce
      }
    }
  }, []);

  useEffect(() => {
    void flushQueue();
    const onOnline = () => {
      void flushQueue();
    };
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, [flushQueue]);

  const load = useCallback(() => {
    Promise.all([api.sessions.get(sessionId), api.exercises.list(), api.clients.get(clientId)])
      .then(([s, ex, c]) => {
        setSession(s);
        setExercises(ex);
        setClientName(c.name);
      })
      .catch((e: Error) => setError(e.message));
  }, [sessionId, clientId]);

  useEffect(load, [load]);

  if (!session) {
    return (
      <div>
        <ErrorBanner message={error} />
        {error ? null : <SessionLoggerSkeleton />}
      </div>
    );
  }

  const reviewHref = `/clients/${clientId}/sessions/${sessionId}`;

  return (
    <div>
      <PageHeader
        title={session.dayLabel ?? "Sesja treningowa"}
        subtitle={session.planName ?? undefined}
        action={
          <Link href={reviewHref}>
            <Button variant="ghost">← Podgląd</Button>
          </Link>
        }
      />
      <SessionLogger
        key={session.id}
        session={session}
        libraryExercises={exercises}
        mode={session.status === "completed" ? "completedEdit" : "behalf"}
        clientName={clientName}
        onUpdated={setSession}
        onPersistFailed={(input, complete) => {
          enqueueSessionWrite({
            scope: "trainer",
            sessionId,
            body: input,
            complete,
          });
        }}
        onCompleted={() => router.push(reviewHref)}
      />
    </div>
  );
}
