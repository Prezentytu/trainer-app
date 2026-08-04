import { LandingReveal } from "./LandingReveal";

const STEPS = [
  {
    n: "1",
    title: "Dodaj klienta",
    body: "Imię wystarczy na start.",
  },
  {
    n: "2",
    title: "Ułóż plan",
    body: "Gotowy plan z biblioteki albo własny układ.",
  },
  {
    n: "3",
    title: "Wyślij link",
    body: "Klient trenuje w telefonie. Ty widzisz każdy trening.",
  },
];

export function HowItWorks() {
  return (
    <LandingReveal
      as="section"
      id="jak-to-dziala"
      className="scroll-mt-20 border-y border-border px-5 py-32 sm:px-6 sm:py-40"
    >
      <div className="mx-auto max-w-5xl">
        <p className="text-sm text-muted">Jak to działa</p>
        <h2 className="mt-4 max-w-xl display-soft text-[clamp(1.875rem,3.4vw,2.75rem)] text-foreground text-pretty">
          Trzy kroki do pierwszego treningu
        </h2>
        <ol className="mt-16 grid gap-12 md:grid-cols-3 md:gap-10">
          {STEPS.map((step) => (
            <li key={step.n}>
              <span className="font-mono text-sm tabular-nums text-muted-faint">{step.n}</span>
              <h3 className="mt-4 display-soft text-xl text-foreground">{step.title}</h3>
              <p className="mt-2 max-w-xs text-[15px] leading-relaxed text-muted">{step.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </LandingReveal>
  );
}
