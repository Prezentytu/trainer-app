import type { Metadata } from "next";
import { MarketingShell } from "@/components/landing/MarketingShell";
import { GotowceList } from "@/components/landing/GotowceList";
import { PAGE_SHELL, SECTION_H2, SECTION_LEAD } from "@/components/landing/primitives";

export const metadata: Metadata = {
  title: "Trzy wiadomości, gdy trening nie wraca",
  description:
    "Wklejasz do WhatsAppa dziś. Bez konta. Siedem dni, czternaście dni, pierwszy trening.",
  alternates: { canonical: "/gotowce" },
};

export default function GotowcePage() {
  return (
    <MarketingShell>
      <main className={PAGE_SHELL}>
        <p className="t-label m-0 tracking-[0.16em]">WhatsApp</p>
        <h1 className={`mt-6 ${SECTION_H2}`}>
          Trzy wiadomości, gdy trening nie wraca.
        </h1>
        <p className={SECTION_LEAD}>
          Wklejasz dziś. Zamieniasz {"{imię}"}. Bez konta i bez nowej apki.
        </p>
        <GotowceList />
      </main>
    </MarketingShell>
  );
}
