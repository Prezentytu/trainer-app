"use client";

type Point = { date: string; score: number };

function formatDayShort(iso: string): string {
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("pl-PL", { day: "numeric", month: "short" });
}

/** Trend 1–5 (feeling / wysiłek) — kolor tylko na danych, bez chrome hue. */
export function ScoreSparkline({
  points,
  height = 72,
  ariaLabel = "Trend samopoczucia",
}: {
  points: Point[];
  height?: number;
  ariaLabel?: string;
}) {
  if (points.length < 2) {
    return (
      <p className="py-2 text-sm text-muted">
        Za mało ocen — trend pojawi się po dwóch treningach z samopoczuciem.
      </p>
    );
  }

  const values = points.map((p) => p.score);
  const min = 1;
  const max = 5;
  const range = max - min;
  const padL = 8;
  const padR = 28;
  const padY = 10;
  const w = 280;
  const innerH = height - padY * 2;
  const step = points.length === 1 ? 0 : (w - padL - padR) / (points.length - 1);
  const ys = values.map((v) => padY + innerH - ((v - min) / range) * innerH);
  const d = ys
    .map((y, i) => `${i === 0 ? "M" : "L"} ${(padL + i * step).toFixed(1)} ${y.toFixed(1)}`)
    .join(" ");
  const last = points[points.length - 1];

  return (
    <div>
      <svg
        viewBox={`0 0 ${w} ${height}`}
        className="h-auto w-full text-foreground"
        role="img"
        aria-label={ariaLabel}
      >
        <path d={d} fill="none" stroke="currentColor" strokeWidth="1.5" />
        {ys.map((y, i) => (
          <circle
            key={points[i].date}
            cx={padL + i * step}
            cy={y}
            r="2.5"
            fill="currentColor"
          />
        ))}
        <text
          x={w - 4}
          y={ys[ys.length - 1] + 4}
          textAnchor="end"
          className="fill-muted"
          fontSize="11"
        >
          {last.score}/5
        </text>
      </svg>
      <p className="mt-1 font-mono text-xs tabular-nums text-muted">
        {formatDayShort(points[0].date)} – {formatDayShort(last.date)}
      </p>
    </div>
  );
}
