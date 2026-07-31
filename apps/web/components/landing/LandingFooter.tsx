import Link from "next/link";
import { Wordmark } from "@/components/Wordmark";

export function LandingFooter() {
  return (
    <footer className="border-t border-border bg-surface-sunken px-4 py-8 sm:px-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Wordmark />
          <p className="mt-2 max-w-sm text-xs text-muted">
            Plany, które klienci naprawdę robią.
          </p>
        </div>
        <div className="flex flex-wrap gap-4 text-sm text-muted-strong">
          <Link href="/sign-in" className="hover:text-accent-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
            Zaloguj się
          </Link>
          <Link href="/sign-up" className="hover:text-accent-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
            Zacznij za darmo
          </Link>
          <a href="#faq" className="hover:text-accent-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
            FAQ
          </a>
        </div>
      </div>
      <p className="mx-auto mt-6 max-w-6xl text-xs text-muted-faint">
        © {new Date().getFullYear()} Workout Alchemist. Wczesny dostęp.
      </p>
    </footer>
  );
}
