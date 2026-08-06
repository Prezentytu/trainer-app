import { LandingReveal } from "./LandingReveal";
import { LiveFeed } from "./LiveFeed";
import { LandingCta } from "./primitives";

export function Hero() {
  return (
    <section
      id="top"
      className="mx-auto flex min-h-[calc(100svh-72px)] max-w-[1200px] flex-col justify-center px-5 pb-24 pt-24 sm:px-8 sm:pb-24 sm:pt-32"
    >
      <LandingReveal>
        <h1 className="m-0 max-w-[18ch] text-[clamp(2.75rem,7.4vw,6rem)] font-semibold leading-[1.02] tracking-[-0.035em] text-foreground text-balance">
          <span className="landing-stagger block" style={{ ["--i" as string]: 0 }}>
            Wysyłasz link.
          </span>
          <span
            className="landing-stagger mt-1 block text-muted sm:mt-0"
            style={{ ["--i" as string]: 1 }}
          >
            Widzisz każdy trening.
          </span>
        </h1>

        <div className="mt-12 grid grid-cols-1 items-end gap-12 md:mt-16 md:grid-cols-2 md:gap-16">
          <div className="max-w-[42ch]">
            <p
              className="landing-stagger m-0 text-[17px] font-normal leading-[1.6] text-muted text-pretty"
              style={{ ["--i" as string]: 2 }}
            >
              Klient odhacza serie w telefonie. Bez aplikacji, bez konta.
            </p>
            <div
              className="landing-stagger mt-8 flex flex-wrap items-center gap-x-6 gap-y-3"
              style={{ ["--i" as string]: 3 }}
            >
              <LandingCta />
              <span className="t-label tracking-[0.16em] text-muted">0 zł · bez karty</span>
            </div>
          </div>

          <div className="landing-stagger" style={{ ["--i" as string]: 4 }}>
            <LiveFeed />
          </div>
        </div>
      </LandingReveal>
    </section>
  );
}
