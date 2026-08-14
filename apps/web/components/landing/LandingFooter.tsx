import Link from "next/link";
import { Wordmark } from "@/components/Wordmark";

const FOOTER_LINKS = [
  { href: "/#cennik", label: "Cennik" },
  { href: "mailto:kontakt@repmaxer.pl", label: "Kontakt" },
  { href: "/regulamin", label: "Regulamin" },
  { href: "/prywatnosc", label: "Prywatność" },
  { href: "/sign-in", label: "Zaloguj się" },
] as const;

export function LandingFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-6 px-5 py-10 sm:flex-row sm:items-center sm:justify-between sm:gap-8 sm:px-8">
        <Wordmark href="/" />
        <nav className="flex flex-wrap gap-x-6 gap-y-2" aria-label="Stopka">
          {FOOTER_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="inline-flex min-h-11 items-center t-label tracking-[0.16em] text-foreground transition-colors duration-[var(--dur-fast)] hover:text-muted focus-visible:outline-none focus-visible:shadow-[var(--focus-ring)]"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <span className="t-label tracking-[0.16em] text-fg-ghost">
          © {new Date().getFullYear()} RepMaxer
        </span>
      </div>
    </footer>
  );
}
