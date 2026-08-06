import { Wordmark } from "@/components/Wordmark";
import { LandingCta } from "./primitives";

const NAV_LINKS = [
  { href: "#produkt", label: "Produkt" },
  { href: "#cennik", label: "Cennik" },
  { href: "#pytania", label: "Pytania" },
] as const;

export function LandingNav() {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background">
      <div className="mx-auto flex h-[72px] max-w-[1200px] items-center justify-between gap-6 px-5 sm:px-8">
        <Wordmark href="#top" />
        <nav className="flex items-center gap-4 sm:gap-8" aria-label="Sekcje strony">
          <div className="hidden items-center gap-8 sm:flex">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="t-label tracking-[0.16em] text-foreground transition-colors duration-[var(--dur-fast)] hover:text-muted focus-visible:outline-none focus-visible:shadow-[var(--focus-ring)]"
              >
                {link.label}
              </a>
            ))}
          </div>
          <LandingCta size="sm" />
        </nav>
      </div>
    </header>
  );
}
