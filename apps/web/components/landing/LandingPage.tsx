import { LandingNav } from "./LandingNav";
import { Hero } from "./Hero";
import { Marquee } from "./Marquee";
import { ScenarioScroll } from "./ScenarioScroll";
import { ProductShots } from "./ProductShots";
import { Points } from "./Points";
import { Faq } from "./Faq";
import { FinalCta } from "./FinalCta";
import { LandingFooter } from "./LandingFooter";

export function LandingPage() {
  return (
    <div className="theme-acid min-h-screen bg-background text-foreground">
      <LandingNav />
      <main>
        <Hero />
        <Marquee />
        <ScenarioScroll />
        <ProductShots />
        <Points />
        <Faq />
        <FinalCta />
      </main>
      <LandingFooter />
      <div className="landing-grain" aria-hidden />
    </div>
  );
}
