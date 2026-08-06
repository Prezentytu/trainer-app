import { Card, ListRow, Marker } from "@/components/ui";
import { LandingReveal } from "./LandingReveal";
import { SectionLabel, StatTile } from "./primitives";

const POINTS = [
  { n: "01", title: "Plan w kilka minut", body: "Układasz raz, przypisujesz kolejnym klientom." },
  { n: "02", title: "Wiesz, kto trenuje", body: "Zakończony trening widzisz od razu." },
  { n: "03", title: "Rekordy i zastoje", body: "Wychwytujemy je automatycznie." },
] as const;

export function PanelMock() {
  return (
    <LandingReveal
      as="section"
      id="produkt"
      className="mx-auto max-w-[1200px] scroll-mt-24 px-5 pt-[clamp(6rem,12vw,10rem)] sm:px-8"
    >
      <p
        className="landing-stagger t-label m-0 tracking-[0.16em]"
        style={{ ["--i" as string]: 0 }}
      >
        01 — Dla ciebie
      </p>
      <h2
        className="landing-stagger mt-6 max-w-[16ch] text-[clamp(1.875rem,4.2vw,3.25rem)] font-semibold leading-[1.08] tracking-[-0.028em] text-balance"
        style={{ ["--i" as string]: 1 }}
      >
        Panel mieści się na jednym ekranie.
      </h2>

      <div className="landing-stagger mt-12 md:mt-16" style={{ ["--i" as string]: 2 }}>
        <Card className="p-6 sm:p-8">
          <SectionLabel action={<span className="t-label tracking-[0.16em]">Ten tydzień</span>}>
            Klienci
          </SectionLabel>
          <div className="-mx-2 mt-2">
            <ListRow
              title="Marta Lewicka"
              sub="Push A · środa"
              right={<Marker tone="gain">+2,5 kg</Marker>}
            />
            <ListRow
              title="Michał Dąbrowski"
              sub="Martwy ciąg · wtorek"
              right={<Marker tone="pr">PR</Marker>}
            />
            <ListRow
              title="Ola Wiśniewska"
              sub="Full Body · poniedziałek"
              right={<span className="t-num text-[14px] text-fg-faint">✓</span>}
            />
            <ListRow
              title="Piotr Sikora"
              sub="Brak treningu · 9 dni"
              right={<Marker tone="loss">-2</Marker>}
            />
          </div>
          <div className="mt-6 grid grid-cols-1 gap-6 border-t border-border pt-6 sm:grid-cols-3 sm:gap-8">
            <StatTile value="12" label="Klienci" />
            <StatTile value="38" label="Sesje / 7 dni" delta="+6" />
            <StatTile value="6" label="Rekordy" tone="pr" />
          </div>
        </Card>
      </div>

      <ol className="mt-12 grid list-none grid-cols-1 gap-x-10 gap-y-8 border-t border-border p-0 pt-10 sm:mt-16 sm:grid-cols-3">
        {POINTS.map((p, i) => (
          <li
            key={p.n}
            className="landing-stagger grid content-start gap-3"
            style={{ ["--i" as string]: 3 + i }}
          >
            <span className="t-num text-[13px] text-fg-ghost">{p.n}</span>
            <h3 className="t-heading m-0">{p.title}</h3>
            <p className="t-small m-0 leading-[1.6]">{p.body}</p>
          </li>
        ))}
      </ol>
    </LandingReveal>
  );
}
