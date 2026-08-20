import { Faq } from "./Faq";
import { FinalCta } from "./FinalCta";
import { Hero } from "./Hero";
import { LandingFooter } from "./LandingFooter";
import { LandingJsonLd } from "./LandingJsonLd";
import { LossCalculatorSection } from "./LossCalculatorSection";
import { MarketingShell } from "./MarketingShell";
import { HowItWorks } from "./HowItWorks";
import { PricingSection } from "./PricingSection";

export function LandingPage() {
  return (
    <MarketingShell home footer={false}>
      <LandingJsonLd />
      <main>
        <Hero />
        <HowItWorks />
        <LossCalculatorSection />
        <PricingSection />
        <Faq />
        <FinalCta />
        <LandingFooter home />
      </main>
    </MarketingShell>
  );
}
