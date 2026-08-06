import { LandingReveal } from "./LandingReveal";

const SCENARIOS = [
  {
    time: "07:12",
    body: "Anna skończyła trening. Wszystkie serie odhaczone.",
  },
  {
    time: "09:30",
    body: "Układasz plan nowemu klientowi. Cztery minuty.",
  },
  {
    time: "12:45",
    body: "Marek pobił rekord w martwym ciągu. Widzisz to od razu.",
  },
  {
    time: "17:20",
    body: "Wysyłasz link. Klient nie instaluje nic.",
  },
  {
    time: "21:05",
    body: "Przeglądasz tydzień. Wiesz, kto trenował.",
  },
] as const;

export function ScenarioScroll() {
  return (
    <LandingReveal
      as="section"
      id="dzien"
      className="scroll-mt-24 border-t border-border px-5 py-32 sm:px-6 sm:py-44"
    >
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <p className="font-mono text-[11px] uppercase tracking-[var(--tracking-eyebrow)] text-muted">
            01 — Jeden dzień
          </p>
          <h2 className="mt-4 display-landing text-[clamp(1.5rem,3.4vw,2.75rem)] text-foreground text-pretty">
            Tak wygląda dzień z RepMaxerem.
          </h2>
        </div>

        <ul className="landing-edge-mask mt-16 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] sm:mt-20 sm:gap-5 [&::-webkit-scrollbar]:hidden">
          {SCENARIOS.map((item, i) => (
            <li
              key={item.time}
              className="landing-stagger landing-scenario-card flex w-72 shrink-0 snap-center flex-col justify-between rounded-3xl border border-border bg-surface p-6 min-h-40"
              style={{ ["--i" as string]: i }}
            >
              <span className="font-mono text-[11px] uppercase tracking-caps text-muted-faint">
                {item.time}
              </span>
              <p className="landing-scenario-body mt-8 text-[17px] leading-snug text-foreground-secondary text-pretty">
                {item.body}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </LandingReveal>
  );
}
