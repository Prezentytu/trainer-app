import Link from "next/link";
import { Button } from "@/components/ui";

const TRUST = [
  "Za darmo we wczesnym dostępie",
  "Bez karty",
  "Klient nie instaluje żadnej aplikacji",
];

const ROTATING = ["robią", "kończą", "czują"];

export function Hero() {
  return (
    <section className="relative overflow-hidden px-4 pt-16 pb-12 sm:px-6 sm:pt-24 sm:pb-16">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_-10%,var(--accent-dim)_0%,transparent_50%)]"
      />
      <div className="relative mx-auto max-w-4xl text-center">
        <p className="landing-reveal text-xs font-semibold tracking-[0.08em] text-accent uppercase">
          Dla trenerów personalnych
        </p>
        <h1 className="landing-reveal landing-reveal-delay-1 mt-5 font-display text-5xl font-bold tracking-[-0.03em] text-foreground text-balance sm:text-6xl md:text-7xl lg:text-[5.5rem] lg:leading-[1.05]">
          <span className="sr-only">Plany, które klienci robią.</span>
          <span aria-hidden="true" className="inline">
            Plany, które klienci{" "}
            <span className="landing-rotator text-accent">
              {ROTATING.map((word) => (
                <span key={word} className="landing-rotator-word">
                  {word}
                </span>
              ))}
            </span>
            .
          </span>
        </h1>
        <p className="landing-reveal landing-reveal-delay-2 mx-auto mt-6 max-w-xl text-base leading-relaxed text-foreground-secondary sm:text-lg">
          Ułóż plan w kilka minut i wyślij klientowi link. On trenuje w telefonie, Ty widzisz każdy
          trening.
        </p>
        <div className="landing-reveal landing-reveal-delay-3 mt-9 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
          <Link href="/sign-up" className="sm:min-w-[200px]">
            <Button size="lg" full>
              Zacznij za darmo
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
