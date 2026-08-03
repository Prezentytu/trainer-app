import { LandingReveal } from "./LandingReveal";

const FAQ = [
  {
    q: "Czy klient musi coś instalować?",
    a: "Nie. Dostaje link do portalu w przeglądarce. Może dodać skrót na ekran — bez sklepu z aplikacjami i bez konta.",
  },
  {
    q: "Czy działa na siłowni bez zasięgu?",
    a: "Tak. Wyniki zapisują się w telefonie i wysyłają automatycznie, gdy wróci zasięg.",
  },
  {
    q: "Ile to kosztuje?",
    a: "We wczesnym dostępie nic — zakładasz konto i korzystasz. Docelowa cena po premierze to 149 zł miesięcznie, wszystko w cenie.",
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
    <LandingReveal as="section" className="scroll-mt-20 px-5 py-24 sm:px-6 sm:py-32">
      <div id="faq" className="mx-auto max-w-2xl scroll-mt-20">
        <p className="eyebrow text-center">{"/// Faq"}</p>
        <h2 className="mt-4 text-center display-caps text-[clamp(2rem,4vw,3rem)] text-foreground">
          Pytania przed startem
        </h2>
        <div className="mt-10 space-y-2">
          {FAQ.map((item) => (
            <details
              key={item.q}
              className="group rounded-xl border border-border bg-surface px-5 py-1 shadow-card transition-[border-color,background-color] duration-[var(--dur-med)] open:border-border-strong open:bg-surface-hover"
            >
              <summary className="cursor-pointer list-none py-3.5 text-sm font-medium text-foreground marker:content-none focus-visible:outline-none focus-visible:shadow-[var(--glow-accent)] [&::-webkit-details-marker]:hidden">
                <span className="flex items-center justify-between gap-3">
                  {item.q}
                  <span
                    aria-hidden
                    className="shrink-0 font-mono text-muted transition-transform duration-[var(--dur-fast)] group-open:rotate-45"
                  >
                    +
                  </span>
                </span>
              </summary>
              <p className="pb-4 text-sm leading-relaxed text-muted">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </LandingReveal>
  );
}
