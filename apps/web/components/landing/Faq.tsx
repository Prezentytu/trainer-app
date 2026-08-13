"use client";

import { useId, useState } from "react";
import { LandingReveal } from "./LandingReveal";

const FAQ_ITEMS = [
  {
    q: "Czy klient musi coś instalować?",
    a: "Nie. Otwiera link w przeglądarce — bez konta i bez aplikacji.",
  },
  {
    q: "Ile to kosztuje?",
    a: "Do 5 podopiecznych: 0 zł na zawsze, bez karty. Przy większej liczbie: 39 zł za 15 osób albo 99 zł za 30. Płacisz Ty. Podopieczny zawsze 0 zł. Na start: 10 miejsc w miesiącu na rozmowę — 90 dni za 0 zł, do 15 osób. Albo 490 zł raz za rok przy 15 osobach; potem 39 zł za 15 — ta kwota nie rośnie.",
  },
  {
    q: "Dla kogo to jest?",
    a: "Dla trenera personalnego, który układa plany i wysyła je klientom na telefon. Nie do zarządzania klubem i nie do diet.",
  },
  {
    q: "Co z moimi danymi?",
    a: "Są Twoje. Eksport JSON i CSV z panelu. Klient nie zakłada konta — po współpracy nie zostaje mu aplikacja w sklepie.",
  },
  {
    q: "Skąd wiem, że klient trenuje?",
    a: "Zakończony trening, serie i rekordy w panelu od razu. Kolejka pokazuje, kto nie trenował. Możesz napisać pierwszy.",
  },
] as const;

export function Faq() {
  const baseId = useId();
  const [open, setOpen] = useState<number | null>(null);

  return (
    <LandingReveal
      as="section"
      id="pytania"
      className="mx-auto max-w-[1200px] scroll-mt-24 px-5 pt-[clamp(7rem,14vw,10rem)] sm:px-8"
    >
      <div className="landing-stagger">
        <h2 className="m-0 mb-12 text-[clamp(2.25rem,5vw,4rem)] font-semibold leading-[1.08] tracking-[-0.028em]">
          Najczęstsze pytania
        </h2>

        <div className="border-t border-border">
          {FAQ_ITEMS.map((item, i) => {
            const isOpen = open === i;
            const panelId = `${baseId}-panel-${i}`;
            const buttonId = `${baseId}-button-${i}`;
            return (
              <div key={item.q} className="border-b border-border">
                <h3 className="m-0">
                  <button
                    type="button"
                    id={buttonId}
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    className="flex min-h-11 w-full cursor-pointer items-center justify-between gap-8 border-0 bg-transparent py-6 text-left text-foreground focus-visible:outline-none focus-visible:shadow-[var(--focus-ring)]"
                    onClick={() => setOpen(isOpen ? null : i)}
                  >
                    <span className="t-heading">{item.q}</span>
                    <span
                      className="landing-faq-icon t-num shrink-0 text-[18px] text-fg-faint"
                      data-open={isOpen}
                      aria-hidden
                    >
                      +
                    </span>
                  </button>
                </h3>
                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={buttonId}
                  className="landing-faq-content"
                  data-open={isOpen}
                >
                  <div>
                    <p className="t-small m-0 max-w-[62ch] pb-6 leading-[1.65]">{item.a}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </LandingReveal>
  );
}
