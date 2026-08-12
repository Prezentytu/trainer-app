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
    a: "Do 5 podopiecznych: 0 zł na zawsze, bez karty. Potem Solo 39 zł / 15 osób, Pro 99 zł / 30. Płacisz Ty. Podopieczny zawsze 0 zł. Wczesny dostęp: bez limitu, bez karty.",
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
  {
    q: "Co, gdy na siłowni nie ma zasięgu?",
    a: "Klient odhacza serie offline. Wynik dosyła się, gdy wróci internet.",
  },
  {
    q: "Czy muszę układać plan od zera dla każdego klienta?",
    a: "Nie. Raz ułożony plan przypisujesz kolejnym klientom.",
  },
] as const;

export function Faq() {
  const baseId = useId();
  const [open, setOpen] = useState<number | null>(null);

  return (
    <LandingReveal
      as="section"
      id="pytania"
      className="mx-auto max-w-[1200px] scroll-mt-24 px-5 pt-[clamp(6rem,12vw,10rem)] sm:px-8"
    >
      <p
        className="landing-stagger t-label m-0 tracking-[0.16em]"
        style={{ ["--i" as string]: 0 }}
      >
        05 — Pytania
      </p>
      <h2
        className="landing-stagger mt-6 mb-12 text-[clamp(1.875rem,4.2vw,3.25rem)] font-semibold leading-[1.08] tracking-[-0.028em]"
        style={{ ["--i" as string]: 1 }}
      >
        Najczęstsze pytania
      </h2>

      <div className="border-t border-border">
        {FAQ_ITEMS.map((item, i) => {
          const isOpen = open === i;
          const panelId = `${baseId}-panel-${i}`;
          const buttonId = `${baseId}-button-${i}`;
          return (
            <div
              key={item.q}
              className="landing-stagger border-b border-border"
              style={{ ["--i" as string]: 2 + i }}
            >
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
    </LandingReveal>
  );
}
