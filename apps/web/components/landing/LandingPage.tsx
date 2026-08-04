import { LandingNav } from "./LandingNav";
import { Hero } from "./Hero";
import { PanelPreview } from "./PanelPreview";
import { HowItWorks } from "./HowItWorks";
import { Differentiators } from "./Differentiators";
import { Pricing } from "./Pricing";
import { Faq } from "./Faq";
import { CtaBand } from "./CtaBand";
import { LandingFooter } from "./LandingFooter";

export function LandingPage() {
  return (
    <div className="landing-atmosphere min-h-screen text-foreground">
      <LandingNav />
      <main>
        {/* Pierwszy viewport = jedna kompozycja: brand + copy + produkt */}
        <div className="relative">
          <Hero />
          <PanelPreview />
        </div>
        <HowItWorks />
        <Differentiators />
        <Pricing />
        <Faq />
        <CtaBand />
      </main>
      <LandingFooter />
    </div>
  );
}
