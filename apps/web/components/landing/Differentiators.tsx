import { LandingReveal } from "./LandingReveal";

const CARDS = [
  {
    n: "01 / Szablony",
    title: "Jeden plan.\nWielu klientów.",
    body: "Plan zapisujesz jako szablon i przypisujesz kolejnym podopiecznym. Ciężary i progresję ustawiasz osobno dla każdego.",
  },
  {
    n: "02 / Trening na żywo",
    title: "Klient wie,\nco ma zrobić.",
    body: "Dokładne ciężary, powtórzenia i przerwy — timer odlicza sam. Każdy zapisany wynik widzisz od razu.",
  },
  {
    n: "03 / Analityka",
    title: "Zauważ zastój\njako pierwszy.",
    body: "Objętość, szacowane 1RM i regularność — dla każdego klienta, ćwiczenia i tygodnia. Zastój widzisz, zanim klient go poczuje.",
  },
  {
    n: "04 / Rekordy",
    title: "Rekordy życiowe.\nAutomatycznie.",
    body: "Klient widzi nowy rekord od razu po serii. Ty masz wszystkie rekordy w panelu.",
    pr: true,
  },
];

export function Differentiators() {
  return (
    <LandingReveal as="section" className="scroll-mt-20 px-5 py-24 sm:px-6 sm:py-32">
      <div id="korzysci" className="mx-auto max-w-6xl scroll-mt-20">
        <p className="eyebrow">{"/// Co robi"}</p>
        <h2 className="mt-4 max-w-2xl display-caps text-[clamp(2rem,4.6vw,3.5rem)] text-foreground">
          Wszystko między planem a{" "}
          <span
            className="text-transparent"
            style={{ WebkitTextStroke: "2px var(--foreground)" }}
          >
            rekordem
          </span>
          .
        </h2>

        <div className="mt-14 grid gap-3.5 sm:grid-cols-2">
          {CARDS.map((card) => (
            <article
              key={card.n}
              className={`rounded-xl border bg-surface p-7 shadow-card transition-[background-color,border-color] duration-[var(--dur-med)] hover:bg-surface-hover ${
                card.pr
                  ? "border-pr-border hover:border-pr/50"
                  : "border-border hover:border-border-strong"
              }`}
            >
              <p className="font-mono text-[11px] uppercase tracking-caps text-muted">
                {card.n}
              </p>
              <h3 className="mt-4 display-caps whitespace-pre-line text-[22px] text-foreground">
                {card.title}
              </h3>
              <p className="mt-3 text-[14.5px] leading-relaxed text-muted">{card.body}</p>
            </article>
          ))}
        </div>
      </div>
    </LandingReveal>
  );
}
