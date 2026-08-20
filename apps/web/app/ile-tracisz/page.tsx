import type { Metadata } from "next";
import { MarketingShell } from "@/components/landing/MarketingShell";
import { IleTraciszCalculator } from "@/components/landing/IleTraciszCalculator";
import { PAGE_SHELL, SECTION_H2, SECTION_LEAD } from "@/components/landing/primitives";

export const metadata: Metadata = {
  title: "Ile tracisz, gdy podopieczny odchodzi",
  description:
    "Osiem sesji razy Twoja stawka razy ile osób skończyło współpracę w tym roku. 39 zł za 15 osób.",
  alternates: { canonical: "/ile-tracisz" },
};

export default function IleTraciszPage() {
  return (
    <MarketingShell>
      <main className={PAGE_SHELL}>
        <p className="t-label m-0 tracking-[0.16em]">Kalkulator</p>
        <h1 className={`mt-6 ${SECTION_H2}`}>
          Ile tracisz, gdy podopieczny odchodzi.
        </h1>
        <p className={SECTION_LEAD}>
          Policz: osiem sesji w miesiącu razy Twoja stawka, razy osoby, które w
          tym roku skończyły współpracę. Raport pokazuje te sygnały, zanim
          dostaniesz wiadomość «kończę».
        </p>
        <IleTraciszCalculator className="mt-12" />
      </main>
    </MarketingShell>
  );
}
