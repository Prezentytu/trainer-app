import Link from "next/link";
import { Wordmark } from "@/components/Wordmark";
import { LANDING_CAPS, LANDING_MEASURE } from "./primitives";

const NAV_LINKS = [
  { hash: "#produkt", path: "/#produkt", label: "Produkt" },
  { hash: "#ile-tracisz", path: "/#ile-tracisz", label: "Ile tracisz" },
  { hash: "#cennik", path: "/#cennik", label: "Cennik" },
  { hash: "#pytania", path: "/#pytania", label: "Pytania" },
] as const;

export function LandingNav({
  home = false,
  variant = "page",
}: {
  home?: boolean;
  variant?: "hero" | "page";
}) {
  const hero = variant === "hero";

  return (
    <header
      className={
        hero
          ? "flex-none"
          : "sticky top-0 z-30 border-b border-border bg-background"
      }
    >
      <div
        className={`flex items-center justify-between gap-4 ${
          hero ? "h-20 sm:h-[88px]" : `h-[72px] ${LANDING_MEASURE}`
        }`}
      >
        <Wordmark href={home ? "#top" : "/"} compact className="min-h-11 sm:hidden" />
        <Wordmark href={home ? "#top" : "/"} className="hidden min-h-11 sm:flex" />
        <nav className="flex min-w-0 items-center gap-3 sm:gap-8" aria-label="Sekcje strony">
          <div className="hidden items-center gap-8 lg:flex">
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={home ? link.hash : link.path}
                className={`${LANDING_CAPS} inline-flex min-h-11 items-center whitespace-nowrap text-fg-faint decoration-1 underline-offset-[6px] transition-colors duration-[var(--dur-fast)] hover:text-foreground hover:underline focus-visible:outline-none focus-visible:shadow-[var(--focus-ring)]`}
              >
                {link.label}
              </a>
            ))}
          </div>
          <Link
            href="/sign-in"
            className={
              hero
                ? "inline-flex min-h-11 shrink-0 items-center rounded-[var(--r-pill)] border border-border px-5 text-[14px] font-medium text-foreground transition-colors duration-[var(--dur-fast)] hover:border-foreground focus-visible:outline-none focus-visible:shadow-[var(--focus-ring)]"
                : "inline-flex min-h-11 shrink-0 items-center rounded-[var(--r-pill)] border border-foreground px-4 text-[13px] font-medium text-foreground transition-colors duration-[var(--dur-fast)] hover:bg-foreground hover:text-background focus-visible:outline-none focus-visible:shadow-[var(--focus-ring)]"
            }
          >
            Zaloguj się
          </Link>
        </nav>
      </div>
    </header>
  );
}
