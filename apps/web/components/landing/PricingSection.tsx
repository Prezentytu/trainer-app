import { LandingReveal } from "./LandingReveal";
import { LANDING_CAPS, LandingCta, SECTION_SHELL, SectionSplit } from "./primitives";

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

/** 03 — koszt po 90 dniach. */
export function PricingSection() {
  return (
    <LandingReveal as="section" id="cennik" className={SECTION_SHELL}>
      <div className="landing-stagger">
        <SectionSplit
          index="03"
          label="Cennik"
          title="Jeden podopieczny to 1 200 zł. To kosztuje 39."
        >
          <ul className="m-0 list-none p-0">
            {TIERS.map((tier) => (
              <li
                key={tier.amount}
                className="grid grid-cols-1 gap-3 border-b border-border py-6 md:grid-cols-[180px_minmax(0,1fr)_auto] md:items-baseline md:gap-10 md:py-7"
              >
                <p className="m-0 flex items-baseline gap-2">
                  <span className="t-num text-[clamp(2rem,4vw,2.75rem)] leading-none text-foreground">
                    {tier.amount}
                  </span>
                  <span className="t-num text-[16px] font-medium text-muted">{tier.unit}</span>
                </p>
                <p className="m-0 max-w-[46ch] text-[17px] font-normal leading-[1.6] text-muted text-pretty">
                  {tier.detail}
                </p>
                <p className={`${LANDING_CAPS} m-0 text-foreground md:text-right`}>{tier.cap}</p>
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-col items-start gap-6 md:mt-8 md:flex-row md:items-center md:justify-between md:gap-10">
            <p className="m-0 max-w-[26ch] text-[19px] font-normal leading-[1.5] text-foreground text-pretty">
              Pierwszy raport i 90 dni za 0 zł. Bez karty.
            </p>
            <div className="shrink-0">
              <LandingCta href="/wdrozenie">Zamów darmowy raport</LandingCta>
            </div>
          </div>
        </SectionSplit>
      </div>
    </LandingReveal>
  );
}
