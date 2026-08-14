"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";

const ENTRIES = [
  { text: "Wyciskanie 102,5 × 5", pr: false },
  { text: "Martwy ciąg 142,5 × 3", pr: true },
  { text: "Przysiad 85,0 × 5", pr: false },
  { text: "OHP 52,5 × 5", pr: false },
  { text: "Wiosłowanie 70,0 × 10", pr: false },
  { text: "Hip thrust 110,0 × 8", pr: true },
  { text: "Wyciskanie 100,0 × 5", pr: false },
  { text: "Przysiad 120,0 × 5", pr: false },
  { text: "Martwy rumuński 90,0 × 8", pr: false },
  { text: "Wyciskanie hantli 22,5 × 10", pr: false },
  { text: "Podciąganie × 8", pr: false },
  { text: "OHP 60,0 × 4", pr: true },
  { text: "Przysiad przedni 72,5 × 4", pr: false },
  { text: "Wyciskanie wąskie 80,0 × 6", pr: false },
  { text: "Wiosłowanie hantlą 32,5 × 10", pr: false },
  { text: "Martwy ciąg 150,0 × 1", pr: true },
  { text: "Podciąganie +10,0 × 5", pr: false },
  { text: "Ściąganie drążka 65,0 × 10", pr: false },
  { text: "Wykroki 40,0 × 10", pr: false },
  { text: "Hip thrust 95,0 × 10", pr: false },
] as const;

/** Wiersze na szynę — wypełniają kadr laptopa, nie rozpychają DOM-u. */
const ROWS = 22;

/** Deterministyczny przeplot (SSR-safe): sąsiednie wiersze nigdy się nie powtarzają. */
function entryAt(i: number) {
  return ENTRIES[(i * 7 + Math.floor(i / 4) * 3) % ENTRIES.length]!;
}

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

function Col({
  start,
  revealed,
  align = "start",
  className = "",
}: {
  start: number;
  revealed?: boolean;
  align?: "start" | "end";
  className?: string;
}) {
  return (
    <div
      className={`flex flex-col gap-3 font-mono text-[12px] leading-6 ${
        align === "end" ? "items-end text-right" : "items-start text-left"
      } ${revealed ? "" : "landing-log-ghost"} ${className}`}
    >
      {Array.from({ length: ROWS }, (_, i) => {
        const entry = entryAt(start + i);
        const pr = Boolean(revealed && entry.pr);
        return (
          <span
            key={i}
            className={`whitespace-nowrap ${
              pr ? "text-pr" : revealed ? "text-fg-muted" : ""
            }`}
          >
            <span className="inline-block w-[1.25em]" aria-hidden>
              {pr ? "★" : ""}
            </span>
            {entry.text}
          </span>
        );
      })}
    </div>
  );
}

function Wall({ revealed }: { revealed?: boolean }) {
  return (
    <div className="absolute inset-0 flex justify-between px-5 pb-24 pt-16 sm:px-8">
      <div className="flex gap-10">
        <Col start={0} revealed={revealed} />
        <Col start={ROWS} revealed={revealed} className="hidden min-[2200px]:flex" />
      </div>
      <div className="flex gap-10">
        <Col
          start={ROWS * 2}
          revealed={revealed}
          align="end"
          className="hidden min-[2200px]:flex"
        />
        <Col start={ROWS * 3} revealed={revealed} align="end" />
      </div>
    </div>
  );
}

/** Ściana zapisów — szyny przy krawędziach, dziura liczona z bloku H1, miękkie światło + ★PR. */
export function LogWall() {
  const reduceMotion = usePrefersReducedMotion();
  const wrapRef = useRef<HTMLDivElement>(null);

  // Dziura = realny blok copy, nie % viewportu — na 14" zostają szyny, na wide nie ucina wpisów.
  useEffect(() => {
    const layer = wrapRef.current;
    const copy = document.querySelector("[data-hero-copy]");
    if (!layer || !(copy instanceof HTMLElement)) return;

    const measure = () => {
      const r = copy.getBoundingClientRect();
      const lr = layer.getBoundingClientRect();
      if (r.width === 0 || lr.width === 0) return;
      layer.style.setProperty("--hole-rx", `${r.width / 2 + 28}px`);
      layer.style.setProperty("--hole-ry", `${r.height / 2 + 24}px`);
      layer.style.setProperty("--hole-x", `${r.left + r.width / 2 - lr.left}px`);
      layer.style.setProperty("--hole-y", `${r.top + r.height / 2 - lr.top}px`);
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(copy);
    ro.observe(layer);
    window.addEventListener("resize", measure, { passive: true });
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  useEffect(() => {
    if (reduceMotion) return;
    const layer = wrapRef.current;
    const section = document.getElementById("top");
    if (!layer || !section) return;

    const target = { x: 0.5, y: 0.32 };
    const current = { x: 0.5, y: 0.32 };
    let pointerAt = 0;
    let hasPointer = false;
    let raf = 0;
    let running = false;

    const apply = () => {
      const w = layer.clientWidth;
      const h = layer.clientHeight;
      layer.style.setProperty("--x", `${current.x * w}px`);
      layer.style.setProperty("--y", `${current.y * h}px`);
      layer.style.setProperty("--drift", `${window.scrollY * -0.06}px`);
    };

    const tick = (now: number) => {
      if (!running) return;
      const idle = !hasPointer || now - pointerAt > 2000;
      if (idle) {
        const t = now / 8000;
        target.x = 0.5 + 0.35 * Math.sin(t);
        target.y = 0.32 + 0.18 * Math.sin(t * 1.31 + 0.4);
      }
      current.x += (target.x - current.x) * 0.12;
      current.y += (target.y - current.y) * 0.12;
      apply();
      raf = requestAnimationFrame(tick);
    };

    const start = () => {
      if (running) return;
      running = true;
      raf = requestAnimationFrame(tick);
    };

    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      const r = layer.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return;
      hasPointer = true;
      pointerAt = performance.now();
      target.x = (e.clientX - r.left) / r.width;
      target.y = (e.clientY - r.top) / r.height;
    };

    const onLeave = () => {
      hasPointer = false;
    };

    const io = new IntersectionObserver(
      ([entry]) => (entry?.isIntersecting ? start() : stop()),
      { threshold: 0 },
    );

    apply();
    io.observe(section);
    section.addEventListener("pointermove", onMove, { passive: true });
    section.addEventListener("pointerleave", onLeave);

    return () => {
      stop();
      io.disconnect();
      section.removeEventListener("pointermove", onMove);
      section.removeEventListener("pointerleave", onLeave);
    };
  }, [reduceMotion]);

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 hidden overflow-hidden select-none md:block"
    >
      <div
        ref={wrapRef}
        className="landing-log-mask landing-log-enter absolute inset-0"
        style={{ ["--x" as string]: "50%", ["--y" as string]: "32%" }}
      >
        <div className="landing-log-drift absolute inset-0">
          <Wall />
        </div>
        {reduceMotion ? null : (
          <div className="landing-log-beam absolute inset-0">
            <div className="landing-log-drift absolute inset-0">
              <Wall revealed />
            </div>
          </div>
        )}
      </div>
      <div className="landing-log-fade" />
    </div>
  );
}
