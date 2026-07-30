const FAQ = [
  {
    q: "Czy klient musi instalować aplikację?",
    a: "Nie. Dostaje magic-link do portalu (PWA). Może dodać skrót na ekran główny telefonu — bez App Store i bez zakładania konta.",
  },
  {
    q: "Czy działa offline na siłowni?",
    a: "Portal klienta ma kolejkę offline i autosave — sesja nie znika, gdy ginie zasięg w piwnicy klubu.",
  },
  {
    q: "Ile to kosztuje?",
    a: "We wczesnym dostępie — bezpłatnie. Bez karty przy rejestracji. Gdy pojawi się cennik, będzie prosty i przewidywalny (bez 5% surcharge na podstawowy coaching).",
  },
  {
    q: "Czy mogę wyeksportować dane?",
    a: "Tak. Z Panelu eksportujesz JSON z klientami, planami, sesjami i maxami. Twoje dane nie są zakładnikami platformy.",
  },
  {
    q: "Czy trener potrzebuje telefonu / native app?",
    a: "MVP jest web-first — pracujesz na laptopie lub tablecie. Panel i kreator są responsywne. Native app trenera nie jest wymagana na start.",
  },
];

export function Faq() {
  return (
    <section id="faq" className="scroll-mt-20 px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-2xl">
        <div className="text-center">
          <p className="text-xs font-semibold tracking-[0.08em] text-accent uppercase">FAQ</p>
          <h2 className="mt-3 font-display text-2xl font-bold tracking-tight sm:text-3xl">
            Pytania przed startem
          </h2>
        </div>
        <div className="mt-8 space-y-2">
          {FAQ.map((item) => (
            <details
              key={item.q}
              className="group rounded-xl border border-border bg-surface px-4 py-1 shadow-card open:shadow-raised"
            >
              <summary className="cursor-pointer list-none py-3 text-sm font-medium text-foreground marker:content-none [&::-webkit-details-marker]:hidden">
                <span className="flex items-center justify-between gap-3">
                  {item.q}
                  <span
                    aria-hidden
                    className="shrink-0 text-muted transition-transform group-open:rotate-45"
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
    </section>
  );
}
