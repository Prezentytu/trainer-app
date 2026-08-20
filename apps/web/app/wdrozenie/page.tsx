import { Suspense } from "react";
import Link from "next/link";
import { MarketingShell } from "@/components/landing/MarketingShell";
import { PAGE_SHELL, SECTION_H2, SECTION_LEAD } from "@/components/landing/primitives";
import { ReviewProof } from "@/components/landing/ReviewProof";
import {
  WDROZENIE_NEXT_PRICE_ZL,
  WDROZENIE_PREMIUM_ZL,
  WDROZENIE_SPOTS,
  WDROZENIE_STACK,
  WDROZENIE_STACK_SUM_ZL,
  WDROZENIE_STEPS,
} from "@/lib/wdrozenieOffer";
import { WdrozenieForm } from "./WdrozenieForm";

const FAQ = [
  {
    q: "Co przysłać?",
    a: "Arkusz, PDF albo zrzuty z WhatsAppa — odpisujesz na maila po zgłoszeniu. Imion wystarczy tyle, ile prowadzisz.",
  },
  {
    q: "Co jest w pierwszym raporcie?",
    a: "Kto zrobił zaplanowane treningi, komu spadły ciężary, kto nie odezwał się od dwóch tygodni, i trzy wiadomości do wysłania. Jeśli raport nic nie powie — piszesz jedno zdanie i kończymy.",
  },
  {
    q: "Wysyłam Ci dane podopiecznych. Co się z nimi dzieje?",
    a: "Arkusz widzi jedna osoba. Służy tylko do złożenia raportu. Na Twoją prośbę kasuję wszystko — nic nie trafia do bazy, dopóki sam nie zdecydujesz.",
  },
  {
    q: "Ile ostatecznie zapłacę?",
    a: `Dziś pierwszy raport za 0 zł. Jeśli chcesz go co tydzień, przenoszę plany — pierwszej piątce również za 0 zł, kolejnym osobom za ${WDROZENIE_NEXT_PRICE_ZL} zł. Przez 90 dni nie płacisz nic. Potem 39 zł miesięcznie do 15 podopiecznych albo 99 zł do 30.`,
  },
  {
    q: "Czym to nie jest?",
    a: "To nie jest dieta, grafik sesji ani program do pobrania. Chodzi o raport tygodnia i plan pod Twoim imieniem na telefonie podopiecznego.",
  },
] as const;

