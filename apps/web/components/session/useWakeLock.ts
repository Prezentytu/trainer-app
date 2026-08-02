"use client";

import { useEffect, useRef } from "react";

/** Trzyma ekran włączony podczas aktywnej sesji (gdy karta widoczna). */
export function useWakeLock(active: boolean) {
  const lockRef = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    if (!active || typeof navigator === "undefined" || !("wakeLock" in navigator)) return;

    let cancelled = false;

    const request = async () => {
      if (cancelled || document.visibilityState !== "visible") return;
      try {
        lockRef.current = await navigator.wakeLock.request("screen");
        lockRef.current.addEventListener("release", () => {
          lockRef.current = null;
        });
      } catch {
        /* brak uprawnień / nieobsługiwane */
      }
    };

    const onVis = () => {
      if (document.visibilityState === "visible") void request();
      else {
        void lockRef.current?.release();
        lockRef.current = null;
      }
    };

    void request();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVis);
      void lockRef.current?.release();
      lockRef.current = null;
    };
  }, [active]);
}
