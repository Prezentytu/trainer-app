import type { Metadata } from "next";
import { MarketingShell } from "@/components/landing/MarketingShell";
import { IleTraciszCalculator } from "@/components/landing/IleTraciszCalculator";

export const metadata: Metadata = {
  title: "Ile tracisz, gdy klient odchodzi",
  description:
    "Osiem sesji razy Twoja stawka razy ile osób skończyło współpracę w tym roku. 39 zł za 15 osób.",
  alternates: { canonical: "/ile-tracisz" },
};

export default function IleTraciszPage() {
  return (
    <MarketingShell>
      <main className="mx-auto max-w-[720px] px-5 py-16 sm:px-8 sm:py-24">
        <p className="t-label m-0 tracking-[0.16em]">Kalkulator</p>
        <h1 className="mt-6 max-w-[16ch] text-[clamp(2.25rem,5vw,3.5rem)] font-semibold leading-[1.08] tracking-[-0.028em]">
          Ile tracisz, gdy klient odchodzi.
        </h1>
        <p className="mt-6 max-w-[46ch] text-[17px] leading-[1.6] text-muted">
          Osiem sesji w miesiącu. Twoja stawka. Ile osób skończyło współpracę w tym roku.
          Wynik to sesje, które nie weszły na konto.
        </p>
        <IleTraciszCalculator />
      </main>
    </MarketingShell>
  );
}
