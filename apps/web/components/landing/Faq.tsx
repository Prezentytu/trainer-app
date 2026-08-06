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
    a: "Wczesny dostęp 0 zł, bez karty. Potem 149 zł miesięcznie. Klient nie płaci nic.",
  },
  {
    q: "Co, gdy na siłowni nie ma zasięgu?",
    a: "Klient odhacza serie offline. Wynik dosyła się, gdy wróci internet.",
  },
  {
    q: "Czy muszę układać plan od zera dla każdego klienta?",
    a: "Nie. Raz ułożony plan przypisujesz kolejnym klientom.",
  },
  {
    q: "Skąd wiem, że klient trenuje?",
    a: "Zakończony trening, serie i rekordy widzisz w panelu od razu.",
  },
] as const;

export function Faq() {
  const baseId = useId();
  const [open, setOpen] = useState<number | null>(0);

  return (
    <LandingReveal
      as="section"
      id="pytania"
      className="scroll-mt-24 border-t border-border px-5 py-32 sm:px-6 sm:py-44"
    >
      <div className="mx-auto max-w-2xl">
        <div className="text-center">
          <p className="font-mono text-[11px] uppercase tracking-[var(--tracking-eyebrow)] text-muted">
            05 — Pytania
          </p>
          <h2 className="mt-4 display-landing text-[clamp(1.5rem,3.4vw,2.75rem)] text-foreground text-pretty">
            Zanim zapytasz.
          </h2>
        </div>

        <ul className="mt-12 space-y-3 sm:mt-16">
          {FAQ_ITEMS.map((item, i) => {
            const isOpen = open === i;
            const panelId = `${baseId}-panel-${i}`;
            const buttonId = `${baseId}-button-${i}`;
            return (
              <li
                key={item.q}
                className="landing-stagger overflow-hidden rounded-xl border border-border bg-surface"
                style={{ ["--i" as string]: i }}
              >
                <h3>
                  <button
                    type="button"
                    id={buttonId}
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    className="flex w-full items-center justify-between gap-4 p-5 text-left font-medium text-foreground transition-colors hover:bg-surface-hover focus-visible:outline-none focus-visible:shadow-[var(--glow-accent)] sm:p-6"
                    onClick={() => setOpen(isOpen ? null : i)}
                  >
                    <span className="text-[15px] sm:text-base">{item.q}</span>
                    <span
                      className="landing-faq-icon shrink-0 text-xl leading-none text-muted"
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
                    <p className="px-5 pb-6 text-[14px] leading-relaxed text-muted sm:px-6">
                      {item.a}
                    </p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </LandingReveal>
  );
}
