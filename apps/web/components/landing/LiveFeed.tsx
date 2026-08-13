"use client";

import { useEffect, useRef, useState } from "react";
import { Marker } from "@/components/ui";
import { LANDING_EASE } from "./primitives";

type FeedTone = "pr" | "gain" | "flat";

type FeedRow = {
  id: string;
  name: string;
  lift: string;
  value: string;
  tone: FeedTone;
  mark: string;
};

const FEED: FeedRow[] = [
  { id: "1", name: "Michał Dąbrowski", lift: "Martwy ciąg", value: "142,5 kg × 3", tone: "pr", mark: "PR" },
  { id: "2", name: "Marta Lewicka", lift: "Wyciskanie", value: "62,5 kg × 8", tone: "gain", mark: "+2,5" },
  { id: "3", name: "Ola Wiśniewska", lift: "Przysiad", value: "85,0 kg × 5", tone: "gain", mark: "+5,0" },
  { id: "4", name: "Piotr Sikora", lift: "Wiosłowanie", value: "70,0 kg × 10", tone: "flat", mark: "=" },
  { id: "5", name: "Ewa Sobczak", lift: "Podciąganie", value: "8,0 kg × 6", tone: "gain", mark: "+2,0" },
  { id: "6", name: "Tomek Rak", lift: "OHP", value: "52,5 kg × 5", tone: "flat", mark: "=" },
  { id: "7", name: "Julia Bąk", lift: "Hip thrust", value: "110,0 kg × 8", tone: "pr", mark: "PR" },
  { id: "8", name: "Kasia Nowak", lift: "Martwy rumuński", value: "90,0 kg × 8", tone: "gain", mark: "+5,0" },
  { id: "9", name: "Adam Król", lift: "Wyciskanie", value: "100,0 kg × 5", tone: "pr", mark: "PR" },
  { id: "10", name: "Natalia Górska", lift: "Przysiad goblet", value: "32,0 kg × 12", tone: "gain", mark: "+2,0" },
  { id: "11", name: "Bartek Lis", lift: "Uginanie", value: "22,5 kg × 10", tone: "flat", mark: "=" },
  { id: "12", name: "Zuzanna Pawlak", lift: "Wykroki", value: "40,0 kg × 8", tone: "gain", mark: "+2,5" },
  { id: "13", name: "Filip Mazur", lift: "Martwy ciąg", value: "160,0 kg × 2", tone: "pr", mark: "PR" },
  { id: "14", name: "Ania Kubiak", lift: "Wyciskanie hantli", value: "22,5 kg × 10", tone: "gain", mark: "+2,5" },
  { id: "15", name: "Marek Ostrowski", lift: "Przysiad", value: "120,0 kg × 5", tone: "gain", mark: "+5,0" },
  { id: "16", name: "Iga Zielińska", lift: "Wiosło jednorącz", value: "28,0 kg × 10", tone: "flat", mark: "=" },
  { id: "17", name: "Paweł Chmiel", lift: "OHP", value: "60,0 kg × 4", tone: "pr", mark: "PR" },
  { id: "18", name: "Weronika Szał", lift: "Hip thrust", value: "130,0 kg × 6", tone: "gain", mark: "+10" },
  { id: "19", name: "Dominik Jank", lift: "Podciąganie", value: "BW × 12", tone: "gain", mark: "+2" },
  { id: "20", name: "Karolina Rut", lift: "Martwy ciąg", value: "95,0 kg × 5", tone: "flat", mark: "=" },
  { id: "21", name: "Szymon Dudek", lift: "Wyciskanie", value: "87,5 kg × 3", tone: "gain", mark: "+2,5" },
  { id: "22", name: "Magda Kaczor", lift: "Przysiad front", value: "70,0 kg × 6", tone: "pr", mark: "PR" },
  { id: "23", name: "Rafał Wolski", lift: "Farmers walk", value: "2×40 kg", tone: "flat", mark: "=" },
  { id: "24", name: "Hania Biel", lift: "Wyciskanie nóg", value: "140,0 kg × 10", tone: "gain", mark: "+10" },
];

const STEP = [
  "text-foreground",
  "text-muted",
  "text-fg-faint",
  "text-fg-ghost",
] as const;

const STEP_Q = [
  "text-fg-faint",
  "text-fg-faint",
  "text-fg-ghost",
  "text-fg-ghost",
] as const;

const VISIBLE = 4;

export function LiveFeed() {
  const [head, setHead] = useState(0);
  const [paused, setPaused] = useState(false);
  const firstRowRef = useRef<HTMLLIElement | null>(null);
  const prevHead = useRef(head);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    const id = window.setInterval(() => {
      if (paused) return;
      setHead((h) => (h + 1) % FEED.length);
    }, 2800);
    return () => window.clearInterval(id);
  }, [paused]);

  useEffect(() => {
    if (prevHead.current === head) return;
    prevHead.current = head;
    const row = firstRowRef.current;
    if (!row) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    row.style.animation = "none";
    void row.offsetWidth;
    row.style.animation = `landing-feed-in 520ms ${LANDING_EASE}`;
  }, [head]);

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
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-4 border-b border-border-strong pb-3 sm:grid-cols-3">
        <span className="t-label tracking-[0.16em]">Podgląd</span>
        <span className="t-label hidden tracking-[0.16em] text-fg-ghost sm:block">Ćwiczenie</span>
        <span className="t-label tracking-[0.16em] text-right text-fg-ghost">Dane przykładowe</span>
      </div>
      <ul className="m-0 list-none p-0" aria-label="Przykładowe wyniki klientów">
        {rows.map((r, i) => (
          <li
            key={r.id}
            ref={i === 0 ? firstRowRef : undefined}
            className="grid min-h-14 grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border-b border-border sm:grid-cols-3"
          >
            <span className="grid min-w-0 gap-0.5 text-left">
              <span className={`break-words text-[15px] font-medium ${STEP[i]}`}>{r.name}</span>
              <span className={`t-label ${STEP_Q[i]} sm:hidden`}>{r.lift}</span>
            </span>
            <span className={`t-label hidden min-w-0 break-words text-left sm:block ${STEP_Q[i]}`}>
              {r.lift}
            </span>
            <span className="flex w-full items-center justify-end gap-3">
              <span className={`t-num text-[15px] tabular-nums ${STEP[i]}`}>{r.value}</span>
              <span className="flex w-16 shrink-0 justify-end">
                {i < 2 && r.tone !== "flat" ? <Marker tone={r.tone}>{r.mark}</Marker> : null}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
