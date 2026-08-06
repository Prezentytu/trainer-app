"use client";

import type { MouseEvent } from "react";
import { LandingReveal } from "./LandingReveal";

const TRAINER_POINTS = [
  {
    n: "01",
    title: "Plan w kilka minut",
    body: "Układasz raz, przypisujesz kolejnym klientom.",
  },
  {
    n: "02",
    title: "Wiesz, kto trenuje",
    body: "Zakończony trening widzisz od razu.",
  },
  {
    n: "03",
    title: "Rekordy i zastoje",
    body: "Wychwytujemy je automatycznie.",
  },
] as const;

const CLIENT_POINTS = [
  {
    n: "04",
    title: "Jeden link",
    body: "Bez konta i bez instalacji.",
  },
  {
    n: "05",
    title: "Ciężary już wpisane",
    body: "Poprawia tylko to, co się zmieniło.",
  },
  {
    n: "06",
    title: "Działa bez zasięgu",
    body: "Dosyła się, gdy wróci internet.",
  },
] as const;

function onGridMove(e: MouseEvent<HTMLOListElement>) {
  const grid = e.currentTarget;
  for (const cell of grid.querySelectorAll<HTMLElement>(".landing-spotlight")) {
    const rect = cell.getBoundingClientRect();
    cell.style.setProperty("--mouse-x", `${e.clientX - rect.left}px`);
    cell.style.setProperty("--mouse-y", `${e.clientY - rect.top}px`);
  }
}

function PointCell({
  n,
  title,
  body,
  index,
}: {
  n: string;
  title: string;
  body: string;
  index: number;
}) {
  return (
    <li
      className="landing-point-cell landing-spotlight landing-stagger flex flex-col gap-3 border-b border-r border-border p-6 sm:p-8"
      style={{ ["--i" as string]: index }}
    >
      <span className="font-mono text-lg uppercase tracking-caps text-muted-faint">{n}</span>
      <h3 className="display-landing text-[1.0625rem] tracking-[-0.02em] text-foreground sm:text-[1.1875rem]">
        {title}
      </h3>
      <p className="text-[14px] leading-relaxed text-muted">{body}</p>
    </li>
  );
}

export function Points() {
  return (
    <LandingReveal
      as="section"
      id="co-dostajesz"
      className="scroll-mt-24 border-t border-border px-5 py-32 sm:px-6 sm:py-44"
    >
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <p className="font-mono text-[11px] uppercase tracking-[var(--tracking-eyebrow)] text-muted">
            04 — Co dostajesz
          </p>
          <h2 className="mt-4 display-landing text-[clamp(1.5rem,3.4vw,2.75rem)] text-foreground text-pretty">
            Reszta dzieje się sama.
          </h2>
        </div>

        <div className="mt-16 space-y-14 sm:mt-20 sm:space-y-16">
          <div>
            <p className="mb-4 font-mono text-[11px] uppercase tracking-[var(--tracking-eyebrow)] text-muted">
              Dla ciebie
            </p>
            <ol
              className="grid border-t border-l border-border sm:grid-cols-3"
              onMouseMove={onGridMove}
            >
              {TRAINER_POINTS.map((point, i) => (
                <PointCell key={point.n} {...point} index={i} />
              ))}
            </ol>
          </div>

          <div>
            <p className="mb-4 font-mono text-[11px] uppercase tracking-[var(--tracking-eyebrow)] text-muted">
              Dla twojego klienta
            </p>
            <ol
              className="grid border-t border-l border-border sm:grid-cols-3"
              onMouseMove={onGridMove}
            >
              {CLIENT_POINTS.map((point, i) => (
                <PointCell key={point.n} {...point} index={i} />
              ))}
            </ol>
          </div>
        </div>
      </div>
    </LandingReveal>
  );
}
