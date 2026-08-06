"use client";

import { useEffect, useState } from "react";
import { Marker } from "@/components/ui";
import { LANDING_EASE } from "./primitives";

type FeedTone = "pr" | "gain" | "flat";

type FeedRow = {
  name: string;
  lift: string;
  value: string;
  tone: FeedTone;
  mark: string;
};

const FEED: FeedRow[] = [
  { name: "Marek Zieliński", lift: "Martwy ciąg", value: "142,5 kg × 3", tone: "pr", mark: "PR" },
  { name: "Anna Nowak", lift: "Wyciskanie", value: "62,5 kg × 8", tone: "gain", mark: "+2,5" },
  { name: "Kasia Wolska", lift: "Przysiad", value: "85,0 kg × 5", tone: "gain", mark: "+5,0" },
  { name: "Piotr Lis", lift: "Wiosłowanie", value: "70,0 kg × 10", tone: "flat", mark: "=" },
  { name: "Ewa Sobczak", lift: "Podciąganie", value: "8,0 kg × 6", tone: "gain", mark: "+2,0" },
  { name: "Tomek Rak", lift: "OHP", value: "52,5 kg × 5", tone: "flat", mark: "=" },
  { name: "Julia Bąk", lift: "Hip thrust", value: "110,0 kg × 8", tone: "pr", mark: "PR" },
];

const STEP = [
  "text-foreground",
  "text-muted",
  "text-fg-faint",
  "text-fg-ghost",
  "text-fg-ghost",
] as const;

const STEP_Q = [
  "text-fg-faint",
  "text-fg-faint",
  "text-fg-ghost",
  "text-fg-ghost",
  "text-fg-ghost",
] as const;

const VISIBLE = 5;

export function LiveFeed() {
  const [head, setHead] = useState(0);
  const [paused, setPaused] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    const id = window.setInterval(() => {
      if (paused) return;
      setHead((h) => (h + 1) % FEED.length);
      setTick((t) => t + 1);
    }, 2800);
    return () => window.clearInterval(id);
  }, [paused]);

  const rows = Array.from({ length: VISIBLE }, (_, i) => {
    const r = FEED[(head + i) % FEED.length]!;
    return { ...r, i };
  });

  return (
    <div
      className="min-w-0"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setPaused(false);
      }}
    >
      <div className="flex items-baseline justify-between border-b border-border-strong pb-3">
        <span className="t-label tracking-[0.16em]">Podgląd</span>
        <span className="t-label tracking-[0.16em] text-fg-ghost">Dziś</span>
      </div>
      <ul className="m-0 list-none p-0" aria-live="polite" aria-atomic="false">
        {rows.map((r, i) => (
          <li
            key={`${r.name}-${head}-${i}`}
            className="grid min-h-14 grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border-b border-border"
            style={
              i === 0 && tick > 0
                ? { animation: `landing-feed-in 520ms ${LANDING_EASE}` }
                : undefined
            }
          >
            <span className="grid min-w-0 gap-0.5">
              <span className={`break-words text-[15px] font-medium ${STEP[i]}`}>{r.name}</span>
              <span className={`t-label ${STEP_Q[i]}`}>{r.lift}</span>
            </span>
            <span className="flex items-center gap-3">
              <span className={`t-num text-[15px] ${STEP[i]}`}>{r.value}</span>
              <span className="flex w-16 justify-end">
                {i < 2 && r.tone !== "flat" ? (
                  <Marker tone={r.tone}>{r.mark}</Marker>
                ) : null}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
