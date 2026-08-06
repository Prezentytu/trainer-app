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
  const padL = 8;
  const padR = 38;
  const padY = 10;
  const w = 240;
  const innerH = height - padY * 2;
  const innerW = w - padL - padR;

  const coords = points.map((p, i) => {
    const x = padL + (points.length === 1 ? innerW / 2 : (i / (points.length - 1)) * innerW);
    const y = padY + innerH - ((p.value - min) / range) * innerH;
    return { x, y, ...p };
  });

  const line = coords.map((c) => `${c.x},${c.y}`).join(" ");
  const last = coords[coords.length - 1];
  const first = coords[0];
  const delta = last.value - first.value;
  const glyph = delta > 0 ? "▲" : delta < 0 ? "▼" : "–";
  // Spadek wagi często = gain (cut) — tu pokazujemy kierunek; walencja zostaje znakowi.
  const deltaTone = delta > 0 ? "text-gain" : delta < 0 ? "text-loss" : "text-fg-faint";
  const deltaLabel =
    delta === 0
      ? `bez zmian od ${formatDayShort(first.date)}`
      : `${delta > 0 ? "+" : ""}${formatValue(delta, unit)} od ${formatDayShort(first.date)}`;
  const yTicks = [min, (min + max) / 2, max];

  return (
    <div className="min-w-0">
      <svg
        viewBox={`0 0 ${w} ${height}`}
        className="h-16 w-full"
        role="img"
        aria-label={`Trend od ${formatValue(first.value, unit)} do ${formatValue(last.value, unit)}`}
        preserveAspectRatio="none"
      >
        {yTicks.map((tick) => {
          const y = padY + innerH - ((tick - min) / range) * innerH;
          return (
            <text
              key={tick}
              x={w - padR + 8}
              y={y + 3}
              fill="var(--fg-ghost)"
              fontSize="10"
              fontFamily="var(--font-geist-mono), monospace"
            >
              {Number.isInteger(tick) ? tick : tick.toFixed(1).replace(".", ",")}
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
            key={c.date}
            cx={c.x}
            cy={c.y}
            r="2.5"
            fill="var(--fg)"
            stroke="var(--bg)"
            strokeWidth="1.5"
          />
        ))}
      </svg>
      <div className="mt-1 flex items-baseline justify-between gap-2">
        <span className="font-mono text-xs tabular-nums text-fg-faint">{formatDayShort(first.date)}</span>
        <span className="font-mono text-sm font-semibold tabular-nums text-foreground">
          {formatValue(last.value, unit)}
        </span>
        <span className="font-mono text-xs tabular-nums text-fg-faint">{formatDayShort(last.date)}</span>
      </div>
      <p className={`mt-1 flex items-center gap-1 font-mono text-xs tabular-nums ${deltaTone}`}>
        <span className="text-[10px] leading-none" aria-hidden>
          {glyph}
        </span>
        {deltaLabel}
      </p>
    </div>
  );
}
