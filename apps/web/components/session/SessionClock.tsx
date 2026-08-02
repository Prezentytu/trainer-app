"use client";

import { memo, useEffect, useState } from "react";

export function formatElapsed(startedAt: number): string {
  const sec = Math.max(0, Math.floor((Date.now() - startedAt) / 1000));
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/** Izolowany zegar — nie re-renderuje całego loggera co sekundę. */
export const SessionClock = memo(function SessionClock({
  startedAt,
  className = "font-mono text-sm tabular-nums text-muted",
}: {
  startedAt: number;
  className?: string;
}) {
  const [clock, setClock] = useState(() => formatElapsed(startedAt));
  useEffect(() => {
    const t = setInterval(() => setClock(formatElapsed(startedAt)), 1000);
    return () => clearInterval(t);
  }, [startedAt]);
  return <span className={className}>{clock}</span>;
});
