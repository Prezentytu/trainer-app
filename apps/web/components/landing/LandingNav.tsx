"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Wordmark } from "@/components/Wordmark";
import { Button } from "@/components/ui";

const SCROLL_ON = 28;
const SCROLL_OFF = 12;

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    let raf = 0;
    let current = false;

    const update = () => {
      raf = 0;
      const y = window.scrollY;
      const next = current ? y > SCROLL_OFF : y > SCROLL_ON;
      if (next !== current) {
        current = next;
        setScrolled(next);
      }
    };

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <header className={`landing-nav${scrolled ? " landing-nav-scrolled" : ""}`}>
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5 sm:h-[4.5rem] sm:px-6">
        <Wordmark />
        <nav className="hidden items-center gap-8 md:flex" aria-label="Sekcje strony">
          <a
            href="#cennik"
            className="landing-link-underline font-mono text-xs uppercase tracking-caps text-muted transition-colors duration-[var(--dur-fast)] hover:text-foreground focus-visible:outline-none focus-visible:shadow-[var(--glow-accent)]"
          >
            Cena
          </a>
        </nav>
        <div className="flex shrink-0 items-center gap-2">
          <Link href="/sign-in" className="hidden sm:block">
            <span className="landing-link-underline inline-flex h-9 items-center px-3 font-mono text-xs uppercase tracking-caps text-muted transition-colors hover:text-foreground">
              Zaloguj się
            </span>
          </Link>
          <Link href="/sign-up">
            <Button size="sm" variant="secondary" className="rounded-[var(--radius-pill)]">
              Załóż konto
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
