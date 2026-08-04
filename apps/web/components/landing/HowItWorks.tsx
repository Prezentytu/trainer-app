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
    body: "Gotowy plan z biblioteki albo własny układ.",
  },
  {
    n: "03",
    title: "Wyślij link",
    body: "Klient trenuje w telefonie. Ty widzisz każdy trening.",
  },
];

export function HowItWorks() {
  return (
    <LandingReveal
      as="section"
      id="jak-to-dziala"
      className="scroll-mt-20 border-t border-border px-5 py-28 sm:px-6 sm:py-36"
    >
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-6 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-4">
            <p className="font-mono text-xs uppercase tracking-caps text-muted">Jak to działa</p>
            <h2 className="mt-4 display-editorial text-[clamp(2.25rem,5vw,4rem)] text-foreground text-pretty">
              Trzy kroki do{" "}
              <span className="accent-serif">pierwszego</span> treningu
            </h2>
          </div>
          <ol className="divide-y divide-border border-y border-border lg:col-span-8">
            {STEPS.map((step) => (
              <li
                key={step.n}
                className="grid grid-cols-[4rem_1fr] gap-6 py-8 sm:grid-cols-[5.5rem_1fr] sm:gap-10 sm:py-10"
              >
                <span className="display-editorial text-3xl text-muted-faint sm:text-4xl">
                  {step.n}
                </span>
                <div>
                  <h3 className="display-editorial text-xl text-foreground sm:text-2xl">
                    {step.title}
                  </h3>
                  <p className="mt-2 max-w-md text-[15px] leading-relaxed text-muted">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </LandingReveal>
  );
}
