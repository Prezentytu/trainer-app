import Link from "next/link";
import { Button } from "@/components/ui";

export function Hero() {
  return (
    <section className="relative scroll-mt-20 px-5 pt-20 sm:px-6 sm:pt-28">
      <div className="relative z-[1] mx-auto max-w-6xl">
        <p className="landing-reveal font-mono text-xs uppercase tracking-caps text-muted">
          Dla trenerów personalnych
        </p>

        <h1 className="landing-reveal landing-reveal-delay-1 mt-6 max-w-5xl display-editorial text-[clamp(3.25rem,9vw,8rem)] text-foreground text-pretty">
          Układasz plan.
          <br />
          Widzisz{" "}
          <span className="accent-serif font-normal">każdą</span> serię.
        </h1>

        <div className="landing-reveal landing-reveal-delay-2 mt-10 flex max-w-5xl flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
          <p className="max-w-md text-[17px] leading-relaxed text-muted text-pretty">
            Wysyłasz klientowi jeden link. On zapisuje serie w telefonie, Ty widzisz każdy trening.
          </p>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <Link href="/sign-up">
              <Button size="lg">Zacznij za darmo</Button>
            </Link>
            <a
              href="#produkt"
              className="text-sm text-muted transition-colors hover:text-foreground focus-visible:outline-none focus-visible:shadow-[var(--glow-accent)]"
            >
              Zobacz produkt ↓
            </a>
          </div>
        </div>

        <p className="landing-reveal landing-reveal-delay-3 mt-14 border-t border-border pt-5 text-sm text-muted-faint">
          Wczesny dostęp za darmo · Bez karty · Klient bez aplikacji
        </p>
      </div>
    </section>
  );
}
