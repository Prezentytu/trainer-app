"use client";

import { useEffect, useRef, type ReactNode } from "react";

type LandingRevealProps = {
  children: ReactNode;
  className?: string;
  as?: "div" | "section";
  id?: string;
};

/** Scroll-reveal sekcji landingu (IntersectionObserver). Respektuje prefers-reduced-motion. */
export function LandingReveal({ children, className = "", as = "div", id }: LandingRevealProps) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      el.classList.add("landing-inview");
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          el.classList.add("landing-inview");
          observer.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const Tag = as;
  return (
    <Tag ref={ref as never} id={id} className={`landing-scroll ${className}`.trim()}>
      {children}
    </Tag>
  );
}
