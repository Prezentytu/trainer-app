"use client";

import { useEffect, useRef, useState } from "react";
import { LANDING_CAPS, LandingCta } from "@/components/landing/primitives";

const SESSIONS_PER_MONTH = 8;
const DEFAULT_RATE = 150;
const DEFAULT_LEFT = 6;
const RATE_MIN = 80;
const RATE_MAX = 400;
const RATE_STEP = 10;
const LEFT_MIN = 1;
const LEFT_MAX = 24;
const COUNT_MS = 480;

function formatZl(n: number): string {
  return `${Math.round(n).toLocaleString("pl-PL")} zł`;
}

function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3;
}

/** Interpoluje kwotę; nowy gest przejmuje od aktualnej wartości. Reduced-motion = od razu. */
function useAnimatedNumber(target: number, durationMs = COUNT_MS): number {
  const [display, setDisplay] = useState(target);
  const displayRef = useRef(target);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || displayRef.current === target) {
      displayRef.current = target;
      setDisplay(target);
      return;
    }

    const from = displayRef.current;
    const start = performance.now();
    let raf = 0;

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const next = from + (target - from) * easeOutCubic(t);
      displayRef.current = next;
      setDisplay(next);
      if (t < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs]);

  return display;
}

function LandingSlider({
  id,
  label,
  value,
  min,
  max,
  step,
  formatValue,
  describedBy,
  onChange,
}: {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  formatValue: (n: number) => string;
  describedBy: string;
  onChange: (n: number) => void;
}) {
  const pct = max === min ? 0 : ((value - min) / (max - min)) * 100;

  return (
    <div className="grid gap-2">
      <div className="flex items-baseline justify-between gap-4">
        <label htmlFor={id} className={`${LANDING_CAPS} min-w-0 break-words text-muted`}>
          {label}
        </label>
        <span className="t-num shrink-0 text-[15px] tabular-nums text-foreground">
          {formatValue(value)}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={formatValue(value)}
        aria-describedby={describedBy}
        className="landing-range"
        style={{ ["--p" as string]: `${pct}%` }}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

export function IleTraciszCalculator({ className = "" }: { className?: string }) {
  const [rate, setRate] = useState(DEFAULT_RATE);
  const [left, setLeft] = useState(DEFAULT_LEFT);
  const loss = left * rate * SESSIONS_PER_MONTH;
  const shown = useAnimatedNumber(loss);

  return (
    <div className={`grid items-start gap-8 lg:grid-cols-2 lg:gap-16 ${className}`.trim()}>
      <form className="grid gap-8" onSubmit={(e) => e.preventDefault()}>
        <LandingSlider
          id="ile-tracisz-rate"
          label="Stawka za sesję"
          value={rate}
          min={RATE_MIN}
          max={RATE_MAX}
          step={RATE_STEP}
          formatValue={formatZl}
          describedBy="ile-tracisz-rate-hint"
          onChange={setRate}
        />
        <LandingSlider
          id="ile-tracisz-left"
          label="Osoby, które odeszły"
          value={left}
          min={LEFT_MIN}
          max={LEFT_MAX}
          step={1}
          formatValue={(n) => n.toLocaleString("pl-PL")}
          describedBy="ile-tracisz-left-hint"
          onChange={setLeft}
        />
        <p className={`${LANDING_CAPS} m-0 text-muted`}>
          {left.toLocaleString("pl-PL")} × {SESSIONS_PER_MONTH} sesji × {formatZl(rate)}
        </p>
        <p id="ile-tracisz-rate-hint" className="sr-only">
          Kwota, którą bierzesz za jeden trening.
        </p>
        <p id="ile-tracisz-left-hint" className="sr-only">
          Liczba podopiecznych, którzy skończyli współpracę w tym roku.
        </p>
      </form>

      <div className="grid gap-6">
        <p className={`${LANDING_CAPS} m-0 text-muted`}>Tyle nie weszło na konto</p>
        <div className="flex flex-wrap items-center gap-4 sm:gap-8">
          <output
            htmlFor="ile-tracisz-rate ile-tracisz-left"
            aria-live="polite"
            className="t-num m-0 block min-w-0 break-words not-italic text-[clamp(2rem,11vw,4rem)] leading-none tracking-[-0.02em] text-loss tabular-nums"
          >
            −{formatZl(shown)}
          </output>
          <span className="inline-flex shrink-0 flex-col items-center gap-0.5 rounded-[var(--r-pill)] bg-loss-quiet px-3 py-2 text-loss">
            <span className="font-mono text-[15px] leading-none" aria-hidden>
              ▼
            </span>
            <span className="font-mono text-[12px] font-bold tracking-wider">spadek</span>
          </span>
        </div>
        <p className={`${LANDING_CAPS} m-0 text-muted`}>
          {(left * SESSIONS_PER_MONTH).toLocaleString("pl-PL")} sesji w roku
        </p>
        <p className="m-0 max-w-[36ch] text-[16px] leading-[1.6] text-muted">
          Raport pokazuje te sygnały wcześniej.
        </p>
        <LandingCta href="/wdrozenie">Zamów darmowy raport</LandingCta>
      </div>
    </div>
  );
}
