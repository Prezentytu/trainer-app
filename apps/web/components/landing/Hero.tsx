import { LandingReveal } from "./LandingReveal";
import { LiveFeed } from "./LiveFeed";
import { LandingCta } from "./primitives";

/**
 * Hero — moment deklaracji: blok tekstu wyśrodkowany na stronie, ale tekst
 * w środku wyrównany do lewej (H1, subcopy i CTA dzielą jedną krawędź).
 * Feed jest pełnoszerokościowym „horyzontem danych" wygaszanym maską w czerń.
 */
export function Hero() {
  return (
    <LandingReveal
      as="section"
      id="top"
      className="mx-auto flex min-h-[calc(100svh-72px)] max-w-[1200px] flex-col px-5 sm:px-8"
    >
      <div className="flex flex-1 flex-col justify-center pb-14 pt-20 sm:pt-24">
        <div className="w-full sm:mx-auto sm:w-fit">
          <h1 className="m-0 max-w-[18ch] text-[clamp(2.75rem,7.4vw,6rem)] font-semibold leading-[1.02] tracking-[-0.035em] text-foreground text-balance">
            <span className="landing-stagger block" style={{ ["--i" as string]: 0 }}>
              Wiesz, kto nie trenował.
            </span>
            <span
              className="landing-stagger mt-1 block text-muted"
              style={{ ["--i" as string]: 1 }}
            >
              Zanim zrezygnuje.
            </span>
          </h1>
          <p
            className="landing-stagger m-0 mt-8 max-w-[42ch] text-[17px] font-normal leading-[1.6] text-muted text-pretty"
            style={{ ["--i" as string]: 2 }}
          >
            Klient otwiera link w przeglądarce — bez konta. Po treningu
            widzisz serie i rekordy. Od razu wiesz, kto nie trenował.
          </p>
          <div
            className="landing-stagger mt-10 flex flex-wrap items-center gap-x-6 gap-y-3"
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
        className="landing-stagger pb-2 [mask-image:linear-gradient(to_bottom,black_40%,transparent_100%)]"
        style={{ ["--i" as string]: 4 }}
      >
        <LiveFeed />
      </div>
    </LandingReveal>
  );
}
