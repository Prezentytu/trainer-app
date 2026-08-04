import Link from "next/link";
import { Button } from "@/components/ui";

export function Hero() {
  return (
    <section id="produkt" className="relative scroll-mt-20 px-5 pt-24 sm:px-6 sm:pt-32">
      <div className="relative z-[1] mx-auto max-w-3xl text-center">
        <div className="landing-reveal flex items-center justify-center gap-3">
          <span className="inline-flex h-3 w-3 shrink-0 bg-accent" aria-hidden />
          <span className="display-caps text-base text-foreground sm:text-lg">Workout Alchemist</span>
        </div>

        <p className="landing-reveal landing-reveal-delay-1 mt-8 text-sm text-muted">
          Dla trenerów personalnych
        </p>

        <h1 className="landing-reveal landing-reveal-delay-1 mt-5 display-soft text-[clamp(2.75rem,7vw,4.75rem)] text-foreground text-pretty">
          Układasz plan.
          <br />
          Widzisz każdą serię.
        </h1>

        <p className="landing-reveal landing-reveal-delay-2 mx-auto mt-7 max-w-lg text-[17px] leading-relaxed text-muted text-pretty">
          Wysyłasz klientowi jeden link. On zapisuje serie w telefonie, Ty widzisz każdy trening na
          żywo.
        </p>

        <div className="landing-reveal landing-reveal-delay-3 mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
          <Link href="/sign-up">
            <Button size="lg">Zacznij za darmo</Button>
          </Link>
          <a
            href="#jak-to-dziala"
            className="text-sm text-muted transition-colors hover:text-foreground focus-visible:outline-none focus-visible:shadow-[var(--glow-accent)]"
          >
            Zobacz, jak to działa
          </a>
        </div>

        <p className="landing-reveal landing-reveal-delay-4 mt-8 text-sm text-muted-faint">
          Wczesny dostęp za darmo · bez karty · klient bez aplikacji
        </p>
      </div>
    </section>
  );
}
