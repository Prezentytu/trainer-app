import { LandingReveal } from "./LandingReveal";

const FAQ = [
  {
    q: "Czy klient musi coś instalować?",
    a: "Nie. Dostaje link do portalu w przeglądarce. Może dodać skrót na ekran — bez sklepu z aplikacjami i bez konta.",
  },
  {
    q: "Czy działa na siłowni bez zasięgu?",
    a: "Portal zapisuje trening lokalnie i dogrywa, gdy wróci sieć.",
  },
  {
    q: "Ile to kosztuje?",
    a: "Wczesny dostęp kosztuje 149 zł miesięcznie. Napisz do nas, żeby omówić wdrożenie dla swojego zespołu.",
  },
  {
    q: "Czy mogę zabrać swoje dane?",
    a: "Tak. Z Panelu eksportujesz klientów, plany i historię treningów jednym kliknięciem.",
  },
  {
    q: "Czy potrzebuję aplikacji na telefon?",
    a: "Nie. Pracujesz w przeglądarce na komputerze lub tablecie.",
  },
];

export function Faq() {
  return (
    <LandingReveal as="section" className="scroll-mt-20 px-4 py-16 sm:px-6 sm:py-24">
      <div id="faq" className="mx-auto max-w-2xl scroll-mt-20">
        <div className="text-center">
          <p className="font-mono text-xs font-medium tracking-[0.12em] text-muted uppercase">
            FAQ
          </p>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-balance sm:text-4xl">
            Pytania przed startem
          </h2>
        </div>
        <div className="mt-8 space-y-2">
          {FAQ.map((item) => (
            <details
              key={item.q}
              className="group rounded-xl border border-border bg-surface px-4 py-1 shadow-card open:shadow-raised"
            >
              <summary className="cursor-pointer list-none py-3 text-sm font-medium text-foreground marker:content-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent [&::-webkit-details-marker]:hidden">
                <span className="flex items-center justify-between gap-3">
                  {item.q}
                  <span
                    aria-hidden
                    className="shrink-0 text-muted transition-transform duration-200 group-open:rotate-45"
                  >
                    +
                  </span>
                </span>
              </summary>
              <p className="pb-4 text-sm leading-relaxed text-foreground-secondary">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </LandingReveal>
  );
}
