"use client";

export type LineChartPoint = {
  label: string;
  value: number;
};

/**
 * Wykres liniowy SVG — mono line bez gradientu pod krzywą.
 * Zachowuje proporcje (bez `preserveAspectRatio=none`), żeby kropki i oś nie były „rozjechane”.
 */
export function LineChart({
  points,
  height = 140,
  unit = "",
  emptyHint = "Za mało danych na wykres.",
  ariaLabel,
}: {
  points: LineChartPoint[];
  height?: number;
  unit?: string;
  emptyHint?: string;
  ariaLabel?: string;
}) {
  if (points.length < 2) {
    return <p className="py-2 text-sm text-muted">{emptyHint}</p>;
  }

  const values = points.map((p) => p.value);
  const dataMin = Math.min(...values);
  const dataMax = Math.max(...values);
  // Dla nieujemnych serii (tonaż, częstotliwość) kotwica w 0 — czytelniejsza skala.
  const min = dataMin >= 0 ? 0 : dataMin;
  const max = dataMax === min ? min + 1 : dataMax;
  const range = max - min;
  const padL = 4;
  const padR = 36;
  const padTop = 14;
  const padBottom = 8;
  const w = 360;
  const innerH = height - padTop - padBottom;
  const innerW = w - padL - padR;

  const coords = points.map((p, i) => {
    const x = padL + (points.length === 1 ? innerW / 2 : (i / (points.length - 1)) * innerW);
    const y = padTop + innerH - ((p.value - min) / range) * innerH;
    return { x, y, ...p };
  });

  const linePoints = coords.map((c) => `${c.x},${c.y}`).join(" ");

  const yTicks =
    max - min < 0.01
      ? [max]
      : [min, min + range / 2, max].map((v) =>
          Number.isInteger(range) && Number.isInteger(min) ? Math.round(v) : v,
        );
  const first = coords[0];
  const last = coords[coords.length - 1];

  const fmt = (n: number) => {
    if (Number.isInteger(n)) return String(n);
    if (Math.abs(n) >= 100) return n.toFixed(0);
    return n.toFixed(1).replace(".", ",");
  };

  return (
    <div className="min-w-0">
      <div className="mb-2 flex items-baseline justify-end gap-1.5">
        <span className="font-mono text-lg font-semibold tabular-nums tracking-tight text-foreground">
          {fmt(last.value)}
        </span>
        {unit ? <span className="font-mono text-xs text-fg-ghost">{unit}</span> : null}
      </div>

      <svg
        viewBox={`0 0 ${w} ${height}`}
        className="aspect-[18/7] h-auto w-full"
        role="img"
        aria-label={
          ariaLabel ??
          `Wykres od ${fmt(first.value)} do ${fmt(last.value)}${unit ? ` ${unit}` : ""}`
        }
        preserveAspectRatio="xMidYMid meet"
      >
        {yTicks.map((v, i) => {
          const y = padTop + innerH - ((v - min) / range) * innerH;
          return (
            <g key={`ytick-${i}`}>
              <line
                x1={padL}
                x2={padL + innerW}
                y1={y}
                y2={y}
                stroke="var(--line-faint)"
                strokeWidth="1"
                strokeDasharray={i === 0 ? undefined : "3 4"}
                opacity={i === 0 ? 0.9 : 0.55}
              />
              <text
                x={w - padR + 6}
                y={y + 3.5}
                fill="var(--fg-ghost)"
                fontSize="12"
                fontFamily="var(--font-geist-mono), monospace"
              >
                {fmt(v)}
              </text>
            </g>
          );
        })}

        <polyline
          points={linePoints}
          fill="none"
          stroke="var(--fg)"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {coords.map((c, i) => {
          const isLast = i === coords.length - 1;
          return (
            <circle
              key={`${c.label}-${i}`}
              cx={c.x}
              cy={c.y}
              r={isLast ? 3.5 : 2.5}
              fill="var(--fg)"
              stroke="var(--surface)"
              strokeWidth="2"
            />
          );
        })}
      </svg>

      <div className="mt-1.5 flex items-center justify-between gap-3">
        <span className="min-w-0 truncate font-mono text-xs tabular-nums text-fg-ghost">
          {first.label}
        </span>
        <span className="min-w-0 truncate text-right font-mono text-xs tabular-nums text-fg-ghost">
          {last.label}
        </span>
      </div>
    </div>
  );
}
