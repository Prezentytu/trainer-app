"use client";

import { memo, useEffect, useState } from "react";

function formatSince(startedAt: number): string {
  const sec = Math.max(0, Math.floor((Date.now() - startedAt) / 1000));
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  if (m >= 60) {
    const h = Math.floor(m / 60);
    const mm = m % 60;
    return `${h}:${String(mm).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${m}:${String(s).padStart(2, "0")}`;
}

/** Czas od ostatniej zaliczonej serii — izolowany tick, bez re-renderu loggera. */
export const SinceLastSetClock = memo(function SinceLastSetClock({
  sinceAt,
  className = "font-mono text-[22px] font-semibold leading-none tabular-nums text-foreground",
}: {
  sinceAt: number;
  className?: string;
}) {
  const [label, setLabel] = useState(() => formatSince(sinceAt));
  useEffect(() => {
    setLabel(formatSince(sinceAt));
    const t = setInterval(() => setLabel(formatSince(sinceAt)), 1000);
    return () => clearInterval(t);
  }, [sinceAt]);
  return <span className={className}>{label}</span>;
});
