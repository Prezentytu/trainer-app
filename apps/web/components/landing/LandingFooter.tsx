import Link from "next/link";
import { Wordmark } from "@/components/Wordmark";

export function LandingFooter() {
  return (
    <footer className="border-t border-border px-5 py-12 sm:px-6 sm:py-14">
      <div className="mx-auto grid max-w-6xl gap-10 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-4">
          <Wordmark />
          <p className="max-w-xs text-sm leading-relaxed text-muted">
            Plany treningowe, które klienci naprawdę robią.
          </p>
        </div>

        <div>
          <p className="font-mono text-xs uppercase tracking-caps text-muted-faint">Produkt</p>
          <ul className="mt-4 space-y-3 text-sm text-muted">
            <li>
              <a href="#jak-to-dziala" className="transition-colors hover:text-foreground">
                Jak to działa
              </a>
            </li>
            <li>
              <a href="#korzysci" className="transition-colors hover:text-foreground">
                Co dostajesz
              </a>
            </li>
            <li>
              <a href="#cennik" className="transition-colors hover:text-foreground">
                Cennik
              </a>
            </li>
          </ul>
        </div>

        <div>
          <p className="font-mono text-xs uppercase tracking-caps text-muted-faint">Konto</p>
          <ul className="mt-4 space-y-3 text-sm text-muted">
            <li>
              <Link href="/sign-in" className="transition-colors hover:text-foreground">
                Zaloguj się
              </Link>
            </li>
            <li>
              <Link href="/sign-up" className="transition-colors hover:text-foreground">
                Zacznij za darmo
              </Link>
            </li>
            <li>
              <a href="#faq" className="transition-colors hover:text-foreground">
                Pytania
              </a>
            </li>
          </ul>
        </div>

        <div className="sm:text-right lg:text-left">
          <p className="font-mono text-xs uppercase tracking-caps text-muted-faint">Status</p>
          <p className="mt-4 text-sm text-muted">Wczesny dostęp · 0 zł</p>
          <p className="mt-8 text-sm text-muted-faint">
            © {new Date().getFullYear()} Workout Alchemist
          </p>
        </div>
      </div>
    </footer>
  );
}
