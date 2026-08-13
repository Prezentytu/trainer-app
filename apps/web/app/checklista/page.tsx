import type { Metadata } from "next";
import Link from "next/link";
import { MarketingShell } from "@/components/landing/MarketingShell";
import { PUBLIC_SILENCE_TEMPLATES } from "@/lib/silenceProtocol";

export const metadata: Metadata = {
  title: "Checklista: kto odejdzie w 14 dni",
  description:
    "Piętnaście osób, cztery pytania. Napisz dziś do tych, którzy mają dwa lub więcej tak.",
};

export default function ChecklistPage() {
  return (
    <MarketingShell>
      <main className="mx-auto max-w-[720px] px-5 py-16 sm:px-8 sm:py-24">
        <p className="t-label m-0 tracking-[0.16em]">Jedna strona</p>
        <h1 className="mt-6 text-[clamp(2.25rem,5vw,3.5rem)] font-semibold leading-[1.08] tracking-[-0.028em]">
          Kto z Twoich 15 klientów odejdzie w 14 dni
        </h1>
        <p className="mt-6 text-[17px] leading-[1.6] text-muted">
          Weź listę aktywnych podopiecznych. Przy każdym odhacz, co jest prawdą dziś.
          Osoba z dwoma lub więcej takami — napisz dziś. Nie jutro.
        </p>

        <div className="mt-12 overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="t-label py-3 pr-3 font-medium">#</th>
                <th className="t-label py-3 pr-3 font-medium">Imię</th>
                <th className="t-label py-3 pr-3 font-medium">&gt;7 dni</th>
                <th className="t-label py-3 pr-3 font-medium">&gt;14 dni</th>
                <th className="t-label py-3 pr-3 font-medium">Bez Ciebie nie wie, co robić</th>
                <th className="t-label py-3 font-medium">Nie widzi progresu</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 15 }, (_, i) => (
                <tr key={i} className="border-b border-border">
                  <td className="py-3 pr-3 font-mono tabular-nums text-muted">{i + 1}</td>
                  <td className="py-3 pr-3">
                    <span className="block h-4 w-28 border-b border-border-strong" />
                  </td>
                  <td className="py-3 pr-3">
                    <span className="inline-block size-4 border border-border-strong" />
                  </td>
                  <td className="py-3 pr-3">
                    <span className="inline-block size-4 border border-border-strong" />
                  </td>
                  <td className="py-3 pr-3">
                    <span className="inline-block size-4 border border-border-strong" />
                  </td>
                  <td className="py-3">
                    <span className="inline-block size-4 border border-border-strong" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h2 className="t-heading mt-16">Co napisać</h2>
        <div className="mt-6 space-y-6 text-[15px] leading-relaxed text-foreground-secondary">
          {PUBLIC_SILENCE_TEMPLATES.map((item) => (
            <p key={item.kind}>
              <span className="t-label block text-muted">{item.label}</span>
              {item.body}
            </p>
          ))}
        </div>
        <p className="mt-6 text-[15px] leading-relaxed text-muted">
          <Link href="/gotowce" className="text-foreground underline-offset-4 hover:underline">
            Skopiuj wiadomość
          </Link>
          {" · "}
          <Link href="/ile-tracisz" className="text-foreground underline-offset-4 hover:underline">
            Policz, ile tracisz
          </Link>
        </p>

        <p className="mt-12 text-[15px] leading-[1.6] text-muted">
          W panelu RepMaxer ta lista układa się sama. Na 30-minutowej rozmowie przenosisz plan
          do linku bez konta.{" "}
          <Link href="/wdrozenie" className="text-foreground underline-offset-4 hover:underline">
            Umów wdrożenie
          </Link>
          .
        </p>
      </main>
    </MarketingShell>
  );
}
