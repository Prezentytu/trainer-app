import { LandingReveal } from "./LandingReveal";
import { LandingCta } from "./primitives";
import { LiveFeed } from "./LiveFeed";

/**
 * Hero — deklaracja (wyśrodkowany blok, tekst do lewej) + żywy feed.
 * Stagger tylko na H1. Feed bez maski — pełne wiersze.
 */
export function Hero() {
  return (
    <LandingReveal
      as="section"
      id="top"
      className="mx-auto flex max-w-[1200px] flex-col px-5 sm:px-8 lg:min-h-[calc(100svh-72px)]"
    >
      <div className="flex flex-1 flex-col justify-center pb-12 pt-16 sm:pt-20 lg:pb-10">
        <div className="w-full sm:mx-auto sm:w-fit">
          <h1 className="m-0 text-[clamp(2.75rem,8vw,7rem)] font-semibold leading-[0.96] tracking-[-0.04em] text-foreground">
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
          <p className="m-0 mt-8 max-w-[42ch] text-[17px] font-normal leading-[1.6] text-muted text-pretty">
            Klient otwiera go w przeglądarce — bez konta i bez aplikacji. Po
            treningu masz serie i rekordy. Piszesz pierwszy, zanim odejdzie.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3">
            <LandingCta href="/wdrozenie">Umów 30 minut wdrożenia</LandingCta>
            <LandingCta href="/sign-up" variant="ghost">
              Załóż darmowe konto
            </LandingCta>
          </div>
        </div>
      </div>

      <div className="landing-stagger pb-8 lg:pb-16" style={{ ["--i" as string]: 2 }}>
        <LiveFeed />
      </div>
    </LandingReveal>
  );
}
