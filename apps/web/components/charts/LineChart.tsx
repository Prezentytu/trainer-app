"use client";

export type LineChartPoint = {
  label: string;
  value: number;
};

/** Uniwersalny wykres liniowy SVG — mono polyline 2px, bez fill/gradientu. */
export function LineChart({
  points,
  height = 120,
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
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const padL = 8;
  const padR = 38;
  const padY = 12;
  const w = 320;
  const innerH = height - padY * 2;
  const innerW = w - padL - padR;

  const coords = points.map((p, i) => {
    const x = padL + (points.length === 1 ? innerW / 2 : (i / (points.length - 1)) * innerW);
    const y = padY + innerH - ((p.value - min) / range) * innerH;
    return { x, y, ...p };
  });

  const line = coords.map((c) => `${c.x},${c.y}`).join(" ");
  const yTicks = max - min < 0.01 ? [max] : [min, (min + max) / 2, max];
  const first = coords[0];
  const last = coords[coords.length - 1];

  const fmt = (n: number) =>
    Number.isInteger(n) ? String(n) : n.toFixed(n >= 100 ? 0 : 1).replace(".", ",");

  return (
    <div className="min-w-0">
      <svg
        viewBox={`0 0 ${w} ${height}`}
        className="h-28 w-full"
        role="img"
        aria-label={
          ariaLabel ??
          `Wykres od ${fmt(first.value)} do ${fmt(last.value)}${unit ? ` ${unit}` : ""}`
        }
        preserveAspectRatio="none"
      >
        {yTicks.map((v, i) => {
          const y = padY + innerH - ((v - min) / range) * innerH;
          return (
            <text
              key={`ytick-${i}`}
              x={w - padR + 8}
              y={y + 3}
              fill="var(--fg-ghost)"
              fontSize="10"
              fontFamily="var(--font-geist-mono), monospace"
            >
              {fmt(v)}
            </text>
          );
        })}
        <polyline
          points={line}
          fill="none"
          stroke="var(--fg)"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
        {coords.map((c) => (
          <circle
            key={`${c.label}-${c.x}`}
            cx={c.x}
            cy={c.y}
            r="3"
            fill="var(--fg)"
            stroke="var(--bg)"
            strokeWidth="1.5"
          />
        ))}
      </svg>
      <div className="mt-1 flex items-baseline justify-between gap-2">
        <span className="min-w-0 truncate font-mono text-xs tabular-nums text-fg-faint">
          {first.label}
        </span>
        <span className="shrink-0 font-mono text-sm font-semibold tabular-nums text-foreground">
          {fmt(last.value)}
          {unit ? ` ${unit}` : ""}
        </span>
        <span className="min-w-0 truncate text-right font-mono text-xs tabular-nums text-fg-faint">
          {last.label}
        </span>
      </div>
    </div>
  );
}
