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
      setDone((d) => (d >= SETS.length + 3 ? 0 : d + 1));
    }, 1100);
    return () => window.clearInterval(id);
  }, [reduceMotion]);

  const completed = reduceMotion ? SETS.length : Math.min(done, SETS.length);

  return (
    <LandingReveal
      as="section"
      id="produkt"
      className="mx-auto max-w-[1200px] scroll-mt-24 px-5 pt-[clamp(8rem,18vw,12rem)] sm:px-8"
    >
      <div className="landing-stagger grid grid-cols-1 items-center gap-12 md:grid-cols-[minmax(0,1fr)_380px] md:gap-16">
        <div>
          <h2 className="m-0 max-w-[16ch] text-[clamp(2.25rem,5vw,4rem)] font-semibold leading-[1.08] tracking-[-0.028em] text-balance">
            Klient otwiera link i odhacza serie.
          </h2>
          <p className="mt-6 max-w-[42ch] text-[17px] font-normal leading-[1.6] text-muted text-pretty">
            Bez konta i bez instalacji. Ciężary już wpisane. Wynik dosyła się,
            gdy wróci internet.
          </p>
        </div>

        <div
          className="w-full max-w-[380px] justify-self-center rounded-3xl border border-border-strong bg-surface-sunken px-6 py-7 md:justify-self-stretch"
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
                  <span
                    className={`t-num text-[15px] transition-colors duration-[var(--dur-med)] ${
                      checked ? "text-foreground" : "text-fg-ghost"
                    }`}
                  >
                    {s.weight}
                  </span>
                  <span
                    className={`t-num text-[15px] transition-colors duration-[var(--dur-med)] ${
                      checked ? "text-foreground" : "text-fg-ghost"
                    }`}
                  >
                    {s.reps}
                  </span>
                  <span
                    className={`t-num text-right text-[14px] transition-colors duration-[var(--dur-med)] ${
                      checked ? "text-foreground" : "text-fg-ghost"
                    }`}
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
    </LandingReveal>
  );
}
