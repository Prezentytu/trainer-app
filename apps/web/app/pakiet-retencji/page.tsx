import type { Metadata } from "next";
import Link from "next/link";
import { MarketingShell } from "@/components/landing/MarketingShell";
import { PAGE_SHELL, SECTION_H2, SECTION_LEAD } from "@/components/landing/primitives";
import { RETENTION_PACK, RETENTION_PACK_ZL } from "@/lib/wdrozenieOffer";

export const metadata: Metadata = {
  title: "Wiadomości i checklista",
  description:
    "Gotowce WhatsApp, checklista 14 dni i szablony metod — w pierwszym raporcie.",
  alternates: { canonical: "/pakiet-retencji" },
};

export default function PakietRetencjiPage() {
  return (
    <MarketingShell>
      <main className={PAGE_SHELL}>
        <p className="t-label m-0 tracking-[0.16em]">W pierwszym raporcie</p>
        <h1 className={`mt-6 ${SECTION_H2}`}>
          Wiadomości i checklista.
        </h1>
        <p className={SECTION_LEAD}>
          Trzy rzeczy, które już są. Wycena {RETENTION_PACK_ZL} zł — wchodzą w pierwszy
          raport, nie jako dopłata.
        </p>

        <ul className="mt-12 m-0 list-none border-t border-border p-0">
          {RETENTION_PACK.map((row) => (
            <li
              key={row.title}
              className="grid grid-cols-1 gap-2 border-b border-border py-6 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-baseline sm:gap-8"
            >
              <div>
                {row.href ? (
                  <Link
                    href={row.href}
                    className="text-[20px] font-medium leading-snug underline-offset-4 hover:underline"
                  >
                    {row.title}
                  </Link>
                ) : (
                  <p className="m-0 text-[20px] font-medium leading-snug">{row.title}</p>
                )}
                <p className="mt-2 max-w-[46ch] text-[15px] leading-[1.6] text-muted">{row.body}</p>
              </div>
              <p className="t-num m-0 text-[15px] text-muted sm:text-right">{row.valueZl} zł</p>
            </li>
          ))}
        </ul>

        <p className="mt-12 max-w-[46ch] text-[15px] leading-[1.6] text-muted">
          Szablony metod są w kreatorze planu po koncie. Checklista i gotowce otwierasz bez
          logowania.
        </p>
        <p className="mt-8">
          <Link href="/wdrozenie" className="text-foreground underline-offset-4 hover:underline">
            Zamów darmowy raport
          </Link>
        </p>
      </main>
    </MarketingShell>
  );
}
