import { LandingReveal } from "./LandingReveal";
import {
  LANDING_CAPS,
  LANDING_SECTION_H2,
  LandingCta,
  SectionHead,
  SECTION_SHELL,
} from "./primitives";

export function FinalCta() {
  return (
    <LandingReveal as="section" id="start" className={SECTION_SHELL}>
      <div className="landing-stagger w-full">
        <SectionHead n="06" label="Start">
          <div className="grid items-end gap-8 md:gap-10 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-12">
            <div>
              <h2 className={LANDING_SECTION_H2}>Pierwszy raport masz jutro.</h2>
              <p className="mt-4 m-0 max-w-[46ch] text-[17px] leading-[1.6] text-muted md:mt-6">
                Wyślij arkusz dziś — wynik wraca w 24 godziny.
              </p>
            </div>
            <div className="flex flex-col items-start gap-3.5 lg:justify-self-end">
              <LandingCta href="/wdrozenie">Zamów darmowy raport</LandingCta>
              <p className={`${LANDING_CAPS} m-0 text-muted`}>
                0 zł · bez karty · 5 miejsc
              </p>
            </div>
          </div>
        </SectionHead>
      </div>
    </LandingReveal>
  );
}
