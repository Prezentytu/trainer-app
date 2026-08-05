import { LandingReveal } from "./LandingReveal";

const TRAINER_POINTS = [
  {
    n: "01",
    title: "Plan w minuty",
    body: "Szablon albo od zera.",
  },
  {
    n: "02",
    title: "Seria na żywo",
    body: "Widzisz wynik od razu.",
  },
  {
    n: "03",
    title: "Rekordy i zastoje",
    body: "PR i plateau automatycznie.",
  },
] as const;

const CLIENT_POINTS = [
  {
    n: "04",
    title: "Jeden link",
    body: "Bez konta. Bez instalacji.",
  },
  {
    n: "05",
    title: "Log w sekundy",
    body: "Prefill z ostatniego treningu.",
  },
  {
    n: "06",
    title: "Bez zasięgu",
    body: "Zapis lokalny, sync później.",
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
            02 — Wartość
          </p>
          <h2 className="mt-4 display-serif text-[clamp(2rem,4.5vw,3.5rem)] text-foreground text-pretty">
            Tylko to, czego potrzebujesz.
          </h2>
        </div>

        <div className="mt-16 space-y-14 sm:mt-20 sm:space-y-16">
          <div>
            <p className="mb-4 font-mono text-xs uppercase tracking-caps text-muted">
              Dla trenera
            </p>
            <ol className="grid border-t border-l border-border sm:grid-cols-3">
              {TRAINER_POINTS.map((point, i) => (
                <PointCell key={point.n} {...point} index={i} />
              ))}
            </ol>
          </div>

          <div>
            <p className="mb-4 font-mono text-xs uppercase tracking-caps text-muted">
              Dla klienta
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
