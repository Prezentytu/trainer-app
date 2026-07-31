import { LandingReveal } from "./LandingReveal";

const STEPS = [
  {
    n: "01",
    title: "Dodaj klienta",
    body: "Imię wystarczy na start.",
  },
  {
    n: "02",
    title: "Ułóż plan",
    body: "Szablon albo własny układ — i gotowe.",
  },
  {
    n: "03",
    title: "Wyślij link",
    body: "Klient trenuje w telefonie. Ty widzisz wynik.",
  },
];

export function HowItWorks() {
  return (
    <LandingReveal
      as="section"
      className="scroll-mt-20 border-y border-border bg-surface-sunken px-4 py-16 sm:px-6 sm:py-24"
    >
      <div id="jak-to-dziala" className="mx-auto max-w-6xl scroll-mt-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="font-mono text-xs font-medium tracking-[0.12em] text-muted uppercase">
            03 / Start
          </p>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-balance sm:text-4xl">
            Trzy kroki do pierwszego treningu
          </h2>
        </div>
        <ol className="mt-10 grid gap-4 md:grid-cols-3 md:gap-6">
          {STEPS.map((step) => (
            <li
              key={step.n}
              className="relative rounded-xl border border-border bg-surface p-6 shadow-card"
            >
              <span className="font-mono text-sm font-semibold tabular-nums text-accent">
                {step.n}
              </span>
              <h3 className="mt-4 font-display text-lg font-semibold text-foreground">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-foreground-secondary">{step.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </LandingReveal>
  );
}
