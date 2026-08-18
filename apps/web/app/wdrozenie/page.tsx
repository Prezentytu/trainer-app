import { Suspense } from "react";
import { MarketingShell } from "@/components/landing/MarketingShell";
import { WdrozenieForm } from "./WdrozenieForm";

const AGENDA = [
  { n: "01", title: "Start", body: "Dwie minuty: czym dziś wysyłasz plan i ile za to płacisz." },
  { n: "02", title: "Plan", body: "Przenosisz jeden plan z arkusza albo PDF do linku." },
  { n: "03", title: "Linki", body: "Trzech klientów dostaje link na Twoim WhatsAppie, na rozmowie." },
  { n: "04", title: "Kolejka", body: "Widzisz, kto nie trenował. Wiesz, co napisać." },
] as const;

const FAQ = [
  {
    q: "Ile trwa rozmowa?",
    a: "30 minut, w tym czas na Twoje pytania.",
  },
  {
    q: "Czy muszę płacić na rozmowie?",
    a: "Nie. 90 dni, do 15 osób, 0 zł. Rok z góry — 390 zł — jest opcją, nie warunkiem.",
  },
  {
    q: "Co przynieść?",
    a: "Jeden plan w arkuszu albo PDF i imiona trzech klientów, którym wyślesz link.",
  },
  {
    q: "Co jeśli nikt nie dokończy treningu?",
    a: "Zostajesz na 0 zł. Warunek: trzy linki wysłane na rozmowie.",
  },
  {
    q: "Czym to nie jest?",
    a: "To nie jest dieta, grafik sesji ani apka w sklepie. Chodzi o plan w linku i wgląd w trening.",
  },
] as const;

export default function WdrozeniePage() {
  return (
    <MarketingShell action="konto">
      <main className="mx-auto max-w-[720px] px-5 py-16 sm:px-8 sm:py-24">
        <p className="t-label m-0 tracking-[0.16em]">30 minut · nie prezentacja</p>
        <h1 className="mt-6 max-w-[16ch] text-[clamp(2.25rem,5vw,4.5rem)] font-semibold leading-[1.05] tracking-[-0.03em]">
          W 30 minut przenosisz plan do linku bez konta.
        </h1>
        <p className="mt-6 max-w-[46ch] text-[17px] leading-[1.6] text-muted">
          Jeden plan, trzech klientów i linki wysłane na rozmowie. Klient otwiera je w
          przeglądarce — bez konta.
        </p>
        <p className="mt-4 max-w-[46ch] text-[15px] leading-[1.6] text-foreground-secondary">
          Jeśli w 14 dni żaden podopieczny nie dokończy treningu — zostajesz na 0 zł.
          Warunek: wysłałeś link do co najmniej trzech osób na rozmowie.
        </p>

        <ol className="mt-14 m-0 grid list-none gap-6 p-0">
          {AGENDA.map((step) => (
            <li key={step.n} className="grid grid-cols-[3.5rem_minmax(0,1fr)] gap-4">
              <span className="t-label tracking-[0.16em] text-fg-ghost">{step.n}</span>
              <div>
                <p className="t-heading m-0">{step.title}</p>
                <p className="mt-1 max-w-[46ch] text-[15px] leading-[1.6] text-muted">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>

        <Suspense fallback={<p className="mt-12 text-sm text-muted">Wczytuję formularz…</p>}>
          <WdrozenieForm />
        </Suspense>

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
