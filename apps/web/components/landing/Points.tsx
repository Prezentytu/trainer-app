import { LandingReveal } from "./LandingReveal";

const POINTS = [
  {
    n: "01",
    title: "Plan w minuty",
    body: "Szablon z biblioteki albo układ od zera — serie, ciężary, przerwy.",
  },
  {
    n: "02",
    title: "Jeden link dla klienta",
    body: "Bez instalacji i bez konta. Otwiera portal w telefonie.",
  },
  {
    n: "03",
    title: "Logowanie serii w sekundy",
    body: "Prefill z ostatniego treningu. Timer przerwy startuje sam.",
  },
  {
    n: "04",
    title: "Trening w panelu",
    body: "Widzisz każdą serię, gdy klient kończy — nie po tygodniu w Excelu.",
  },
  {
    n: "05",
    title: "Rekordy i zastoje",
    body: "PR oznaczane automatycznie. Zastój zauważysz wcześniej niż klient.",
  },
  {
    n: "06",
    title: "Działa bez zasięgu",
    body: "Wyniki zapisują się lokalnie i synchronizują, gdy wróci sieć.",
  },
] as const;

export function Points() {
  return (
    <LandingReveal
      as="section"
      id="co-dostajesz"
      className="scroll-mt-20 border-t border-border px-5 py-24 sm:px-6 sm:py-32"
    >
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-4">
            <p className="font-mono text-xs uppercase tracking-caps text-muted">Produkt</p>
            <h2 className="mt-4 display-editorial text-[clamp(2rem,4.5vw,3.5rem)] text-foreground text-pretty">
              Tylko to, czego{" "}
              <span className="accent-serif">potrzebujesz</span>
            </h2>
          </div>
          <ol className="divide-y divide-border border-y border-border lg:col-span-8">
            {POINTS.map((point) => (
              <li
                key={point.n}
                className="grid grid-cols-[3.5rem_1fr] gap-5 py-7 sm:grid-cols-[4.5rem_1fr] sm:gap-8 sm:py-8"
              >
                <span className="display-editorial text-2xl text-muted-faint sm:text-3xl">
                  {point.n}
                </span>
                <div className="min-w-0">
                  <h3 className="display-editorial text-lg text-foreground sm:text-xl">
                    {point.title}
                  </h3>
                  <p className="mt-1.5 max-w-md text-[15px] leading-relaxed text-muted">
                    {point.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </LandingReveal>
  );
}
