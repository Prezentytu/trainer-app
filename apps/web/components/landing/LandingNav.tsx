import Link from "next/link";
import { Wordmark } from "@/components/Wordmark";
import { Button } from "@/components/ui";

const LINKS = [
  { href: "#jak-to-dziala", label: "Jak to działa" },
  { href: "#cennik", label: "Cennik" },
];

export function LandingNav() {
  return (
    <header className="sticky top-0 z-50 bg-background/70 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-5 sm:h-16 sm:px-6">
        <Wordmark />
        <nav className="hidden items-center gap-8 md:flex" aria-label="Sekcje strony">
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm text-muted transition-colors duration-[var(--dur-fast)] hover:text-foreground focus-visible:outline-none focus-visible:shadow-[var(--glow-accent)]"
            >
              {link.label}
            </a>
          ))}
        </nav>
        <div className="flex shrink-0 items-center gap-2">
          <Link href="/sign-in" className="hidden sm:block">
            <span className="inline-flex h-9 items-center px-3 text-sm text-muted transition-colors hover:text-foreground">
              Zaloguj się
            </span>
          </Link>
          <Link href="/sign-up">
            <Button size="sm">Zacznij za darmo</Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
