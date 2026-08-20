import { Suspense } from "react";
import Link from "next/link";
import { Icon } from "@/components/Icon";
import { MarketingShell } from "@/components/landing/MarketingShell";
import {
  LANDING_CAPS,
  PAGE_SHELL,
  SECTION_H2,
  SECTION_LEAD,
} from "@/components/landing/primitives";
import { ReviewProof } from "@/components/landing/ReviewProof";
import {
  WDROZENIE_NEXT_PRICE_ZL,
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
        <div className="max-w-[560px]">
          <Link
            href="/"
            className={`${LANDING_CAPS} inline-flex min-h-11 items-center gap-2 text-muted transition-colors duration-[var(--dur-fast)] hover:text-foreground focus-visible:outline-none focus-visible:shadow-[var(--focus-ring)]`}
          >
            <Icon name="back" size={14} decorative />
            Wróć
          </Link>

          <p className={`${LANDING_CAPS} m-0 mt-8 text-fg-ghost`}>
            24 godziny · 0 zł · {WDROZENIE_SPOTS} miejsc
          </p>
          <h1 className="m-0 mt-6 text-[clamp(2rem,5vw,2.75rem)] font-semibold leading-[1.02] tracking-[-0.03em] text-foreground text-balance">
            Pierwszy raport z Twoich podopiecznych — za 0 zł, w 24 godziny.
          </h1>
          <p className="m-0 mt-6 text-[17px] leading-[1.6] text-muted text-pretty">
            Przysyłasz to, czym dziś prowadzisz: arkusz, PDF albo zrzuty z WhatsAppa. Wraca
            raport i trzy wiadomości gotowe do wysłania. Bez rozmowy, bez karty.
          </p>

          <div id="formularz" className="scroll-mt-24">
            <Suspense
              fallback={<p className="mt-12 text-[15px] text-muted">Wczytuję formularz…</p>}
            >
              <WdrozenieForm />
            </Suspense>
          </div>
        </div>

        <section
          className="mt-20 border-t border-border pt-14"
          aria-labelledby="wdrozenie-stack"
        >
          <h2 id="wdrozenie-stack" className={SECTION_H2}>
            Co dostajesz
          </h2>
          <ul className="mt-8 m-0 list-none border-t border-border p-0">
            {WDROZENIE_STACK.map((row) => (
              <li
                key={row.title}
                className="grid grid-cols-1 gap-2 border-b border-border py-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-baseline sm:gap-8"
              >
                <div>
                  <p className="m-0 text-[17px] font-medium leading-snug">
                    {row.href ? (
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
                  <p className="t-num m-0 text-[15px] text-muted sm:text-right">
                    {row.valueZl} zł
                  </p>
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

        <section className="mt-20" aria-labelledby="wdrozenie-kroki">
          <h2 id="wdrozenie-kroki" className={SECTION_H2}>
            Jak to idzie
          </h2>
          <ol className="mt-8 m-0 list-none p-0">
            {WDROZENIE_STEPS.map((step) => (
              <li
                key={step.n}
                className="grid grid-cols-[3rem_minmax(0,1fr)] items-baseline gap-4 border-b border-border py-5 last:border-b-0"
              >
                <span className="t-num text-[13px] tabular-nums text-fg-ghost">{step.n}</span>
                <div>
                  <p className="m-0 text-[17px] font-medium leading-snug">{step.title}</p>
                  <p className="mt-1 max-w-[46ch] text-[15px] leading-[1.6] text-muted">
                    {step.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-20 max-w-[560px]" aria-labelledby="wdrozenie-cena">
          <h2 id="wdrozenie-cena" className={SECTION_H2}>
            Ile to kosztuje
          </h2>
          <p className={SECTION_LEAD}>
            Dziś pierwszy raport za 0 zł. Jeśli chcesz go co tydzień, przenoszę Twoje plany —
            pierwszej piątce również za 0 zł, kolejnym osobom za {WDROZENIE_NEXT_PRICE_ZL} zł.
            Przez 90 dni nie płacisz nic. Potem 39 zł miesięcznie do 15 podopiecznych albo
            99 zł do 30.
          </p>
          <p className="mt-6 max-w-[46ch] text-[15px] leading-[1.6] text-foreground-secondary">
            Dla trenera personalnego, który układa plany i wysyła je na telefon — zwykle 8–25
            osób, dziś arkusz i WhatsApp.{" "}
            <Link
              href="/ile-tracisz"
              className="text-foreground underline-offset-4 hover:underline"
            >
              Policz, ile tracisz, gdy ktoś odchodzi
            </Link>
            .
          </p>
          <div className="mt-10">
            <ReviewProof />
          </div>
        </section>

        <section className="mt-20" aria-labelledby="wdrozenie-faq">
          <h2 id="wdrozenie-faq" className={SECTION_H2}>
            Najczęstsze pytania
          </h2>
          <dl className="mt-8 m-0">
            {FAQ.map((item) => (
              <div key={item.q} className="border-b border-border py-6">
                <dt className="m-0 text-[19px] font-medium leading-snug">{item.q}</dt>
                <dd className="m-0 mt-3 max-w-[52ch] text-[16px] leading-[1.65] text-muted">
                  {item.a}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      </main>
    </MarketingShell>
  );
}
