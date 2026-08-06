import Link from "next/link";

const FOOTER_LINKS = [
  { href: "/regulamin", label: "Regulamin" },
  { href: "/prywatnosc", label: "Prywatność" },
  { href: "mailto:kontakt@repmaxer.pl", label: "Kontakt" },
  { href: "/sign-in", label: "Zaloguj się" },
] as const;

export function LandingFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto grid max-w-[1200px] gap-12 px-5 pb-12 pt-16 sm:px-8 sm:pb-12 sm:pt-16">
        <Link
          href="/"
          className="text-[clamp(2.5rem,6vw,2.75rem)] font-semibold tracking-[-0.03em] text-foreground focus-visible:outline-none focus-visible:shadow-[var(--focus-ring)]"
        >
          RepMaxer
        </Link>
        <div className="flex flex-col gap-6 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
          <nav className="flex flex-wrap gap-x-8 gap-y-3" aria-label="Stopka">
            {FOOTER_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="t-label tracking-[0.16em] text-foreground transition-colors duration-[var(--dur-fast)] hover:text-muted focus-visible:outline-none focus-visible:shadow-[var(--focus-ring)]"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <span className="t-label tracking-[0.16em] text-fg-ghost">
            © {new Date().getFullYear()} RepMaxer
          </span>
        </div>
      </div>
    </footer>
  );
}
