import Link from "next/link";
import { Button } from "@/components/ui";

export function Hero() {
  return (
    <section className="relative flex min-h-[88svh] scroll-mt-20 items-center justify-center px-5 sm:px-6">
      <div className="relative z-[1] mx-auto w-full max-w-3xl text-center">
        <p className="landing-reveal font-mono text-xs uppercase tracking-caps text-muted">
          Dla trenerów personalnych
        </p>

        <h1 className="landing-reveal landing-reveal-delay-1 mt-8 display-serif text-[clamp(3rem,7vw,6.5rem)] text-foreground text-pretty">
          Układasz plan.
          <br />
          Widzisz każdą serię.
        </h1>

        <p className="landing-reveal landing-reveal-delay-2 mx-auto mt-8 max-w-md text-[17px] leading-relaxed text-muted text-pretty">
          Jeden link dla klienta. Ty widzisz każdy trening.
        </p>

        <div className="landing-reveal landing-reveal-delay-3 mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
          <Link href="/sign-up">
            <Button size="lg">Zacznij za darmo</Button>
          </Link>
          <a
            href="#produkt"
            className="font-mono text-xs uppercase tracking-caps text-muted transition-colors hover:text-foreground focus-visible:outline-none focus-visible:shadow-[var(--glow-accent)]"
          >
            Zobacz produkt ↓
          </a>
        </div>

        <p className="landing-reveal landing-reveal-delay-4 mt-8 text-sm text-muted-faint">
          Bez karty · Klient bez aplikacji
        </p>
      </div>
    </section>
  );
}
