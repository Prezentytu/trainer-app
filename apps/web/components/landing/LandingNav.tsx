import Link from "next/link";
import { Wordmark } from "@/components/Wordmark";
import { Button } from "@/components/ui";

const LINKS = [
  { href: "#roznice", label: "Dlaczego WA" },
  { href: "#jak-to-dziala", label: "Jak to działa" },
  { href: "#dane", label: "Twoje dane" },
  { href: "#faq", label: "FAQ" },
];

export function LandingNav() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-surface/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Wordmark />
        <nav className="hidden items-center gap-1 md:flex">
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-[10px] px-3 py-2 text-sm text-foreground-secondary transition-colors hover:bg-surface-hover hover:text-accent-strong"
            >
              {link.label}
            </a>
          ))}
        </nav>
        <div className="flex shrink-0 items-center gap-2">
          <Link href="/sign-in" className="hidden sm:block">
            <Button variant="ghost" size="sm">
              Zaloguj się
            </Button>
          </Link>
          <Link href="/sign-up">
            <Button size="sm">Zacznij bezpłatnie</Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
