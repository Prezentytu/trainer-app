"use client";

import { useEffect, useRef } from "react";

/**
 * Canvasowe pole kropek z falą radialną — żywe tło hero (near-mono, bez lime).
 * Pauza: document.hidden, poza viewportem, prefers-reduced-motion (wtedy statyczna siatka).
 */
export function HeroField() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let running = !reduce;
    let inView = true;
    let visible = !document.hidden;
    let t0 = performance.now();

    const bone = { r: 110, g: 117, b: 102 }; // --bone-700

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const { width, height } = wrap.getBoundingClientRect();
      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = (time: number) => {
      const { width, height } = wrap.getBoundingClientRect();
      ctx.clearRect(0, 0, width, height);

      const cols = Math.max(18, Math.floor(width / 22));
      const rows = Math.max(10, Math.floor(height / 18));
      const gapX = width / (cols + 1);
      const gapY = height / (rows + 1);
      const cx = width * 0.5;
      const cy = height * 0.72;
      const phase = (time - t0) * 0.0011;

      for (let row = 0; row < rows; row++) {
        const perspective = 0.35 + (row / rows) * 0.65;
        for (let col = 0; col < cols; col++) {
          const x = gapX * (col + 1);
          const y = gapY * (row + 1);
          const dx = (x - cx) / width;
          const dy = (y - cy) / height;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const wave = reduce ? 0.35 : Math.sin(dist * 8.5 - phase) * 0.5 + 0.5;
          const alpha = (0.14 + wave * 0.34) * perspective;
          const r = (1.05 + wave * 0.85) * perspective;

          ctx.beginPath();
          ctx.fillStyle = `rgba(${bone.r},${bone.g},${bone.b},${alpha.toFixed(3)})`;
          ctx.arc(x, y + (reduce ? 0 : Math.sin(phase + dist * 6) * 2.2 * perspective), r, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    };

    const tick = (now: number) => {
      if (running && inView && visible) {
        draw(now);
        raf = requestAnimationFrame(tick);
      }
    };

    const start = () => {
      if (reduce) {
        draw(performance.now());
        return;
      }
      if (!raf && running && inView && visible) {
        t0 = performance.now();
        raf = requestAnimationFrame(tick);
      }
    };

    const stop = () => {
      if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    };

    resize();
    start();

    const onResize = () => {
      resize();
      if (reduce || !running) draw(performance.now());
    };

    const onVisibility = () => {
      visible = !document.hidden;
      if (visible) start();
      else stop();
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        inView = !!entry?.isIntersecting;
        if (inView) start();
        else stop();
      },
      { threshold: 0.05 },
    );
    io.observe(wrap);

    window.addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      stop();
      io.disconnect();
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <div
      ref={wrapRef}
      aria-hidden
      className="pointer-events-none absolute inset-x-0 bottom-0 h-[48%] overflow-hidden"
    >
      <canvas ref={canvasRef} className="h-full w-full" />
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, var(--background) 0%, transparent 38%, transparent 68%, var(--background) 100%)",
        }}
      />
    </div>
  );
}
