import { Card, Marker } from "@/components/ui";
import { LineChart } from "@/components/charts/LineChart";
import { LandingReveal } from "./LandingReveal";
import { SectionLabel, StatTile } from "./primitives";

const CHART_POINTS = [
  { label: "STY", value: 117.5 },
  { label: "LUT", value: 120 },
  { label: "MAR", value: 120 },
  { label: "KWI", value: 125 },
  { label: "MAJ", value: 130 },
  { label: "CZE", value: 132.5 },
  { label: "LIP", value: 137.5 },
  { label: "SIE", value: 142.5 },
];

export function ProgressCard() {
  return (
    <LandingReveal
      as="section"
      className="mx-auto max-w-[1200px] px-5 pt-[clamp(6rem,12vw,10rem)] sm:px-8"
    >
      <p
        className="landing-stagger t-label m-0 tracking-[0.16em]"
        style={{ ["--i" as string]: 0 }}
      >
        03 — Progres
      </p>

      <div className="landing-stagger mt-12" style={{ ["--i" as string]: 1 }}>
        <Card>
          <div className="grid grid-cols-1 items-center gap-10 md:grid-cols-2 md:gap-12">
            <div className="min-w-0">
              <SectionLabel action={<Marker tone="pr">PR</Marker>}>
                Martwy ciąg · 1RM
              </SectionLabel>
              <div className="mt-4">
                <LineChart
                  points={CHART_POINTS}
                  height={200}
                  unit="kg"
                  ariaLabel="Wykres 1RM martwego ciągu od 117,5 do 142,5 kg"
                />
              </div>
            </div>
            <div className="grid gap-8">
              <StatTile value="142,5" unit="kg" label="Rekord" size="lg" tone="pr" />
              <StatTile value="1 280" unit="kg" label="Objętość · tydzień" delta="+8%" size="lg" />
              <StatTile value="24" label="Sesje" />
            </div>
          </div>
        </Card>
      </div>
    </LandingReveal>
  );
}
