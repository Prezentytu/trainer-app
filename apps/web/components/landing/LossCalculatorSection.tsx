import { LandingReveal } from "./LandingReveal";
import { IleTraciszCalculator } from "./IleTraciszCalculator";
import { SectionHead, SectionIntro, SECTION_SHELL, SECTION_STACK } from "./primitives";

export function LossCalculatorSection() {
  return (
    <div data-theme="dark" className="bg-background text-foreground">
      <LandingReveal
        as="section"
        id="ile-tracisz"
        className={SECTION_SHELL}
      >
        <div className="landing-stagger">
          <SectionHead n="03" label="Ile tracisz">
            <div className={SECTION_STACK}>
              <SectionIntro
                title="Rezygnacja nie zaczyna się od wiadomości «kończę»."
                lead="Spadek ciężarów i ciszę widać dwa tygodnie wcześniej."
              />
              <div className="border-t border-border pt-8 lg:pt-12">
                <IleTraciszCalculator />
              </div>
            </div>
          </SectionHead>
        </div>
      </LandingReveal>
    </div>
  );
}
