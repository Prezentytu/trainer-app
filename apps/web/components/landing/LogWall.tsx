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
  { text: "Podciąganie BW × 8", pr: false },
  { text: "OHP 60,0 × 4", pr: true },
] as const;

const CELL_COUNT = 160;

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

function Wall({ revealed }: { revealed?: boolean }) {
  return (
    <div
      className={`absolute inset-0 grid grid-cols-2 content-start gap-x-8 gap-y-3 px-5 pt-20 font-mono text-[12px] leading-6 sm:grid-cols-3 sm:px-8 lg:grid-cols-4 ${
        revealed ? "" : "landing-log-ghost"
      }`}
    >
      {Array.from({ length: CELL_COUNT }, (_, i) => {
        const entry = ENTRIES[i % ENTRIES.length]!;
        const pr = Boolean(revealed && entry.pr);
        return (
          <span
            key={i}
            className={`whitespace-nowrap ${
              pr ? "text-pr" : revealed ? "text-fg-faint" : ""
            }`}
          >
            {pr ? "★ " : ""}
            {entry.text}
          </span>
        );
      })}
    </div>
  );
}

/** Ściana zapisów — tekstura na marginesach, miękkie światło odsłania faint + ★PR. */
export function LogWall() {
  const reduceMotion = usePrefersReducedMotion();
  const wrapRef = useRef<HTMLDivElement>(null);

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

    const apply = () => {
      const w = layer.clientWidth;
      const h = layer.clientHeight;
      layer.style.setProperty("--x", `${current.x * w}px`);
      layer.style.setProperty("--y", `${current.y * h}px`);
    };

    const tick = (now: number) => {
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

    apply();
    raf = requestAnimationFrame(tick);
    section.addEventListener("pointermove", onMove, { passive: true });
    section.addEventListener("pointerleave", onLeave);

    return () => {
      cancelAnimationFrame(raf);
      section.removeEventListener("pointermove", onMove);
      section.removeEventListener("pointerleave", onLeave);
    };
  }, [reduceMotion]);

  return (
    <div
      ref={wrapRef}
      aria-hidden
      className="landing-log-mask landing-log-enter pointer-events-none absolute inset-0 hidden overflow-hidden select-none md:block"
      style={{ ["--x" as string]: "50%", ["--y" as string]: "32%" }}
    >
      <Wall />
      {reduceMotion ? null : (
        <div className="landing-log-beam absolute inset-0">
          <Wall revealed />
        </div>
      )}
    </div>
  );
}
