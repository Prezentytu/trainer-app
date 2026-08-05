"use client";

import { useIsOffline } from "@/lib/pwa";

/** Dyskretny pasek: offline — serie w kolejce polecą po powrocie sieci. */
export function PortalOfflineBanner() {
  const offline = useIsOffline();
  if (!offline) return null;

  return (
    <div
      role="status"
      className="sticky top-[env(safe-area-inset-top)] z-30 -mx-4 mb-3 border-b border-border bg-surface-raised px-4 py-2.5 text-center text-sm text-foreground-secondary"
    >
      Jesteś offline — zapisane serie polecą po powrocie sieci.
    </div>
  );
}
