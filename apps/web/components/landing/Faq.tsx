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
];

export function Faq() {
  return (
    <LandingReveal as="section" id="faq" className="scroll-mt-20 px-5 py-28 sm:px-6 sm:py-36">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-4">
            <p className="font-mono text-xs uppercase tracking-caps text-muted">Pytania</p>
            <h2 className="mt-4 display-editorial text-[clamp(2.25rem,5vw,4rem)] text-foreground text-pretty">
              Najczęstsze{" "}
              <span className="accent-serif">pytania</span>
            </h2>
          </div>
          <div className="divide-y divide-border border-y border-border lg:col-span-8">
            {FAQ.map((item) => (
              <details key={item.q} className="group py-1">
                <summary className="cursor-pointer list-none py-5 text-[15px] font-medium text-foreground marker:content-none focus-visible:outline-none focus-visible:shadow-[var(--glow-accent)] [&::-webkit-details-marker]:hidden">
                  <span className="flex items-center justify-between gap-4">
                    {item.q}
                    <span
                      aria-hidden
                      className="shrink-0 text-muted transition-transform duration-[var(--dur-fast)] group-open:rotate-45"
                    >
                      +
                    </span>
                  </span>
                </summary>
                <p className="pb-5 text-[15px] leading-relaxed text-muted">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </div>
    </LandingReveal>
  );
}
