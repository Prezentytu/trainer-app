"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { PortalBottomNav } from "@/components/portal/PortalBottomNav";
import { PortalChromeProvider } from "@/components/portal/PortalChrome";
import { PortalOfflineBanner } from "@/components/portal/PortalOfflineBanner";

/** Klientowa otoczka portalu: SW, banner offline, chrome, bottom nav. */
export function PortalShell({ token, children }: { token: string; children: ReactNode }) {
  useEffect(() => {
    // Tylko produkcja: w dev SW serwuje /_next/static cache-first, czyli stare chunki (błędy hydracji).
    if (process.env.NODE_ENV !== "production") return;
    if ("serviceWorker" in navigator) {
      void navigator.serviceWorker.register("/sw.js");
    }
  }, []);

  return (
    <PortalChromeProvider>
      <PortalOfflineBanner />
      {children}
      <PortalBottomNav token={token} />
    </PortalChromeProvider>
  );
}
