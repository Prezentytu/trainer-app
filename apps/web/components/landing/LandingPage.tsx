import { LandingNav } from "./LandingNav";
import { Hero } from "./Hero";
import { PanelPreview } from "./PanelPreview";
import { Differentiators } from "./Differentiators";
import { HowItWorks } from "./HowItWorks";
import { Pricing } from "./Pricing";
import { Faq } from "./Faq";
import { CtaBand } from "./CtaBand";
import { LandingFooter } from "./LandingFooter";

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <LandingNav />
      <main>
        <Hero />
        <PanelPreview />
        <Differentiators />
        <HowItWorks />
        <Pricing />
        <Faq />
        <CtaBand />
      </main>
      <LandingFooter />
    </div>
  );
}
