import Link from "next/link";
import { Button } from "@/components/ui";

const TRUST = ["Bez karty", "Portal klienta bez konta", "Eksport JSON / CSV"];

export function Hero() {
  return (
    <section className="relative overflow-hidden px-4 pt-14 pb-10 sm:px-6 sm:pt-20 sm:pb-16">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_-10%,var(--accent-dim)_0%,transparent_50%)]"
      />
      <div className="relative mx-auto max-w-3xl text-center">
        <p className="landing-reveal text-xs font-semibold tracking-[0.08em] text-accent uppercase">
          Studio trenera personalnego
        </p>
        <h1 className="landing-reveal landing-reveal-delay-1 mt-4 font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl">
          Programuj treningi,{" "}
          <span className="text-accent">nie arkusze.</span>
        </h1>
        <p className="landing-reveal landing-reveal-delay-2 mx-auto mt-5 max-w-xl text-base leading-relaxed text-foreground-secondary sm:text-lg">
          Kreator planów, logger sesji i portal klienta w jednym miejscu. Podopieczny dostaje link —
          bez zakładania konta. Ty widzisz wykonanie i progres.
        </p>
        <div className="landing-reveal landing-reveal-delay-3 mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
          <Link href="/sign-up" className="sm:min-w-[200px]">
            <Button size="lg" full>
              Zacznij bezpłatnie
            </Button>
          </Link>
          <a href="#jak-to-dziala" className="sm:min-w-[200px]">
            <Button variant="secondary" size="lg" full>
              Zobacz jak to działa
            </Button>
          </a>
        </div>
        <ul className="landing-reveal landing-reveal-delay-4 mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-muted sm:text-sm">
          {TRUST.map((item) => (
            <li key={item} className="flex items-center gap-2">
              <span aria-hidden className="h-1 w-1 rounded-full bg-accent" />
              {item}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
