import { LandingNav } from "./LandingNav";
import { Hero } from "./Hero";
import { PanelPreview } from "./PanelPreview";
import { Marquee } from "./Marquee";
import { HowItWorks } from "./HowItWorks";
import { Differentiators } from "./Differentiators";
import { EarlyAccess } from "./EarlyAccess";
import { Pricing } from "./Pricing";
import { Faq } from "./Faq";
import { CtaBand } from "./CtaBand";
import { LandingFooter } from "./LandingFooter";

export function LandingPage() {
  return (
    <div className="landing-atmosphere landing-grain min-h-screen text-foreground">
      <div className="relative z-[2]">
        <LandingNav />
        <main>
          <div className="relative">
            <Hero />
            <PanelPreview />
          </div>
          <Marquee />
          <HowItWorks />
          <Differentiators />
          <EarlyAccess />
          <Pricing />
          <Faq />
          <CtaBand />
        </main>
        <LandingFooter />
      </div>
    </div>
  );
}
