import type { ReactNode } from "react";
import { LandingFooter } from "./LandingFooter";
import { LandingNav } from "./LandingNav";
import { LandingThemeLock } from "./LandingThemeLock";

export function MarketingShell({
  children,
  home = false,
  footer = true,
}: {
  children: ReactNode;
  home?: boolean;
  footer?: boolean;
}) {
  return (
    // Bez overflow-x-hidden: hidden na osi X robi z diva scroll container (overflow-y: auto)
    // i zabija KAŻDY position:sticky w środku (nav, scena telefonu). Oś X domyka body w globals.css.
    <div
      data-theme="light"
      className="landing-canvas min-h-screen bg-background text-foreground"
    >
      <LandingThemeLock />
      {home ? null : <LandingNav home={home} variant="page" />}
      {children}
      {footer ? <LandingFooter /> : null}
    </div>
  );
}
