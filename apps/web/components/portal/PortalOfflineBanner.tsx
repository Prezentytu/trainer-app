"use client";

import { useCallback, useSyncExternalStore } from "react";
import { useParams } from "next/navigation";
import { useIsOffline } from "@/lib/pwa";
import { sessionQueueCount, subscribeSessionQueue } from "@/lib/sessionQueue";

function useQueuedCount(scope: string | undefined) {
  const get = useCallback(() => (scope ? sessionQueueCount(scope) : 0), [scope]);
  return useSyncExternalStore(subscribeSessionQueue, get, () => 0);
}

/** Offline albo niewysłane serie — widać stan kolejki. */
export function PortalOfflineBanner() {
  const params = useParams<{ token?: string }>();
  const token = params?.token;
  const offline = useIsOffline();
  const queued = useQueuedCount(token);

  if (!offline && queued === 0) return null;

  const label = offline
    ? queued > 0
      ? `Brak internetu — niewysłane zapisy: ${queued}. Polecą, gdy sieć wróci.`
      : "Brak internetu — zapisane serie polecą, gdy sieć wróci."
    : `Niewysłane zapisy: ${queued}. Wysyłam, gdy sieć wróci.`;

  return (
    <div
      role="status"
      className="sticky top-[env(safe-area-inset-top)] z-30 -mx-4 mb-3 border-b border-border bg-surface-raised px-4 py-2.5 text-center text-sm text-foreground-secondary"
    >
      {label}
    </div>
  );
}
