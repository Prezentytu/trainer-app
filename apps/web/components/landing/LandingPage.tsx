import { Faq } from "./Faq";
import { FinalCta } from "./FinalCta";
import { Hero } from "./Hero";
import { LandingFooter } from "./LandingFooter";
import { LandingJsonLd } from "./LandingJsonLd";
import { LossCalculatorSection } from "./LossCalculatorSection";
import { MarketingShell } from "./MarketingShell";
import { HowItWorks } from "./HowItWorks";
import { PricingSection } from "./PricingSection";
import { TrainerPreview } from "./TrainerPreview";

export function LandingPage() {
  return (
    <MarketingShell home footer={false}>
      <LandingJsonLd />
      <main>
        <Hero />
        <TrainerPreview />
        <HowItWorks />
        <LossCalculatorSection />
        <PricingSection />
        <Faq />
        <div className="bg-background text-foreground">
          <FinalCta />
          <LandingFooter home />
        </div>
      </main>
    </MarketingShell>
  );
}
