import type { ReactNode } from "react";
import { LandingFooter } from "./LandingFooter";
import { LandingNav } from "./LandingNav";
import { LandingThemeLock } from "./LandingThemeLock";

export function MarketingShell({
  children,
  home = false,
  action = "wdrozenie",
}: {
  children: ReactNode;
  home?: boolean;
  action?: "wdrozenie" | "konto";
}) {
  return (
    // Bez overflow-x-hidden: hidden na osi X robi z diva scroll container (overflow-y: auto)
    // i zabija KAŻDY position:sticky w środku (nav, scena telefonu). Oś X domyka body w globals.css.
    <div
      data-theme="light"
      className="min-h-screen bg-background text-foreground"
    >
      <LandingThemeLock />
      <LandingNav home={home} action={action} />
      {children}
      <LandingFooter />
    </div>
  );
}
