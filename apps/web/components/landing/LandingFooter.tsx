import Link from "next/link";
import { Wordmark } from "@/components/Wordmark";
import { LANDING_CAPS, LANDING_MEASURE } from "./primitives";

export function LandingFooter({ home = false }: { home?: boolean }) {
  const footerLinks = [
    { href: home ? "#cennik" : "/#cennik", label: "Cennik" },
    { href: "mailto:kontakt@repmaxer.pl", label: "Kontakt" },
    { href: "/regulamin", label: "Regulamin" },
    { href: "/prywatnosc", label: "Prywatność" },
  ] as const;
  return (
    <footer className="border-t border-border">
      <div
        className={`flex flex-col gap-6 py-10 sm:flex-row sm:items-center sm:justify-between sm:gap-8 ${LANDING_MEASURE}`}
      >
        <Wordmark href={home ? "#top" : "/"} />
        <nav className="flex flex-wrap gap-x-6 gap-y-2" aria-label="Stopka">
          {footerLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`${LANDING_CAPS} inline-flex min-h-11 items-center text-foreground transition-colors duration-[var(--dur-fast)] hover:text-muted focus-visible:outline-none focus-visible:shadow-[var(--focus-ring)]`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <span className={`${LANDING_CAPS} text-fg-ghost`}>
          © {new Date().getFullYear()} RepMaxer
        </span>
      </div>
    </footer>
  );
}
