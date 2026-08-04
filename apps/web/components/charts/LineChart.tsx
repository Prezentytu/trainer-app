"use client";

export type LineChartPoint = {
  label: string;
  value: number;
};

/** Uniwersalny wykres liniowy SVG (zero zależności). Mobile-first, pełna szerokość. */
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
  const padL = 36;
  const padR = 8;
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
  const area = `${padL},${padY + innerH} ${line} ${padL + innerW},${padY + innerH}`;
  const yTicks = [min, (min + max) / 2, max];
  const first = coords[0];
  const last = coords[coords.length - 1];

  const fmt = (n: number) =>
    Number.isInteger(n) ? String(n) : n.toFixed(n >= 100 ? 0 : 1).replace(".", ",");

  return (
    <div className="min-w-0">
      <svg
        viewBox={`0 0 ${w} ${height}`}
        className="h-28 w-full text-foreground-secondary"
        role="img"
        aria-label={
          ariaLabel ??
          `Wykres od ${fmt(first.value)} do ${fmt(last.value)}${unit ? ` ${unit}` : ""}`
        }
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="lineChartFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.18" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>
        {yTicks.map((v) => {
          const y = padY + innerH - ((v - min) / range) * innerH;
          return (
            <g key={`y-${v}`}>
              <line
                x1={padL}
                y1={y}
                x2={padL + innerW}
                y2={y}
                stroke="var(--border)"
                strokeWidth="1"
                vectorEffect="non-scaling-stroke"
              />
              <text
                x={padL - 4}
                y={y + 3}
                textAnchor="end"
                fill="var(--muted)"
                fontSize="9"
                fontFamily="var(--font-ibm-plex-mono), monospace"
              >
                {fmt(v)}
              </text>
            </g>
          );
        })}
        <polygon points={area} fill="url(#lineChartFill)" />
        <polyline
          points={line}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
        <circle cx={last.x} cy={last.y} r="3.5" fill="var(--accent)" />
      </svg>
      <div className="mt-1 flex items-baseline justify-between gap-2">
        <span className="min-w-0 truncate font-mono text-xs tabular-nums text-muted">
          {first.label}
        </span>
        <span className="shrink-0 font-mono text-sm font-semibold tabular-nums text-foreground">
          {fmt(last.value)}
          {unit ? ` ${unit}` : ""}
        </span>
        <span className="min-w-0 truncate text-right font-mono text-xs tabular-nums text-muted">
          {last.label}
        </span>
      </div>
    </div>
  );
}
