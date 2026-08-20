import { LandingReveal } from "./LandingReveal";
import { LANDING_CAPS, LandingCta, SECTION_SHELL } from "./primitives";

/** Closer — bez indeksu sekcji, jedna kreska i jedno CTA. */
export function FinalCta() {
  return (
    <LandingReveal as="section" id="start" className={SECTION_SHELL}>
      <div className="landing-stagger">
        <div className="flex flex-col gap-10 border-t border-border pt-10 md:flex-row md:items-end md:justify-between md:gap-16">
          <div className="min-w-0">
            <h2 className="m-0 max-w-[20ch] text-[clamp(2rem,4.4vw,3.5rem)] font-semibold leading-[1] tracking-[-0.035em] text-foreground text-balance">
              Pierwszy raport masz jutro.
            </h2>
            <p className="m-0 mt-5 max-w-[46ch] text-[17px] leading-[1.6] text-muted text-pretty">
              Wyślij arkusz dziś — wynik wraca w 24 godziny.
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-start gap-3.5">
            <LandingCta href="/wdrozenie">Zamów darmowy raport</LandingCta>
            <p className={`${LANDING_CAPS} m-0 text-fg-ghost`}>0 zł · bez karty · 5 miejsc</p>
          </div>
        </div>
      </div>
    </LandingReveal>
  );
}
