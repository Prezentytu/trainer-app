import { LandingReveal } from "./LandingReveal";
import { IleTraciszCalculator } from "./IleTraciszCalculator";
import { SECTION_SHELL, SectionSplit } from "./primitives";

/** 02 — jedyny ciemny pas na landingu. */
export function LossCalculatorSection() {
  return (
    <div data-theme="dark" className="bg-background text-foreground">
      <LandingReveal as="section" id="ile-tracisz" className={SECTION_SHELL}>
        <div className="landing-stagger">
          <SectionSplit
            index="02"
            label="Ile tracisz"
            title="Rezygnacja nie zaczyna się od wiadomości «kończę»."
            lead="Spadek ciężarów i ciszę widać dwa tygodnie wcześniej."
          >
            <IleTraciszCalculator />
          </SectionSplit>
        </div>
      </LandingReveal>
    </div>
  );
}
