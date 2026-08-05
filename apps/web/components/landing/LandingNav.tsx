import Link from "next/link";
import { Wordmark } from "@/components/Wordmark";
import { Button } from "@/components/ui";

export function LandingNav() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/70 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5 sm:h-[4.5rem] sm:px-6">
        <Wordmark />
        <nav className="hidden items-center gap-8 md:flex" aria-label="Sekcje strony">
          <a
            href="#cennik"
            className="font-mono text-xs uppercase tracking-caps text-muted transition-colors duration-[var(--dur-fast)] hover:text-foreground focus-visible:outline-none focus-visible:shadow-[var(--glow-accent)]"
          >
            Cennik
          </a>
        </nav>
        <div className="flex shrink-0 items-center gap-2">
          <Link href="/sign-in" className="hidden sm:block">
            <span className="inline-flex h-9 items-center px-3 font-mono text-xs uppercase tracking-caps text-muted transition-colors hover:text-foreground">
              Zaloguj się
            </span>
          </Link>
          <Link href="/sign-up">
            <Button size="sm" variant="secondary">
              Zacznij za darmo
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
