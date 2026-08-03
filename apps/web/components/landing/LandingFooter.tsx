import Link from "next/link";
import { Wordmark } from "@/components/Wordmark";

export function LandingFooter() {
  return (
    <footer className="border-t border-border px-5 py-9 sm:px-6">
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
        <Wordmark />
        <div className="flex flex-wrap gap-6 font-mono text-[11px] uppercase tracking-caps text-muted">
          <a href="#produkt" className="transition-colors hover:text-accent">
            Produkt
          </a>
          <a href="#cennik" className="transition-colors hover:text-accent">
            Cennik
          </a>
          <Link href="/sign-in" className="transition-colors hover:text-accent">
            Zaloguj się
          </Link>
          <a href="#faq" className="transition-colors hover:text-accent">
            Faq
          </a>
        </div>
        <p className="font-mono text-[11px] uppercase tracking-caps text-muted-faint">
          © {new Date().getFullYear()} Workout Alchemist
        </p>
      </div>
    </footer>
  );
}
