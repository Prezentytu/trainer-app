import Link from "next/link";
import { Wordmark } from "@/components/Wordmark";

export function LandingFooter() {
  return (
    <footer className="border-t border-border px-5 py-10 sm:px-6">
      <div className="mx-auto flex max-w-5xl flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
        <Wordmark />
        <div className="flex flex-wrap gap-6 text-sm text-muted">
          <a href="#jak-to-dziala" className="transition-colors hover:text-foreground">
            Jak to działa
          </a>
          <a href="#cennik" className="transition-colors hover:text-foreground">
            Cennik
          </a>
          <a href="#faq" className="transition-colors hover:text-foreground">
            Pytania
          </a>
          <Link href="/sign-in" className="transition-colors hover:text-foreground">
            Zaloguj się
          </Link>
        </div>
        <p className="text-sm text-muted-faint">© {new Date().getFullYear()} Workout Alchemist</p>
      </div>
    </footer>
  );
}
