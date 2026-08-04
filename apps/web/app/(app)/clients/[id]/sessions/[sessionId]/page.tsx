"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { api, SessionDetail } from "@/lib/api";
import { SessionReview } from "@/components/SessionReview";
import { SessionLoggerSkeleton } from "@/components/skeletons";
import { Button, ErrorBanner, PageHeader } from "@/components/ui";

export default function ClientSessionPage() {
  const params = useParams<{ id: string; sessionId: string }>();
  const router = useRouter();
  const clientId = Number(params.id);
  const sessionId = Number(params.sessionId);
  const [session, setSession] = useState<SessionDetail | null>(null);
  const [clientName, setClientName] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    Promise.all([api.sessions.get(sessionId), api.clients.get(clientId)])
      .then(([s, c]) => {
        setSession(s);
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

  return (
    <div>
      <PageHeader
        title={session.dayLabel ?? "Sesja treningowa"}
        subtitle={session.planName ?? undefined}
        action={
          <Link href={`/clients/${clientId}`}>
            <Button variant="ghost">← Profil klienta</Button>
          </Link>
        }
      />
      <SessionReview
        session={session}
        clientName={clientName}
        onUpdated={setSession}
        onEdit={() => router.push(`/clients/${clientId}/sessions/${sessionId}/edit`)}
      />
    </div>
  );
}
