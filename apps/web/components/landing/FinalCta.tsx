import { LandingReveal } from "./LandingReveal";
import {
  LANDING_DISPLAY,
  LandingCta,
  SectionHead,
  SECTION_CLOSE,
  SECTION_CTA,
  SECTION_GUTTER,
  SECTION_SHELL,
} from "./primitives";

export function FinalCta() {
  return (
    <LandingReveal as="section" className={`${SECTION_SHELL} ${SECTION_CLOSE}`}>
      <div className="landing-stagger w-full">
        <SectionHead n="06" label="Start">
          <h2
            className={`m-0 max-w-[18ch] ${LANDING_DISPLAY} text-balance lg:text-[clamp(2.75rem,9.2vw,7rem)]`}
          >
            Zacznij z&nbsp;pierwszym klientem.
          </h2>
        </SectionHead>
        <div className={`${SECTION_CTA} flex flex-wrap items-center gap-x-6 gap-y-3 ${SECTION_GUTTER}`}>
          <LandingCta href="/wdrozenie">Umów 30 minut wdrożenia</LandingCta>
          <LandingCta href="/sign-up" variant="ghost">
            Załóż darmowe konto
          </LandingCta>
        </div>
        <p className={`t-label mt-4 tracking-[0.16em] text-muted ${SECTION_GUTTER}`}>
          10 miejsc · 0 zł / 90 dni
        </p>
      </div>
    </LandingReveal>
  );
}
