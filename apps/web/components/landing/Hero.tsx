import { HeroStage } from "./HeroStage";
import { LandingNav } from "./LandingNav";
import { LANDING_CAPS, LANDING_H1, LANDING_MEASURE, LandingCta } from "./primitives";

/** Hero — wyśrodkowane copy, pod nim para produktu jako dowód. */
export function Hero() {
  return (
    <section id="top" className="bg-background text-foreground">
      <div className={LANDING_MEASURE}>
        <LandingNav home variant="hero" />

        <div className="flex flex-col items-center pb-4 pt-10 sm:pt-16">
          <h1 className={`landing-hero-line text-center ${LANDING_H1}`}>
            Wszyscy podopieczni w jednym raporcie.
          </h1>

          <div className="landing-hero-line landing-hero-line-delay mt-8 sm:mt-9">
            <LandingCta href="/wdrozenie">Zamów darmowy raport</LandingCta>
          </div>

          <p
            className={`landing-hero-line landing-hero-line-delay m-0 mt-5 ${LANDING_CAPS} text-fg-ghost`}
          >
            0 zł · bez karty · 24 godziny
          </p>

          <HeroStage className="mt-14 sm:mt-16 lg:mt-[72px]" />
        </div>
      </div>
    </section>
  );
}
