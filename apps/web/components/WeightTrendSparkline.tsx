"use client";

type Point = { date: string; value: number };

function formatDayShort(iso: string): string {
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("pl-PL", { day: "numeric", month: "short" });
}

function formatValue(n: number, unit: string): string {
  const formatted = Number.isInteger(n) ? String(n) : n.toFixed(1).replace(".", ",");
  return `${formatted} ${unit}`;
}

export function WeightTrendSparkline({
  points,
  unit = "kg",
  height = 64,
}: {
  points: Point[];
  unit?: string;
  height?: number;
}) {
  if (points.length < 2) {
    return (
      <p className="py-2 text-xs text-muted">
        Za mało danych na trend — potrzebne min. 2 pomiary.
      </p>
    );
  }

  const values = points.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const padX = 8;
  const padY = 10;
  const w = 240;
  const innerH = height - padY * 2;
  const innerW = w - padX * 2;

  const coords = points.map((p, i) => {
    const x = padX + (points.length === 1 ? innerW / 2 : (i / (points.length - 1)) * innerW);
    const y = padY + innerH - ((p.value - min) / range) * innerH;
    return { x, y, ...p };
  });

  const line = coords.map((c) => `${c.x},${c.y}`).join(" ");
  const last = coords[coords.length - 1];
  const first = coords[0];
  const area = `${padX},${padY + innerH} ${line} ${padX + innerW},${padY + innerH}`;
  const delta = last.value - first.value;
  const deltaLabel =
    delta === 0
      ? `bez zmian od ${formatDayShort(first.date)}`
      : `${delta > 0 ? "+" : ""}${formatValue(delta, unit)} od ${formatDayShort(first.date)}`;

  return (
    <div className="min-w-0">
      <svg
        viewBox={`0 0 ${w} ${height}`}
        className="h-16 w-full text-accent"
        role="img"
        aria-label={`Trend od ${formatValue(first.value, unit)} do ${formatValue(last.value, unit)}`}
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="weightTrendFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.22" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points={area} fill="url(#weightTrendFill)" />
        <polyline
          points={line}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
        <circle cx={last.x} cy={last.y} r="3.5" fill="currentColor" />
      </svg>
      <div className="mt-1 flex items-baseline justify-between gap-2">
        <span className="font-mono text-xs tabular-nums text-muted">{formatDayShort(first.date)}</span>
        <span className="font-mono text-sm font-semibold tabular-nums text-foreground">
          {formatValue(last.value, unit)}
        </span>
        <span className="font-mono text-xs tabular-nums text-muted">{formatDayShort(last.date)}</span>
      </div>
      <p
        className={`mt-1 font-mono text-xs tabular-nums ${
          delta > 0 ? "text-positive" : delta < 0 ? "text-muted" : "text-muted"
        }`}
      >
        {deltaLabel}
      </p>
    </div>
  );
}
