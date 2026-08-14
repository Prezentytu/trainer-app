"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Wordmark } from "@/components/Wordmark";
import { LandingCta } from "./primitives";

const NAV_LINKS = [
  { hash: "#produkt", path: "/#produkt", label: "Produkt", id: "produkt" },
  { hash: "#cennik", path: "/#cennik", label: "Cennik", id: "cennik" },
  { hash: "#pytania", path: "/#pytania", label: "Pytania", id: "pytania" },
] as const;

export function LandingNav({
  home = false,
  action = "wdrozenie",
}: {
  home?: boolean;
  action?: "wdrozenie" | "konto";
}) {
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const [pageProgress, setPageProgress] = useState(0);

  useEffect(() => {
    let raf = 0;
    const measure = () => {
      setScrolled(window.scrollY > 8);
      const doc = document.documentElement;
      const max = doc.scrollHeight - doc.clientHeight;
      setPageProgress(max > 0 ? Math.min(1, window.scrollY / max) : 0);
    };
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  useEffect(() => {
    if (!home) return;
    const ids = NAV_LINKS.map((l) => l.id);
    const observed = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el != null);
    if (observed.length === 0) return;

    const visible = new Map<string, number>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            visible.set(entry.target.id, entry.intersectionRatio);
          } else {
            visible.delete(entry.target.id);
          }
        }
        if (visible.size === 0) {
          setActive(null);
          return;
        }
        let bestId = "";
        let bestRatio = -1;
        for (const [id, ratio] of visible) {
          if (ratio > bestRatio) {
            bestRatio = ratio;
            bestId = id;
          }
        }
        setActive(bestId);
      },
      { rootMargin: "-28% 0px -58% 0px", threshold: [0, 0.15, 0.4, 0.7] },
    );
    observed.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [home]);

  return (
    <header
      className={`relative sticky top-0 z-30 border-b bg-background transition-[border-color] duration-[var(--dur-fast)] ${
        scrolled ? "border-border" : "border-transparent"
      }`}
    >
      <div className="mx-auto flex h-[72px] max-w-[1200px] items-center justify-between gap-4 px-5 sm:gap-6 sm:px-8">
        <Wordmark href={home ? "#top" : "/"} compact className="min-h-11 sm:hidden" />
        <Wordmark href={home ? "#top" : "/"} className="hidden min-h-11 sm:flex" />
        <nav className="flex min-w-0 items-center gap-3 sm:gap-8" aria-label="Sekcje strony">
          <div className="hidden items-center gap-8 sm:flex">
            {NAV_LINKS.map((link) => {
              const isActive = home && active === link.id;
              return (
                <a
                  key={link.label}
                  href={home ? link.hash : link.path}
                  aria-current={isActive ? "location" : undefined}
                  className={`relative inline-flex min-h-11 items-center t-label tracking-[0.16em] transition-colors duration-[var(--dur-fast)] hover:text-foreground focus-visible:outline-none focus-visible:shadow-[var(--focus-ring)] ${
                    !home || isActive ? "text-foreground" : "text-muted"
                  }`}
                >
                  {link.label}
                  {isActive ? (
                    <span className="absolute inset-x-0 -bottom-1 h-px bg-invert-bg" aria-hidden />
                  ) : null}
                </a>
              );
            })}
          </div>
          <Link
            href="/sign-in"
            className="inline-flex min-h-11 shrink-0 items-center t-label tracking-[0.16em] text-muted transition-colors duration-[var(--dur-fast)] hover:text-foreground focus-visible:outline-none focus-visible:shadow-[var(--focus-ring)]"
          >
            Zaloguj się
          </Link>
          {action === "wdrozenie" ? (
            <LandingCta href="/wdrozenie" size="sm" className="inline-flex min-h-11 shrink-0 items-center">
              Umów wdrożenie
            </LandingCta>
          ) : null}
        </nav>
      </div>
      <span
        className="pointer-events-none absolute inset-x-0 bottom-0 h-0.5 origin-left bg-invert-bg"
        style={{ transform: `scaleX(${pageProgress})` }}
        aria-hidden
      />
    </header>
  );
}
