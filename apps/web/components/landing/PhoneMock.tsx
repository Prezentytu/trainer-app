"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Icon } from "@/components/Icon";
import { Button } from "@/components/ui";
import { LandingReveal } from "./LandingReveal";
import { SetRowHeader } from "./primitives";

const SETS = [
  { n: "1", weight: "100,0", reps: "5" },
  { n: "2", weight: "102,5", reps: "5" },
  { n: "3", weight: "102,5", reps: "5" },
  { n: "4", weight: "105,0", reps: "3" },
] as const;

const POINTS = [
  { n: "04", title: "Jeden link", body: "Bez konta i bez instalacji." },
  { n: "05", title: "Ciężary już wpisane", body: "Poprawia tylko to, co się zmieniło." },
  { n: "06", title: "Działa bez zasięgu", body: "Dosyła się, gdy wróci internet." },
] as const;

function subscribeReducedMotion(onChange: () => void) {
  const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
}

function usePrefersReducedMotion() {
  return useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );
}

export function PhoneMock() {
  const reduceMotion = usePrefersReducedMotion();
  const [done, setDone] = useState(0);

  useEffect(() => {
    if (reduceMotion) return;
    const id = window.setInterval(() => {
      setDone((d) => (d >= SETS.length + 2 ? 0 : d + 1));
    }, 1100);
    return () => window.clearInterval(id);
  }, [reduceMotion]);

  const completed = reduceMotion ? SETS.length : Math.min(done, SETS.length);

  return (
    <LandingReveal
      as="section"
      className="mx-auto max-w-[1200px] px-5 pt-[clamp(6rem,12vw,10rem)] sm:px-8"
    >
      <p
        className="landing-stagger t-label m-0 tracking-[0.16em]"
        style={{ ["--i" as string]: 0 }}
      >
        02 — Dla twojego klienta
      </p>
      <h2
        className="landing-stagger mt-6 max-w-[16ch] text-[clamp(1.875rem,4.2vw,3.25rem)] font-semibold leading-[1.08] tracking-[-0.028em] text-balance"
        style={{ ["--i" as string]: 1 }}
      >
        Otwiera link i odhacza serie.
      </h2>

      <div
        className="landing-stagger mt-12 flex justify-center md:mt-16"
        style={{ ["--i" as string]: 2 }}
      >
        <div
          className="w-full max-w-[380px] rounded-3xl border border-border-strong bg-surface-sunken px-5 py-6"
          aria-label="Podgląd portalu klienta"
        >
          <div className="flex items-center justify-between">
            <span className="t-label tracking-[0.16em]">Środa, 25 mar 2026</span>
            <Icon name="clock-countdown" size={18} decorative />
          </div>
          <h3 className="t-title mt-3 mb-6 text-[22px]">Wyciskanie sztangi</h3>

          <SetRowHeader />
          <div>
            {SETS.map((s, i) => {
              const checked = i < completed;
              return (
                <div
                  key={s.n}
                  className="grid min-h-11 grid-cols-[28px_1fr_1fr_40px] items-center gap-2 border-b border-border"
                >
                  <span className="t-num text-[13px] text-fg-faint">{s.n}</span>
                  <span className={`t-num text-[15px] ${checked ? "text-foreground" : "text-fg-ghost"}`}>
                    {s.weight}
                  </span>
                  <span className={`t-num text-[15px] ${checked ? "text-foreground" : "text-fg-ghost"}`}>
                    {s.reps}
                  </span>
                  <span
                    className={`t-num text-right text-[14px] ${checked ? "text-foreground" : "text-fg-ghost"}`}
                    aria-hidden
                  >
                    {checked ? "✓" : "—"}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-6">
            <Button full size="md" className="uppercase tracking-[0.08em]">
              Zakończ trening
            </Button>
          </div>
        </div>
      </div>

      <ol className="mt-12 grid list-none grid-cols-1 gap-10 border-t border-border p-0 pt-10 sm:mt-16 sm:grid-cols-3">
        {POINTS.map((p, i) => (
          <li
            key={p.n}
            className="landing-stagger grid content-start gap-3"
            style={{ ["--i" as string]: 3 + i }}
          >
            <span className="t-num text-[13px] text-fg-ghost">{p.n}</span>
            <h3 className="t-heading m-0">{p.title}</h3>
            <p className="t-small m-0 leading-[1.6]">{p.body}</p>
          </li>
        ))}
      </ol>
    </LandingReveal>
  );
}
