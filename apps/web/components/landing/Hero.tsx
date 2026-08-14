import { LandingReveal } from "./LandingReveal";
import { LANDING_DISPLAY, LandingCta, SECTION_CTA } from "./primitives";
import { LogWall } from "./LogWall";

/**
 * Hero — jedna deklaracja na kadr, wyśrodkowana. Ściana zapisów na marginesach.
 * Dolna krawędź domknięta rzędem meta, żeby pustka pod CTA nie była przypadkowa.
 */
export function Hero() {
  return (
    <LandingReveal
      as="section"
      id="top"
      className="relative mx-auto flex min-h-[calc(100svh-72px)] max-w-[1200px] flex-col overflow-hidden px-5 sm:px-8"
    >
      <div className="relative flex flex-1 flex-col items-center justify-center py-16 text-center sm:py-20">
        <LogWall />
        <div className="relative z-10 w-full">
          <h1 className={`m-0 ${LANDING_DISPLAY} text-foreground`}>
            <span className="landing-stagger block" style={{ ["--i" as string]: 0 }}>
              Wysyłasz link.
            </span>
            <span
              className="landing-stagger mt-2 block text-muted"
              style={{ ["--i" as string]: 1 }}
            >
              Widzisz trening.
            </span>
          </h1>
          <p
            className="landing-stagger m-0 mx-auto mt-8 max-w-[40ch] text-[17px] font-normal leading-[1.6] text-muted text-pretty"
            style={{ ["--i" as string]: 2 }}
          >
            Klient otwiera go w&nbsp;przeglądarce — bez konta i&nbsp;bez aplikacji. Po
            treningu masz serie i&nbsp;rekordy. Piszesz pierwszy, zanim odejdzie.
          </p>
          <div
            className={`landing-stagger ${SECTION_CTA} flex flex-wrap items-center justify-center gap-x-6 gap-y-3`}
            style={{ ["--i" as string]: 3 }}
          >
            <LandingCta href="/wdrozenie">Umów 30 minut wdrożenia</LandingCta>
            <LandingCta href="/sign-up" variant="ghost">
              Załóż darmowe konto
            </LandingCta>
          </div>
        </div>
      </div>

      <div
        className="landing-stagger relative z-10 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 border-t border-border py-5"
        style={{ ["--i" as string]: 4 }}
      >
        <p className="t-label m-0 tracking-[0.16em] text-fg-ghost">
          Dla trenerów personalnych
        </p>
        <a
          href="#produkt"
          className="inline-flex min-h-11 items-center t-label tracking-[0.16em] text-muted transition-colors duration-[var(--dur-fast)] hover:text-foreground focus-visible:outline-none focus-visible:shadow-[var(--focus-ring)]"
        >
          Przewiń
        </a>
      </div>
    </LandingReveal>
  );
}
