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
      className="scroll-mt-20 border-y border-border bg-surface-raised px-5 py-24 sm:px-6 sm:py-32"
    >
      <div id="jak-to-dziala" className="mx-auto max-w-6xl scroll-mt-20">
        <p className="eyebrow">{"/// Start"}</p>
        <h2 className="mt-4 max-w-xl display-caps text-[clamp(2rem,4vw,3.25rem)] text-foreground">
          Trzy kroki do pierwszego treningu
        </h2>
        <ol className="mt-12 grid gap-3.5 md:grid-cols-3">
          {STEPS.map((step) => (
            <li
              key={step.n}
              className="rounded-xl border border-border bg-surface p-7 shadow-card transition-[background-color,border-color] duration-[var(--dur-med)] hover:border-border-strong hover:bg-surface-hover"
            >
              <span className="font-mono text-sm font-semibold tabular-nums text-muted">
                {step.n}
              </span>
              <h3 className="mt-4 display-caps text-lg text-foreground">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{step.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </LandingReveal>
  );
}
