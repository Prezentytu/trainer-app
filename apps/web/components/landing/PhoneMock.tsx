"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Icon } from "@/components/Icon";
import { LandingReveal } from "./LandingReveal";
import { SectionHead, SECTION_H2, SECTION_LEAD, SECTION_SHELL } from "./primitives";

const SETS = [
  { n: "1", weight: "100,0", reps: "5", kg: 100, repsN: 5 },
  { n: "2", weight: "102,5", reps: "5", kg: 102.5, repsN: 5 },
  { n: "3", weight: "102,5", reps: "5", kg: 102.5, repsN: 5 },
  { n: "4", weight: "105,0", reps: "3", kg: 105, repsN: 3 },
] as const;

const REST_TOTAL = 90;

function subscribeReducedMotion(onChange: () => void) {
  const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
}

function subscribeLg(onChange: () => void) {
  const mql = window.matchMedia("(min-width: 1024px)");
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

function useIsLg() {
  return useSyncExternalStore(
    subscribeLg,
    () => window.matchMedia("(min-width: 1024px)").matches,
    () => false,
  );
}

function mmss(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.max(0, seconds) % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function volumeOf(completed: number): number {
  return SETS.slice(0, completed).reduce((sum, s) => sum + s.kg * s.repsN, 0);
}

export function PhoneMock() {
  const reduceMotion = usePrefersReducedMotion();
  const isLg = useIsLg();
  const [done, setDone] = useState(0);
  const [progress, setProgress] = useState(0);

  const scrollDriven = isLg && !reduceMotion;

  useEffect(() => {
    if (reduceMotion || scrollDriven) return;
    const id = window.setInterval(() => {
      setDone((d) => (d >= SETS.length + 1 ? 0 : d + 1));
    }, 1100);
    return () => window.clearInterval(id);
  }, [reduceMotion, scrollDriven]);

  useEffect(() => {
    if (!scrollDriven) return;
    const el = document.getElementById("produkt");
    if (!el) return;

    let raf = 0;
    let tracking = false;

    const measure = () => {
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const lead = vh * 0.25;
      const total = Math.max(1, rect.height - vh);
      const p = Math.min(1, Math.max(0, (lead - rect.top) / (total + lead)));
      setProgress(p);
    };

    const onScroll = () => {
      if (!tracking) return;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(measure);
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        tracking = Boolean(entry?.isIntersecting);
        if (tracking) measure();
      },
      { threshold: 0 },
    );
    io.observe(el);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    measure();

    return () => {
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [scrollDriven]);

  const scene = reduceMotion ? 1 : scrollDriven ? progress : Math.min(1, done / SETS.length);
  const setPos = scene * SETS.length;
  const completed = reduceMotion
    ? SETS.length
    : Math.min(SETS.length, Math.floor(setPos + 0.02));
  const frac = setPos - Math.floor(setPos);
  const showRest = completed > 0 && completed < SETS.length;
  const restLeft = showRest
    ? scrollDriven
      ? Math.round(REST_TOTAL * (1 - Math.min(1, Math.max(0, frac))))
      : REST_TOTAL
    : REST_TOTAL;
  const restPct = showRest ? (restLeft / REST_TOTAL) * 100 : 0;
  const progressPct = scene * 100;

  return (
    <LandingReveal as="section" id="produkt" className={`${SECTION_SHELL} lg:min-h-[calc(100svh+32svh)]`}>
      <div className="lg:sticky lg:top-[72px] lg:z-10 lg:flex lg:h-[calc(100svh-72px)] lg:items-start lg:bg-background lg:pt-6">
        <div className="landing-stagger w-full">
          <SectionHead n="01" label="Produkt">
            <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-16 xl:gap-24">
              <div>
                <h2 className={SECTION_H2}>Klient otwiera link i&nbsp;odhacza serie.</h2>
                <p className={SECTION_LEAD}>
                  Bez konta i&nbsp;bez instalacji. Ciężary już wpisane. Wynik dosyła
                  się, gdy wróci internet.
                </p>
              </div>

              <SessionPhone
                completed={completed}
                restLeft={restLeft}
                restPct={restPct}
                showRest={showRest}
                progressPct={progressPct}
                scene={scene}
                smooth={scrollDriven}
              />
            </div>
          </SectionHead>
        </div>
      </div>
    </LandingReveal>
  );
}

function SessionPhone({
  completed,
  restLeft,
  restPct,
  showRest,
  progressPct,
  scene,
  smooth,
}: {
  completed: number;
  restLeft: number;
  restPct: number;
  showRest: boolean;
  progressPct: number;
  scene: number;
  smooth: boolean;
}) {
  const volume = volumeOf(completed);
  const totalVolume = volumeOf(SETS.length);
  const scale = 0.96 + 0.04 * scene;
  const lift = (1 - scene) * 12;
  const done = completed === SETS.length;

  return (
    <div
      className="mx-auto aspect-[9/19] h-[min(72svh,640px,calc(100svh-8rem))] shrink-0 justify-self-center"
      role="img"
      aria-label="Podgląd portalu klienta: trening wyciskania sztangi, cztery serie odhaczane po kolei, timer przerwy na dole."
      style={{
        transform: `translateY(${lift}px) scale(${scale})`,
        transformOrigin: "center center",
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none flex h-full select-none flex-col rounded-[3rem] border border-border-strong bg-surface-sunken p-2"
      >
        <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-[2.6rem] bg-background">
          <span className="absolute left-1/2 top-2 z-10 h-[18px] w-[78px] -translate-x-1/2 rounded-full bg-invert-bg" />

          <div className="flex items-center justify-between px-5 pt-3.5 pb-1">
            <span className="t-num text-[12px] text-foreground">9:41</span>
            <span className="t-num text-[12px] text-transparent">9:41</span>
          </div>

          <div className="px-4 pb-3 pt-2">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="m-0 text-[15px] font-semibold leading-snug tracking-tight text-foreground">
                  Środa
                </p>
                <p className="mt-1 font-mono text-[12px] tabular-nums text-muted">
                  {completed}/{SETS.length}
                  {" · "}
                  24:31
                  {volume > 0
                    ? ` · ${Math.round(volume).toLocaleString("pl-PL")} kg`
                    : null}
                </p>
              </div>
              <span className="inline-flex h-8 shrink-0 items-center rounded-[8px] bg-invert-bg px-2.5 font-sans text-[12px] font-semibold text-invert-fg">
                Zakończ
              </span>
            </div>
            <div className="mt-3 h-1 overflow-hidden rounded-full bg-surface-active">
              <div
                className={`h-full rounded-full bg-invert-bg ${
                  smooth ? "" : "transition-[width] duration-[var(--dur-med)] ease-[var(--ease-out)]"
                }`}
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-hidden px-4">
            <h3 className="t-title m-0 mb-3 text-[18px]">Wyciskanie sztangi</h3>
            <SetHeader />
            {SETS.map((s, i) => {
              const checked = i < completed;
              const isNext = i === completed;
              const isPr = checked && i === SETS.length - 1;
              return (
                <SetRow
                  key={s.n}
                  n={s.n}
                  weight={s.weight}
                  reps={s.reps}
                  checked={checked}
                  isNext={isNext}
                  isPr={isPr}
                />
              );
            })}
            <p className="m-0 mt-4 font-mono text-[12px] tabular-nums text-fg-ghost">
              Następne · Przysiad
            </p>
          </div>

          <div className="mt-auto border-t border-border px-3 pb-5 pt-2">
            {showRest ? (
              <div className="rounded-[10px] border border-border bg-surface-raised px-3 py-2">
                <p className="m-0 font-mono text-[22px] font-semibold leading-none tabular-nums text-foreground">
                  {mmss(restLeft)}
                </p>
                <p className="mt-1 text-[12px] text-muted">Przerwa · seria {completed + 1}</p>
                <div className="mt-2 h-1 overflow-hidden rounded-full bg-surface-active">
                  <div
                    className="h-full rounded-full bg-invert-bg"
                    style={{ width: `${restPct}%` }}
                  />
                </div>
              </div>
            ) : done ? (
              <p className="m-0 px-1 py-2 font-mono text-[12px] tabular-nums text-muted">
                {SETS.length}/{SETS.length} serie
                {" · "}
                {Math.round(totalVolume).toLocaleString("pl-PL")} kg
                {" · "}
                24:31
              </p>
            ) : null}
            <span className="mx-auto mt-3 block h-1 w-24 rounded-full bg-invert-bg" />
          </div>
        </div>
      </div>
    </div>
  );
}

function SetHeader() {
  return (
    <div className="grid grid-cols-[20px_1fr_1fr_auto] gap-2 border-b border-border pb-2">
      <span className="t-label tracking-[0.16em] text-fg-ghost">#</span>
      <span className="t-label tracking-[0.16em] text-fg-ghost">kg</span>
      <span className="t-label tracking-[0.16em] text-fg-ghost">powt.</span>
      <span className="w-[52px]" />
    </div>
  );
}

function SetRow({
  n,
  weight,
  reps,
  checked,
  isNext,
  isPr,
}: {
  n: string;
  weight: string;
  reps: string;
  checked: boolean;
  isNext: boolean;
  isPr?: boolean;
}) {
  const dim = !checked && !isNext;
  return (
    <div
      className={`grid min-h-10 grid-cols-[20px_1fr_1fr_auto] items-center gap-2 border-b border-border transition-colors duration-[var(--dur-med)] ${
        isNext ? "bg-surface" : ""
      }`}
    >
      <span className="t-num text-[12px] text-fg-faint">{n}</span>
      <span
        className={`t-num text-[14px] transition-colors duration-[var(--dur-med)] ${
          checked ? "text-foreground" : "text-fg-ghost"
        }`}
      >
        {weight}
      </span>
      <span
        className={`t-num text-[14px] transition-colors duration-[var(--dur-med)] ${
          checked ? "text-foreground" : "text-fg-ghost"
        }`}
      >
        {reps}
      </span>
      <span className="flex items-center justify-end gap-0.5">
        <span className="flex w-6 justify-center">
          {isPr ? (
            <span className="pr-celebrate-in inline-flex h-[18px] items-center rounded-[var(--r-pill)] bg-pr-dim px-1 font-mono text-[12px] font-semibold leading-none text-pr">
              PR
            </span>
          ) : null}
        </span>
        <span
          key={`${n}-${checked ? "on" : "off"}`}
          className={`flex h-[26px] w-[26px] items-center justify-center rounded-full border ${
            checked
              ? "landing-check-in border-invert-bg bg-invert-bg text-invert-fg"
              : isNext
                ? "border-foreground text-transparent"
                : "border-border-strong text-transparent"
          } ${dim ? "opacity-70" : ""}`}
        >
          <Icon name="check" size={15} decorative />
        </span>
      </span>
    </div>
  );
}
