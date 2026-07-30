const STEPS = [
  {
    n: "01",
    title: "Dodaj klienta",
    body: "Imię i cel wystarczą. Resztę uzupełnisz, gdy będzie potrzeba.",
  },
  {
    n: "02",
    title: "Zbuduj lub przypisz plan",
    body: "Szablon startowy albo własna formuła. Composer przyspiesza serie i RIR.",
  },
  {
    n: "03",
    title: "Wyślij link portalu",
    body: "Klient loguje treningi na telefonie. Ty widzisz sesje, PR i kto wymaga uwagi.",
  },
];

export function HowItWorks() {
  return (
    <section id="jak-to-dziala" className="scroll-mt-20 border-y border-border bg-surface-sunken px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold tracking-[0.08em] text-accent uppercase">Pierwsze 15 minut</p>
          <h2 className="mt-3 font-display text-2xl font-bold tracking-tight sm:text-3xl">
            Od zera do wartości w trzech krokach
          </h2>
          <p className="mt-3 text-sm text-foreground-secondary sm:text-base">
            Progress nie startuje od pustego ekranu — od razu wiesz, co zrobić najpierw.
          </p>
        </div>
        <ol className="mt-10 grid gap-6 md:grid-cols-3">
          {STEPS.map((step) => (
            <li
              key={step.n}
              className="relative rounded-xl border border-border bg-surface p-5 shadow-card"
            >
              <span className="font-mono text-sm font-semibold tabular-nums text-accent">{step.n}</span>
              <h3 className="mt-3 font-display text-lg font-semibold text-foreground">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-foreground-secondary">{step.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
