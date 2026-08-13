import type { Metadata } from "next";
import { MarketingShell } from "@/components/landing/MarketingShell";
import { GotowceList } from "@/components/landing/GotowceList";

export const metadata: Metadata = {
  title: "Trzy wiadomości, gdy klient nie trenował",
  description:
    "Wklejasz do WhatsAppa dziś. Bez konta. Siedem dni, czternaście dni, pierwszy trening.",
};

export default function GotowcePage() {
  return (
    <MarketingShell>
      <main className="mx-auto max-w-[720px] px-5 py-16 sm:px-8 sm:py-24">
        <p className="t-label m-0 tracking-[0.16em]">WhatsApp</p>
        <h1 className="mt-6 max-w-[16ch] text-[clamp(2.25rem,5vw,3.5rem)] font-semibold leading-[1.08] tracking-[-0.028em]">
          Trzy wiadomości, gdy klient nie trenował.
        </h1>
        <p className="mt-6 max-w-[46ch] text-[17px] leading-[1.6] text-muted">
          Wklejasz dziś. Zamieniasz {"{imię}"}. Bez konta i bez nowej apki.
        </p>
        <GotowceList />
      </main>
    </MarketingShell>
  );
}
