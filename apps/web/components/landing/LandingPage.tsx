import { LandingNav } from "./LandingNav";
import { Hero } from "./Hero";
import { PanelPreview } from "./PanelPreview";
import { Differentiators } from "./Differentiators";
import { HowItWorks } from "./HowItWorks";
import { DataOwnership } from "./DataOwnership";
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
        <DataOwnership />
        <Faq />
        <CtaBand />
      </main>
      <LandingFooter />
    </div>
  );
}
