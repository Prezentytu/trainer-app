"use client";

import { memo, useEffect, useState } from "react";

function elapsedLabel(startedAt: number): string {
  const sec = Math.max(0, Math.floor((Date.now() - startedAt) / 1000));
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/** Izolowany zegar — nie re-renderuje całego loggera co sekundę. */
export const SessionClock = memo(function SessionClock({ startedAt }: { startedAt: number }) {
  const [clock, setClock] = useState(() => elapsedLabel(startedAt));
  useEffect(() => {
    const t = setInterval(() => setClock(elapsedLabel(startedAt)), 1000);
    return () => clearInterval(t);
  }, [startedAt]);
  return <span className="font-mono text-sm tabular-nums text-muted">{clock}</span>;
});
