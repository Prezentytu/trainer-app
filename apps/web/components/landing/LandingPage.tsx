import { Faq } from "./Faq";
import { FinalCta } from "./FinalCta";
import { Hero } from "./Hero";
import { LossCalculatorSection } from "./LossCalculatorSection";
import { MarketingShell } from "./MarketingShell";
import { PhoneMock } from "./PhoneMock";
import { PricingSection } from "./PricingSection";

export function LandingPage() {
  return (
    <MarketingShell home>
      <main>
        <Hero />
        <PhoneMock />
        <PricingSection />
        <LossCalculatorSection />
        <Faq />
        <FinalCta />
      </main>
    </MarketingShell>
  );
}
