import Link from "next/link";
import { Wordmark } from "@/components/Wordmark";

export function LandingFooter() {
  return (
    <footer className="border-t border-border px-5 pb-12 pt-16 sm:px-6 sm:pb-14 sm:pt-24">
      <div className="mx-auto max-w-6xl">
        <p
          aria-hidden
          className="display-landing text-[clamp(2rem,6vw,4.5rem)] leading-none text-muted-faint"
        >
          RepMaxer
        </p>

        <div className="mt-12 flex flex-col gap-6 border-t border-border pt-8 sm:flex-row sm:items-center sm:justify-between">
          <Wordmark />
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-muted">
            <Link
              href="/sign-in"
              className="landing-link-underline transition-colors hover:text-foreground"
            >
              Zaloguj się
            </Link>
            <Link
              href="/sign-up"
              className="landing-link-underline transition-colors hover:text-foreground"
            >
              Załóż darmowe konto
            </Link>
            <span className="text-muted-faint">
              © {new Date().getFullYear()} RepMaxer
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
