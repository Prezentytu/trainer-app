"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Wordmark } from "@/components/Wordmark";
import { LandingCta } from "./primitives";

const NAV_LINKS = [
  { hash: "#produkt", path: "/#produkt", label: "Produkt" },
  { hash: "#cennik", path: "/#cennik", label: "Cennik" },
] as const;

export function LandingNav({
  home = false,
  action = "wdrozenie",
}: {
  home?: boolean;
  action?: "wdrozenie" | "konto";
}) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-30 border-b bg-background transition-[border-color] duration-[var(--dur-fast)] ${
        scrolled ? "border-border" : "border-transparent"
      }`}
    >
      <div className="mx-auto flex h-[72px] max-w-[1200px] items-center justify-between gap-6 px-5 sm:px-8">
        <Wordmark href={home ? "#top" : "/"} />
        <nav className="flex items-center gap-4 sm:gap-8" aria-label="Sekcje strony">
          <div className="hidden items-center gap-8 sm:flex">
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={home ? link.hash : link.path}
                className="t-label tracking-[0.16em] text-foreground transition-colors duration-[var(--dur-fast)] hover:text-muted focus-visible:outline-none focus-visible:shadow-[var(--focus-ring)]"
              >
                {link.label}
              </a>
            ))}
          </div>
          {action === "konto" ? (
            <Link
              href="/sign-up"
              className="t-label tracking-[0.16em] text-foreground transition-colors duration-[var(--dur-fast)] hover:text-muted focus-visible:outline-none focus-visible:shadow-[var(--focus-ring)]"
            >
              Konto
            </Link>
          ) : (
            <LandingCta href="/wdrozenie" size="sm">
              Umów wdrożenie
            </LandingCta>
          )}
        </nav>
      </div>
    </header>
  );
}
