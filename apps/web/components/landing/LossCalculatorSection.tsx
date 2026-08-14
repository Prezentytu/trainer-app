import { LandingReveal } from "./LandingReveal";
import { IleTraciszCalculator } from "./IleTraciszCalculator";
import { SectionHead, SECTION_H2, SECTION_LEAD, SECTION_SHELL } from "./primitives";

export function LossCalculatorSection() {
  return (
    <LandingReveal as="section" id="ile-tracisz" className={SECTION_SHELL}>
      <div className="landing-stagger">
        <SectionHead n="03" label="Ile tracisz">
          <div className="grid grid-cols-1 items-start gap-14 lg:grid-cols-2 lg:gap-24">
            <div>
              <h2 className={SECTION_H2}>Ile tracisz, gdy klient odchodzi.</h2>
              <p className={SECTION_LEAD}>
                Osiem sesji w&nbsp;miesiącu. Twoja stawka. Ile osób skończyło współpracę
                w&nbsp;tym roku. Wynik to sesje, które nie weszły na konto.
              </p>
            </div>
            <IleTraciszCalculator className="md:pt-0" />
          </div>
        </SectionHead>
      </div>
    </LandingReveal>
  );
}
