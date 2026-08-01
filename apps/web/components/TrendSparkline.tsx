"use client";

type Point = { date: string; estimated1Rm: number; isPr?: boolean };

function formatDayShort(iso: string): string {
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("pl-PL", { day: "numeric", month: "short" });
}

function formatKg(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1).replace(".", ",");
}

export function TrendSparkline({
  points,
  height = 96,
  showAxes = true,
}: {
  points: Point[];
  height?: number;
  showAxes?: boolean;
}) {
  if (points.length < 2) {
    return (
      <p className="py-2 text-xs text-muted">
        Za mało danych na trend — potrzebne min. 2 treningi.
      </p>
    );
  }

  const values = points.map((p) => p.estimated1Rm);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const padL = showAxes ? 36 : 8;
  const padR = 8;
  const padY = 12;
  const w = 280;
  const innerH = height - padY * 2;
  const innerW = w - padL - padR;

  // Mark PR: punkt bijący wszystkie poprzednie wartości e1RM
  const withPr = points.reduce<Point[]>((acc, p) => {
    const prevBest = acc.reduce((m, x) => Math.max(m, x.estimated1Rm), -Infinity);
    const isPr = p.isPr ?? p.estimated1Rm > prevBest + 0.01;
    acc.push({ ...p, isPr });
    return acc;
  }, []);

  const coords = withPr.map((p, i) => {
    const x = padL + (withPr.length === 1 ? innerW / 2 : (i / (withPr.length - 1)) * innerW);
    const y = padY + innerH - ((p.estimated1Rm - min) / range) * innerH;
    return { x, y, ...p };
  });

  const line = coords.map((c) => `${c.x},${c.y}`).join(" ");
  const last = coords[coords.length - 1];
  const first = coords[0];
  const area = `${padL},${padY + innerH} ${line} ${padL + innerW},${padY + innerH}`;
  const delta = last.estimated1Rm - first.estimated1Rm;
  const deltaLabel =
    delta === 0
      ? `bez zmian od ${formatDayShort(first.date)}`
      : `${delta > 0 ? "+" : ""}${formatKg(delta)} kg od ${formatDayShort(first.date)}`;
  const yTicks = [min, (min + max) / 2, max];

  return (
    <div className="min-w-0">
      <svg
        viewBox={`0 0 ${w} ${height}`}
        className="h-24 w-full text-accent"
        role="img"
        aria-label={`Trend szacowanego maxu od ${formatKg(first.estimated1Rm)} do ${formatKg(last.estimated1Rm)} kg`}
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.22" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>
        {showAxes
          ? yTicks.map((v) => {
              const y = padY + innerH - ((v - min) / range) * innerH;
              return (
                <g key={v}>
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
                    {formatKg(v)}
                  </text>
                </g>
              );
            })
          : null}
        <polygon points={area} fill="url(#trendFill)" />
        <polyline
          points={line}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
        {coords.map((c) =>
          c.isPr ? (
            <circle
              key={`${c.date}-pr`}
              cx={c.x}
              cy={c.y}
              r="4"
              fill="var(--pr)"
              stroke="var(--background)"
              strokeWidth="1.5"
            >
              <title>{`PR ${formatKg(c.estimated1Rm)} kg · ${formatDayShort(c.date)}`}</title>
            </circle>
          ) : null,
        )}
        <circle cx={last.x} cy={last.y} r="3.5" fill="currentColor" />
      </svg>
      <div className="mt-1 flex items-baseline justify-between gap-2">
        <span className="font-mono text-xs tabular-nums text-muted">{formatDayShort(first.date)}</span>
        <span className="font-mono text-sm font-semibold tabular-nums text-foreground">
          {formatKg(last.estimated1Rm)} kg
        </span>
        <span className="font-mono text-xs tabular-nums text-muted">{formatDayShort(last.date)}</span>
      </div>
      <p
        className={`mt-1 font-mono text-xs tabular-nums ${
          delta > 0 ? "text-positive" : "text-muted"
        }`}
      >
        {deltaLabel}
        {coords.some((c) => c.isPr) ? (
          <span className="ml-2 text-pr">· punkty gold = PR</span>
        ) : null}
      </p>
    </div>
  );
}
