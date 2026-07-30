"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api, SessionDetail, WorkoutSessionInput } from "@/lib/api";
import { SessionLogger } from "@/components/SessionLogger";
import { ErrorBanner } from "@/components/ui";
import { enqueuePortalWrite, readPortalQueue, clearPortalQueueItem } from "@/lib/portalQueue";

export default function PortalSessionPage() {
  const params = useParams<{ token: string; sessionId: string }>();
  const token = params.token;
  const sessionId = Number(params.sessionId);
  const router = useRouter();
  const [session, setSession] = useState<SessionDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  const flushQueue = useCallback(async () => {
    if (!navigator.onLine) return;
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
    window.addEventListener("online", () => void flushQueue());
    return () => window.removeEventListener("online", () => void flushQueue());
  }, [flushQueue]);

  useEffect(() => {
    api.portal
      .getSession(token, sessionId)
      .then(setSession)
      .catch((e: Error) => setError(e.message));
  }, [token, sessionId]);

  if (!session) {
    return (
      <div>
        <ErrorBanner message={error} />
        <p className="text-muted">Ładowanie…</p>
      </div>
    );
  }

  return (
    <div>
      <SessionLogger
        session={session}
        portalToken={token}
        onUpdated={(s) => {
          setSession(s);
          if (!navigator.onLine) {
            enqueuePortalWrite({
              token,
              sessionId: s.id,
              body: {
                clientId: s.clientId,
                performedOn: s.performedOn,
                assignmentId: s.assignmentId,
                planDayId: s.planDayId,
                planId: s.planId,
                durationSeconds: s.durationSeconds,
                note: s.note,
                status: s.status,
                exercises: s.exercises.map((e) => ({
                  exerciseId: e.exerciseId,
                  order: e.order,
                  note: e.note,
                  sets: e.sets.map((set) => ({
                    setNumber: set.setNumber,
                    weightKg: set.weightKg,
                    reps: set.reps,
                    durationSeconds: set.durationSeconds,
                    distanceMeters: set.distanceMeters,
                    rir: set.rir,
                    rpe: set.rpe,
                    isWarmup: set.isWarmup,
                  })),
                })),
              },
            });
          }
        }}
        onCompleted={() => router.push(`/portal/${token}`)}
      />
    </div>
  );
}
