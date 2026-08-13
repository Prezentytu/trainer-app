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
    <div
      data-theme="light"
      className="min-h-screen overflow-x-hidden bg-background text-foreground"
    >
      <LandingThemeLock />
      <LandingNav home={home} action={action} />
      {children}
      <LandingFooter />
    </div>
  );
}
