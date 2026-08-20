import { DualSurfaces } from "./DualSurfaces";
import { LandingNav } from "./LandingNav";
import {
  LANDING_CAPS,
  LANDING_H1,
  LANDING_H1_SUB,
  LANDING_HERO_GRID,
  LANDING_MEASURE,
  LandingCta,
} from "./primitives";

/** Hero — jeden pełny kadr: copy z lewej, scena produktu z prawej. */
export function Hero() {
  return (
    <section
      id="top"
      className="flex flex-col bg-background text-foreground lg:min-h-svh"
    >
      <div className={`flex w-full flex-1 flex-col ${LANDING_MEASURE}`}>
        <LandingNav home variant="hero" />

        <div className={LANDING_HERO_GRID}>
          <div className="min-w-0">
            <p className={`landing-hero-line m-0 mb-6 ${LANDING_CAPS} text-muted`}>
              Dla trenerów personalnych
            </p>
            <h1
              aria-label="Wszyscy podopieczni w jednym raporcie. Za 0 zł, w 24 godziny."
              className="m-0 min-w-0 text-foreground"
            >
              <span className={`landing-hero-line block ${LANDING_H1}`}>
                Wszyscy podopieczni
              </span>
              <span className={`landing-hero-line block ${LANDING_H1}`}>
                w jednym raporcie.
              </span>
            </h1>
            <p
              className={`landing-hero-line landing-hero-line-delay mt-7 ${LANDING_H1_SUB}`}
            >
              Za 0 zł, w 24 godziny.
            </p>
            <div className="mt-9">
              <LandingCta href="/wdrozenie">Zamów darmowy raport</LandingCta>
            </div>
          </div>

          <DualSurfaces />
        </div>
      </div>
    </section>
  );
}
