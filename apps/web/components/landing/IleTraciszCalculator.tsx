"use client";

import { useEffect, useRef, useState } from "react";
import { LandingCta } from "@/components/landing/primitives";

const SESSIONS_PER_MONTH = 8;
const DEFAULT_RATE = 150;
const DEFAULT_LEFT = 5;
const RATE_MIN = 50;
const RATE_MAX = 400;
const RATE_STEP = 5;
const LEFT_MIN = 0;
const LEFT_MAX = 20;
const COUNT_MS = 480;

function formatZl(n: number): string {
  return `${Math.round(n).toLocaleString("pl-PL")} zł`;
}

function osobyWord(n: number): string {
  if (n === 1) return "osoba";
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "osoby";
  return "osób";
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
        <label htmlFor={id} className="t-label min-w-0 break-words tracking-[0.16em]">
          {label}
        </label>
        <span className="t-num shrink-0 text-[15px] tabular-nums">{formatValue(value)}</span>
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

export function IleTraciszCalculator({ className = "mt-12" }: { className?: string }) {
  const [rate, setRate] = useState(DEFAULT_RATE);
  const [left, setLeft] = useState(DEFAULT_LEFT);
  const loss = left * rate * SESSIONS_PER_MONTH;
  const shown = useAnimatedNumber(loss);

  return (
    <div className={className}>
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
          label="Ile osób skończyło współpracę w tym roku"
          value={left}
          min={LEFT_MIN}
          max={LEFT_MAX}
          step={1}
          formatValue={(n) => n.toLocaleString("pl-PL")}
          describedBy="ile-tracisz-left-hint"
          onChange={setLeft}
        />
      </form>
      <p id="ile-tracisz-rate-hint" className="sr-only">
        Kwota, którą bierzesz za jeden trening.
      </p>
      <p id="ile-tracisz-left-hint" className="sr-only">
        Liczba podopiecznych, którzy skończyli współpracę w tym roku.
      </p>

      <div className="mt-12 grid gap-6 border-t border-border pt-10">
        <p className="t-label m-0 tracking-[0.16em] text-muted">Nie odbyło się</p>
        <output
          htmlFor="ile-tracisz-rate ile-tracisz-left"
          aria-live="polite"
          className="t-num m-0 block not-italic text-[clamp(2.75rem,8vw,5.5rem)] leading-none tracking-[-0.03em] tabular-nums"
        >
          {formatZl(shown)}
        </output>
        <p className="m-0 text-[17px] leading-[1.6] text-muted">
          {formatZl(rate)} × {SESSIONS_PER_MONTH} sesji × {left.toLocaleString("pl-PL")}{" "}
          {osobyWord(left)}. 39 zł za 15 osób.
        </p>
        <LandingCta href="/wdrozenie" full>
          Umów 30 minut wdrożenia
        </LandingCta>
      </div>
    </div>
  );
}
