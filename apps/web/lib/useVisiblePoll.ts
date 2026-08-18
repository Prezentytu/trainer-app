"use client";

import { useEffect } from "react";

/** Odświeża, gdy karta jest widoczna. Pauzuje w tle. */
export function useVisiblePoll(fn: () => void, ms: number) {
  useEffect(() => {
    let id: number | null = null;
    const tick = () => {
      if (document.visibilityState === "visible") fn();
    };
    const start = () => {
      if (id != null) return;
      id = window.setInterval(tick, ms);
    };
    const stop = () => {
      if (id == null) return;
      window.clearInterval(id);
      id = null;
    };
    const onVis = () => {
      if (document.visibilityState === "visible") {
        tick();
        start();
      } else {
        stop();
      }
    };
    start();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [fn, ms]);
}