export default function WdrozeniePage() {
  return (
    <MarketingShell>
      <main className={PAGE_SHELL}>
        <p className="t-label m-0 tracking-[0.16em]">
          24 godziny · 0 zł · {WDROZENIE_SPOTS} miejsc
        </p>
        <h1 className={`mt-6 ${SECTION_H2}`}>
          Pierwszy raport z Twoich podopiecznych — za 0 zł, w 24 godziny.
        </h1>
        <p className={SECTION_LEAD}>
          Przysyłasz to, czym dziś prowadzisz: arkusz, PDF albo zrzuty z
          WhatsAppa. Wraca raport i trzy wiadomości gotowe do wysłania. Bez
          rozmowy, bez karty, bez zakładania czegokolwiek.
        </p>

        <p className="mt-10 max-w-[46ch] text-[15px] leading-[1.6] text-foreground-secondary">
          Dla trenera personalnego, który układa plany i wysyła je na telefon —
          zwykle 8–25 osób, dziś arkusz i WhatsApp.{" "}
          <Link href="/ile-tracisz" className="text-foreground underline-offset-4 hover:underline">
            Policz, ile tracisz, gdy ktoś odchodzi
          </Link>
          .
        </p>

        <p className="mt-10 max-w-[46ch] text-[15px] leading-[1.6] text-foreground">
          Dziś pierwszy raport za 0 zł. Jeśli chcesz go co tydzień, przenoszę
          Twoje plany — pierwszej piątce również za 0 zł, kolejnym osobom za{" "}
          {WDROZENIE_NEXT_PRICE_ZL} zł. Przez 90 dni nie płacisz nic. Potem 39 zł
          miesięcznie do 15 podopiecznych albo 99 zł do 30.
        </p>

        <ol className="mt-14 m-0 grid list-none gap-6 p-0">
          {WDROZENIE_STEPS.map((step) => (
            <li key={step.n} className="grid grid-cols-[3.5rem_minmax(0,1fr)] gap-4">
              <span className="t-label tracking-[0.16em] text-fg-ghost">{step.n}</span>
              <div>
                <p className="t-heading m-0">{step.title}</p>
                <p className="mt-1 max-w-[46ch] text-[15px] leading-[1.6] text-muted">
                  {step.body}
                </p>
              </div>
            </li>
          ))}
        </ol>

        <p className="mt-14 max-w-[46ch] text-[15px] leading-[1.6] text-foreground">
          Pierwsza piątka: 0 zł — w zamian za szczerą opinię po 30 dniach. Kolejne
          osoby: {WDROZENIE_NEXT_PRICE_ZL} zł.
        </p>

        <ReviewProof />

        <div id="formularz" className="max-w-[520px] scroll-mt-24">
          <Suspense fallback={<p className="mt-12 text-sm text-muted">Wczytuję formularz…</p>}>
            <WdrozenieForm />
          </Suspense>
        </div>

        <section className="mt-14" aria-labelledby="wdrozenie-stack">
          <h2 id="wdrozenie-stack" className="t-heading m-0">
            Co dostajesz
          </h2>
          <ul className="mt-6 m-0 list-none border-t border-border p-0">
            {WDROZENIE_STACK.map((row) => (
              <li
                key={row.title}
                className="grid grid-cols-1 gap-2 border-b border-border py-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-baseline sm:gap-8"
              >
                <div>
                  <p className="m-0 text-[17px] font-medium leading-snug">
                    {"href" in row && row.href ? (
                      <Link href={row.href} className="underline-offset-4 hover:underline">
                        {row.title}
                      </Link>
                    ) : (
                      row.title
                    )}
                  </p>
                  <p className="mt-1 max-w-[46ch] text-[15px] leading-[1.6] text-muted">
                    {row.body}
                  </p>
                </div>
                {row.valueZl != null ? (
                  <p className="t-num m-0 text-[15px] text-muted sm:text-right">{row.valueZl} zł</p>
                ) : null}
              </li>
            ))}
            <li className="flex items-baseline justify-between gap-6 py-5">
              <p className="m-0 text-[15px] text-foreground">Razem</p>
              <p className="t-num m-0 text-[15px]">
                {WDROZENIE_STACK_SUM_ZL} zł · płacisz 0 zł
              </p>
            </li>
          </ul>
        </section>

        <div className="mt-14 rounded-[var(--r-card)] border border-border-strong p-5">
          <p className="t-label m-0 tracking-[0.16em]">Przeniesienie całej bazy</p>
          <p className="mt-3 t-num text-[clamp(1.75rem,4vw,2.25rem)] leading-none">
            {WDROZENIE_PREMIUM_ZL.toLocaleString("pl-PL")} zł
          </p>
          <p className="mt-4 max-w-[42ch] text-[15px] leading-[1.6] text-muted">
            Nie chcesz nic przysyłać po kawałku? Przenoszę całą bazę i plany. 90
            dni opieki co tydzień. Ta sama gwarancja: jeśli raport nic nie powie —
            kończymy.
          </p>
        </div>

        <section className="mt-20" aria-labelledby="wdrozenie-faq">
          <h2 id="wdrozenie-faq" className="t-heading m-0">
            Najczęstsze pytania
          </h2>
          <dl className="mt-8 m-0">
            {FAQ.map((item) => (
              <div key={item.q} className="border-b border-border py-6">
                <dt className="m-0 text-[20px] font-medium leading-snug">{item.q}</dt>
                <dd className="t-small m-0 mt-3 max-w-[46ch] leading-[1.65] text-muted">{item.a}</dd>
              </div>
            ))}
          </dl>
        </section>
      </main>
    </MarketingShell>
  );
}
