import { Faq } from "./Faq";
import { FinalCta } from "./FinalCta";
import { Hero } from "./Hero";
import { LandingJsonLd } from "./LandingJsonLd";
import { LossCalculatorSection } from "./LossCalculatorSection";
import { MarketingShell } from "./MarketingShell";
import { PhoneMock } from "./PhoneMock";
import { PricingSection } from "./PricingSection";
import { TrainerPreview } from "./TrainerPreview";

export function LandingPage() {
  return (
    <MarketingShell home>
      <LandingJsonLd />
      <main>
        <Hero />
        <PhoneMock />
        <TrainerPreview />
        <LossCalculatorSection />
        <PricingSection />
        <Faq />
        <FinalCta />
      </main>
    </MarketingShell>
  );
}
