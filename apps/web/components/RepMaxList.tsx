"use client";

import { formatKg } from "@/lib/plates";

export function RepMaxList({
  items,
}: {
  items: { reps: number; weightKg: number }[];
}) {
  if (items.length === 0) {
    return <p className="text-sm text-muted">Brak rep-maxów — pojawią się po zaliczonych seriach.</p>;
  }

  const sorted = [...items].sort((a, b) => a.reps - b.reps);

  return (
    <ul className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4" aria-label="Rep-maxy">
      {sorted.map((r) => (
        <li
          key={`rm-${r.reps}-${r.weightKg}`}
          className="rounded-lg border border-border bg-surface px-2 py-2 text-center"
        >
          <p className="font-mono text-base font-semibold tabular-nums text-foreground">
            {formatKg(r.weightKg)}
          </p>
          <p className="mt-0.5 font-mono text-[11px] font-medium uppercase tracking-caps text-muted">
            {r.reps}RM
          </p>
        </li>
      ))}
    </ul>
  );
}
