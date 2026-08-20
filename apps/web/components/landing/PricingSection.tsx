import { LandingReveal } from "./LandingReveal";
import {
  LANDING_CAPS,
  LANDING_SECTION_H2,
  LandingCta,
  SectionHead,
  SECTION_SHELL,
  SECTION_STACK,
} from "./primitives";

const TIERS = [
  {
    amount: "39",
    unit: "zł / mies.",
    detail: "Tyle, co kwadrans jednej sesji.",
    cap: "Do 15 podopiecznych",
  },
  {
    amount: "99",
    unit: "zł / mies.",
    detail: "Jeden wieczór w tygodniu mniej przy arkuszu.",
    cap: "Do 30 podopiecznych",
  },
] as const;

/** 04 — koszt po 90 dniach. Darmowe konto schodzi do cichego odsyłacza. */
export function PricingSection() {
  return (
    <LandingReveal
      as="section"
      id="cennik"
      className={SECTION_SHELL}
    >
      <div className="landing-stagger">
        <SectionHead n="04" label="Cennik">
          <div className={SECTION_STACK}>
            <h2 className={LANDING_SECTION_H2}>
              Jeden podopieczny to 1 200 zł. To kosztuje 39.
            </h2>
            <ul className="m-0 list-none border-t border-border-strong p-0">
              {TIERS.map((tier) => (
                <li
                  key={tier.amount}
                  className="grid grid-cols-1 gap-3 border-b border-border py-6 last:border-b-0 md:grid-cols-[220px_minmax(0,1fr)_auto] md:items-baseline md:gap-10 md:py-8"
                >
                  <p className="m-0 flex items-baseline gap-2">
                    <span className="t-num text-[clamp(2rem,4vw,2.75rem)] leading-none text-foreground">
                      {tier.amount}
                    </span>
                    <span className="t-num text-[18px] font-medium text-muted">{tier.unit}</span>
                  </p>
                  <p className="m-0 max-w-[46ch] text-[17px] font-normal leading-[1.6] text-muted text-pretty">
                    {tier.detail}
                  </p>
                  <p className={`${LANDING_CAPS} m-0 text-foreground md:text-right`}>
                    {tier.cap}
                  </p>
                </li>
              ))}
            </ul>
            <div className="grid items-center gap-8 border-t border-border pt-8 md:grid-cols-[minmax(0,1fr)_auto] md:gap-10 md:pt-10">
              <p className="m-0 max-w-[44ch] text-[19px] font-normal leading-[1.6] text-foreground text-pretty">
                Pierwszy raport i 90 dni za 0 zł. Bez karty.
              </p>
              <div className="flex flex-col items-start gap-3.5 md:justify-self-end">
                <LandingCta href="/wdrozenie">Zamów darmowy raport</LandingCta>
                <LandingCta href="/sign-up" variant="ghost" className="text-[14px] text-muted">
                  Wolę bez rozmowy
                </LandingCta>
              </div>
            </div>
          </div>
        </SectionHead>
      </div>
    </LandingReveal>
  );
}
