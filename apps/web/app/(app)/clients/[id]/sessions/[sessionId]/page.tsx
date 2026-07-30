"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { api, SessionDetail } from "@/lib/api";
import { SessionLogger } from "@/components/SessionLogger";
import { Button, ErrorBanner, PageHeader } from "@/components/ui";

export default function ClientSessionPage() {
  const params = useParams<{ id: string; sessionId: string }>();
  const router = useRouter();
  const clientId = Number(params.id);
  const sessionId = Number(params.sessionId);
  const [session, setSession] = useState<SessionDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    api.sessions
      .get(sessionId)
      .then(setSession)
      .catch((e: Error) => setError(e.message));
  }, [sessionId]);

  useEffect(load, [load]);

  if (!session) {
    return (
      <div>
        <ErrorBanner message={error} />
        <p className="text-muted">Ładowanie sesji…</p>
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
      <SessionLogger
        key={session.id}
        session={session}
        onUpdated={setSession}
        onCompleted={() => router.push(`/clients/${clientId}`)}
      />
    </div>
  );
}
