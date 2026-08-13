import type { Metadata } from "next";
import { Wordmark } from "@/components/Wordmark";
import { LandingThemeLock } from "@/components/landing/LandingThemeLock";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { LandingCta } from "@/components/landing/primitives";
import { GotowceList } from "@/components/landing/GotowceList";

export const metadata: Metadata = {
  title: "Trzy wiadomości, gdy klient nie trenował",
  description:
    "Wklejasz do WhatsAppa dziś. Bez konta. Siedem dni, czternaście dni, pierwszy trening.",
};

export default function GotowcePage() {
  return (
    <div data-theme="light" className="min-h-screen bg-background text-foreground">
      <LandingThemeLock />
      <header className="border-b border-border">
        <div className="mx-auto flex h-[72px] max-w-[1200px] items-center justify-between px-5 sm:px-8">
          <Wordmark href="/" />
          <LandingCta href="/wdrozenie" size="sm">
            Umów wdrożenie
          </LandingCta>
        </div>
      </header>
      <main className="mx-auto max-w-[720px] px-5 py-16 sm:px-8 sm:py-24">
        <p className="t-label m-0 tracking-[0.16em]">WhatsApp</p>
        <h1 className="mt-6 max-w-[16ch] text-[clamp(1.875rem,4vw,3rem)] font-semibold leading-[1.08] tracking-[-0.028em]">
          Trzy wiadomości, gdy klient nie trenował.
        </h1>
        <p className="mt-6 max-w-[46ch] text-[17px] leading-[1.6] text-muted">
          Wklejasz dziś. Zamieniasz {"{imię}"}. Bez konta i bez nowej apki.
        </p>
        <GotowceList />
      </main>
      <LandingFooter />
    </div>
  );
}
