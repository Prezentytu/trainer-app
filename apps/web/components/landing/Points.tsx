import { LandingReveal } from "./LandingReveal";

const TRAINER_POINTS = [
  {
    n: "01",
    title: "Plan w kilka minut",
    body: "Układasz raz, zapisujesz jako szablon i przypisujesz kolejnym klientom.",
  },
  {
    n: "02",
    title: "Wiesz, kto naprawdę trenuje",
    body: "Zakończony trening widzisz od razu. Nie po tygodniu, nie wcale.",
  },
  {
    n: "03",
    title: "Rekordy i zastoje na oku",
    body: "Nowy rekord oznacza się sam. Widzisz też, gdzie od tygodni nic nie rośnie.",
  },
] as const;

const CLIENT_POINTS = [
  {
    n: "04",
    title: "Jeden link",
    body: "Bez instalowania i bez konta. Otwiera się jak zwykła strona.",
  },
  {
    n: "05",
    title: "Ciężary już wpisane",
    body: "Z poprzedniego treningu. Poprawia tylko to, co się zmieniło.",
  },
  {
    n: "06",
    title: "Działa bez zasięgu",
    body: "Trening zapisuje się na telefonie i dosyła się, gdy wróci internet.",
  },
] as const;

function PointCell({
  n,
  title,
  body,
  index,
}: {
  n: string;
  title: string;
  body: string;
  index: number;
}) {
  return (
    <li
      className="landing-point-cell landing-stagger flex flex-col gap-3 border-b border-r border-border p-6 sm:p-8"
      style={{ ["--i" as string]: index }}
    >
      <span className="font-mono text-lg uppercase tracking-caps text-muted-faint">{n}</span>
      <h3 className="display-serif text-xl text-foreground sm:text-2xl">{title}</h3>
      <p className="text-[15px] leading-relaxed text-muted">{body}</p>
    </li>
  );
}

export function Points() {
  return (
    <LandingReveal
      as="section"
      id="co-dostajesz"
      className="scroll-mt-20 border-t border-border px-5 py-32 sm:px-6 sm:py-44"
    >
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <p className="font-mono text-xs uppercase tracking-caps text-muted">
            03 — Co dostajesz
          </p>
          <h2 className="mt-4 display-serif text-[clamp(1.875rem,4.5vw,3.5rem)] text-foreground text-pretty">
            Ty układasz plan. Reszta dzieje się sama.
          </h2>
        </div>

        <div className="mt-16 space-y-14 sm:mt-20 sm:space-y-16">
          <div>
            <p className="mb-4 font-mono text-xs uppercase tracking-caps text-muted">
              Dla ciebie
            </p>
            <ol className="grid border-t border-l border-border sm:grid-cols-3">
              {TRAINER_POINTS.map((point, i) => (
                <PointCell key={point.n} {...point} index={i} />
              ))}
            </ol>
          </div>

          <div>
            <p className="mb-4 font-mono text-xs uppercase tracking-caps text-muted">
              Dla twojego klienta
            </p>
            <ol className="grid border-t border-l border-border sm:grid-cols-3">
              {CLIENT_POINTS.map((point, i) => (
                <PointCell key={point.n} {...point} index={i} />
              ))}
            </ol>
          </div>
        </div>
      </div>
    </LandingReveal>
  );
}
