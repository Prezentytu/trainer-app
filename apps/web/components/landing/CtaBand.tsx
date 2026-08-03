import Link from "next/link";
import { LandingReveal } from "./LandingReveal";

export function CtaBand() {
  return (
    <LandingReveal as="section" id="cta" className="bg-accent text-accent-foreground">
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-10 px-5 py-24 sm:flex-row sm:items-center sm:px-6 sm:py-28">
        <div>
          <p className="font-mono text-xs font-medium uppercase tracking-[0.2em] text-accent-foreground/70">
            {"/// Bez karty"}
          </p>
          <h2 className="mt-4 display-caps text-[clamp(2.375rem,5.4vw,4.25rem)] text-accent-foreground">
            Pierwszy plan
            <br />
            zrobisz dziś
            <span className="text-accent-foreground">.</span>
          </h2>
          <p className="mt-4 text-[15px] font-medium text-accent-foreground/75">
            Wczesny dostęp za darmo, bez karty.
          </p>
        </div>
        <Link
          href="/sign-up"
          className="inline-flex h-14 shrink-0 items-center justify-center rounded-[10px] bg-background px-9 font-display text-base font-bold text-foreground transition-[background-color,transform] duration-[var(--dur-med)] hover:bg-surface-raised active:scale-[0.98] focus-visible:outline-none focus-visible:shadow-[var(--glow-accent)]"
        >
          Zacznij za darmo →
        </Link>
      </div>
    </LandingReveal>
  );
}
