import { LandingReveal } from "./LandingReveal";
import { LandingCta, SectionHead, SECTION_CTA, SECTION_SHELL } from "./primitives";

export function PricingSection() {
  return (
    <LandingReveal as="section" id="cennik" className={SECTION_SHELL}>
      <div className="landing-stagger">
        <SectionHead n="03" label="Cennik">
          <div className="grid grid-cols-1 items-start gap-14 lg:grid-cols-2 lg:gap-24">
            <div>
              <p className="m-0 flex flex-wrap items-baseline gap-x-2 gap-y-0">
                <span className="t-num text-[clamp(4rem,11vw,8.5rem)] leading-none tracking-[-0.03em] text-foreground">
                  0
                </span>
                <span className="t-num text-[clamp(1.5rem,3.2vw,2.5rem)] leading-none text-fg-faint">
                  zł
                </span>
              </p>
              <p className="t-label mt-8 tracking-[0.16em]">Do 5 osób · na zawsze</p>
            </div>
            <div className="max-w-[46ch]">
              <p className="m-0 text-[17px] font-normal leading-[1.6] text-muted text-pretty">
                <span className="t-num text-[17px] text-foreground">39 zł</span>
                {" / 15 osób. "}
                <span className="t-num text-[17px] text-foreground">99 zł</span>
                {" / 30 osób. Podopieczny zawsze 0 zł, bez konta. Dane zawsze do eksportu."}
              </p>
              <p className="mt-4 text-[15px] font-normal leading-[1.6] text-muted text-pretty">
                Na start możesz umówić rozmowę: 90 dni za 0 zł, do 15 osób. 10 miejsc
                w&nbsp;miesiącu.
              </p>
              <div className={`${SECTION_CTA} flex flex-wrap items-center gap-x-6 gap-y-3`}>
                <LandingCta href="/wdrozenie">Umów 30 minut wdrożenia</LandingCta>
                <LandingCta href="/sign-up" variant="ghost">
                  Załóż darmowe konto
                </LandingCta>
              </div>
            </div>
          </div>
        </SectionHead>
      </div>
    </LandingReveal>
  );
}
