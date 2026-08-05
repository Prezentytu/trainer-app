import Link from "next/link";
import { Button } from "@/components/ui";
import { HeroField } from "./HeroField";

export function Hero() {
  return (
    <section className="relative flex min-h-[88svh] scroll-mt-20 items-center justify-center overflow-hidden px-5 sm:px-6">
      <HeroField />

      <div className="relative z-[1] mx-auto w-full max-w-4xl pb-16 text-center sm:pb-20">
        <p className="landing-eyebrow-in font-mono text-[11px] uppercase tracking-[var(--tracking-eyebrow)] text-muted">
          Dla trenerów personalnych
        </p>

        <h1 className="mt-7 display-landing-xl text-[clamp(1.75rem,5.2vw,4.5rem)] text-foreground text-pretty sm:mt-10">
          <span className="landing-mask">
            <span className="landing-mask-inner" style={{ ["--i" as string]: 0 }}>
              Wysyłasz link.
            </span>
          </span>
          <span className="landing-mask mt-1 sm:mt-2">
            <span className="landing-mask-inner" style={{ ["--i" as string]: 1 }}>
              Widzisz każdy trening.
            </span>
          </span>
        </h1>

        <p className="landing-reveal landing-reveal-delay-3 mx-auto mt-6 max-w-[34ch] text-[16px] leading-relaxed text-muted text-pretty sm:mt-7 sm:text-[17px]">
          Klient odhacza serie w telefonie. Bez aplikacji, bez konta.
        </p>

        <div className="landing-reveal landing-reveal-delay-4 mt-8 flex flex-wrap items-center justify-center gap-x-7 gap-y-4 sm:mt-10">
          <Link href="/sign-up">
            <Button size="lg" className="landing-cta-pill">
              Załóż darmowe konto
            </Button>
          </Link>
          <a
            href="#produkt"
            className="landing-link-underline font-mono text-[11px] uppercase tracking-[var(--tracking-eyebrow)] text-muted transition-colors hover:text-foreground focus-visible:outline-none focus-visible:shadow-[var(--glow-accent)]"
          >
            Zobacz produkt ↓
          </a>
        </div>

        <p className="landing-reveal landing-reveal-delay-5 mt-5 text-sm text-muted-faint sm:mt-6">
          0 zł · bez karty
        </p>
      </div>
    </section>
  );
}
