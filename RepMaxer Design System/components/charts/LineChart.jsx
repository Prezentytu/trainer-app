import React from "react";

/**
 * Single white polyline on a bare plot. Right-hand value axis and a sparse
 * date axis in mono; no grid, no fill, no second series.
 */
export function LineChart({ points, labels, height = 180, showAxis = true, dots = true }) {
  const w = 300;
  const h = height;
  const padR = showAxis ? 38 : 0;
  const padB = showAxis ? 24 : 0;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || 1;
  const lo = min - span * 0.25;
  const hi = max + span * 0.25;
  const x = (i) => (points.length === 1 ? 0 : (i / (points.length - 1)) * (w - padR - 6)) + 3;
  const y = (v) => h - padB - ((v - lo) / (hi - lo)) * (h - padB - 8);
  const d = points.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(p).toFixed(1)}`).join(" ");
  const ticks = 4;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} style={{ display: "block", overflow: "visible" }} role="img">
      {showAxis
        ? Array.from({ length: ticks + 1 }, (_, i) => {
            const v = lo + ((hi - lo) / ticks) * i;
            return (
              <text
                key={i}
                x={w - padR + 8}
                y={y(v) + 3}
                fill="var(--fg-faint)"
                fontSize="10"
                fontFamily="var(--font-mono)"
              >
                {Math.round(v)}
              </text>
            );
          })
        : null}
      <path d={d} fill="none" stroke="var(--fg)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      {dots
        ? points.map((p, i) => <circle key={i} cx={x(i)} cy={y(p)} r="3" fill="var(--fg)" stroke="var(--bg)" strokeWidth="1.5" />)
        : null}
      {showAxis && labels
        ? labels.map((l, i) => (
            <text
              key={i}
              x={(i / (labels.length - 1)) * (w - padR - 6) + 3}
              y={h - 6}
              fill="var(--fg-faint)"
              fontSize="10"
              fontFamily="var(--font-mono)"
              textAnchor={i === 0 ? "start" : i === labels.length - 1 ? "end" : "middle"}
            >
              {l}
            </text>
          ))
        : null}
    </svg>
  );
}
