import Link from "next/link";
import { Wordmark } from "@/components/Wordmark";

export function LandingFooter() {
  return (
    <footer className="border-t border-border px-5 py-10 sm:px-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <Wordmark />
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-muted">
          <Link href="/sign-in" className="transition-colors hover:text-foreground">
            Zaloguj się
          </Link>
          <Link href="/sign-up" className="transition-colors hover:text-foreground">
            Zacznij za darmo
          </Link>
          <span className="text-muted-faint">
            © {new Date().getFullYear()} Workout Alchemist
          </span>
        </div>
      </div>
    </footer>
  );
}
