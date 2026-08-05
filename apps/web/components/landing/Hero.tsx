import Link from "next/link";
import { Button } from "@/components/ui";
import { HeroField } from "./HeroField";

export function Hero() {
  return (
    <section className="relative flex min-h-[92svh] scroll-mt-20 items-center justify-center overflow-hidden px-5 sm:px-6">
      <HeroField />

      <div className="relative z-[1] mx-auto w-full max-w-4xl pb-16 text-center sm:pb-20">
        <p className="landing-eyebrow-in font-mono text-xs uppercase tracking-caps text-muted">
          Dla trenerów personalnych
        </p>

        <h1 className="mt-8 display-serif text-[clamp(2.75rem,8vw,7rem)] text-foreground text-pretty">
          <span className="landing-mask">
            <span className="landing-mask-inner" style={{ ["--i" as string]: 0 }}>
              Wysyłasz klientowi jeden link.
            </span>
          </span>
          <span className="landing-mask mt-1 sm:mt-2">
            <span className="landing-mask-inner" style={{ ["--i" as string]: 1 }}>
              Widzisz <em className="display-serif-italic">każdy</em> jego trening.
            </span>
          </span>
        </h1>

        <p className="landing-reveal landing-reveal-delay-3 mx-auto mt-8 max-w-md text-[17px] leading-relaxed text-muted text-pretty">
          Klient nie instaluje niczego. Otwiera link na telefonie, odhacza serie — ty widzisz
          wynik od razu.
        </p>

        <div className="landing-reveal landing-reveal-delay-4 mt-10 flex flex-wrap items-center justify-center gap-x-7 gap-y-4">
          <Link href="/sign-up">
            <Button size="lg" className="landing-cta-pill">
              Załóż darmowe konto
            </Button>
          </Link>
          <a
            href="#produkt"
            className="landing-link-underline font-mono text-xs uppercase tracking-caps text-muted transition-colors hover:text-foreground focus-visible:outline-none focus-visible:shadow-[var(--glow-accent)]"
          >
            Zobacz, jak to wygląda ↓
          </a>
        </div>

        <p className="landing-reveal landing-reveal-delay-5 mt-8 text-sm text-muted-faint">
          0 zł we wczesnym dostępie · bez karty
        </p>
      </div>
    </section>
  );
}
