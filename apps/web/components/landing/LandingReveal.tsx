"use client";

import { useEffect, useRef, type ReactNode } from "react";

type LandingRevealProps = {
  children: ReactNode;
  className?: string;
  as?: "div" | "section";
  id?: string;
};

/** Scroll-reveal sekcji landingu (IntersectionObserver). Respektuje prefers-reduced-motion + fail-open. */
export function LandingReveal({ children, className = "", as = "div", id }: LandingRevealProps) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const show = () => el.classList.add("landing-inview");

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !("IntersectionObserver" in window)) {
      show();
      return;
    }

    el.classList.add("landing-ready");

    const sweep = () => {
      if (el.getBoundingClientRect().top < window.innerHeight * 0.94) show();
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          show();
          observer.disconnect();
        }
      },
      { threshold: 0.01, rootMargin: "0px 0px -6% 0px" },
    );
    observer.observe(el);

    window.addEventListener("scroll", sweep, { passive: true });
    window.addEventListener("resize", sweep, { passive: true });
    const t0 = window.setTimeout(sweep, 80);
    let sweepTimer = window.setInterval(sweep, 700);
    const t1 = window.setTimeout(() => {
      window.clearInterval(sweepTimer);
      sweepTimer = window.setInterval(sweep, 1500);
    }, 6000);

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", sweep);
      window.removeEventListener("resize", sweep);
      window.clearTimeout(t0);
      window.clearTimeout(t1);
      window.clearInterval(sweepTimer);
    };
  }, []);

  const Tag = as;
  return (
    <Tag ref={ref as never} id={id} className={`landing-scroll ${className}`.trim()}>
      {children}
    </Tag>
  );
}
