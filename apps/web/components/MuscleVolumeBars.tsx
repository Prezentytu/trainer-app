"use client";

import type { MuscleVolumeGroup } from "@/lib/api";

function formatKg(n: number): string {
  if (n <= 0) return "";
  return n >= 1000
    ? `${(n / 1000).toFixed(1).replace(".", ",")} t`
    : `${Math.round(n).toLocaleString("pl-PL")} kg`;
}

/** Poziome słupki objętości / serii per grupa mięśniowa. */
export function MuscleVolumeBars({
  groups,
  mode = "sets",
  emptyHint = "Objętość pojawi się po zapisanych seriach roboczych.",
}: {
  groups: MuscleVolumeGroup[];
  mode?: "sets" | "volume";
  emptyHint?: string;
}) {
  if (groups.length === 0) {
    return <p className="py-2 text-sm text-muted">{emptyHint}</p>;
  }

  const max = Math.max(
    1,
    ...groups.map((g) => (mode === "volume" ? g.volumeKg : g.sets)),
  );

  return (
    <ul className="min-w-0 space-y-2.5">
      {groups.map((g) => {
        const value = mode === "volume" ? g.volumeKg : g.sets;
        const pct = Math.max(4, Math.round((value / max) * 100));
        const valueLabel =
          mode === "volume"
            ? formatKg(g.volumeKg) || "0 kg"
            : `${g.sets} ${g.sets === 1 ? "seria" : g.sets < 5 ? "serie" : "serii"}`;
        return (
          <li key={g.muscle} className="min-w-0">
            <div className="mb-1 flex min-w-0 items-baseline justify-between gap-2">
              <span className="min-w-0 break-words text-sm text-foreground-secondary">
                {g.muscle}
              </span>
              <span className="shrink-0 font-mono text-xs tabular-nums text-muted">
                {valueLabel}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-surface-sunken">
              <div
                className="h-full rounded-full bg-surface-active transition-[width] duration-[var(--dur-fast)]"
                style={{ width: `${pct}%` }}
                title={`${g.muscle}: ${valueLabel}`}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
