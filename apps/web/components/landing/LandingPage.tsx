import { LandingNav } from "./LandingNav";
import { Hero } from "./Hero";
import { PanelMock } from "./PanelMock";
import { PhoneMock } from "./PhoneMock";
import { ProgressCard } from "./ProgressCard";
import { PricingSection } from "./PricingSection";
import { Faq } from "./Faq";
import { FinalCta } from "./FinalCta";
import { LandingFooter } from "./LandingFooter";

export function LandingPage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <LandingNav />
      <main>
        <Hero />
        <PanelMock />
        <PhoneMock />
        <ProgressCard />
        <PricingSection />
        <Faq />
        <FinalCta />
      </main>
      <LandingFooter />
    </div>
  );
}
