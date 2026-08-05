import { LandingNav } from "./LandingNav";
import { Hero } from "./Hero";
import { Marquee } from "./Marquee";
import { ProductShots } from "./ProductShots";
import { Points } from "./Points";
import { FinalCta } from "./FinalCta";
import { LandingFooter } from "./LandingFooter";

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <LandingNav />
      <main>
        <Hero />
        <Marquee />
        <ProductShots />
        <Points />
        <FinalCta />
      </main>
      <LandingFooter />
    </div>
  );
}
