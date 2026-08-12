import { Card, Marker } from "@/components/ui";
import { LandingReveal } from "./LandingReveal";
import { SectionLabel, StatTile } from "./primitives";

const CHART_VALUES = [117.5, 120, 120, 125, 130, 132.5, 137.5, 142.5];

/**
 * Wykres landingu — czysty polyline bez osi Y i liczb w polu rysunku
 * (wartości niesie kolumna stat obok; ostatni punkt = PR w kolorze danych).
 */
function ProgressChart() {
  const w = 560;
  const h = 224;
  const padX = 8;
  const padTop = 18;
  const padBottom = 14;
  const min = Math.min(...CHART_VALUES);
  const max = Math.max(...CHART_VALUES);
  const innerW = w - padX * 2;
  const innerH = h - padTop - padBottom;

  const coords = CHART_VALUES.map((v, i) => ({
    x: padX + (i / (CHART_VALUES.length - 1)) * innerW,
    y: padTop + innerH - ((v - min) / (max - min)) * innerH,
  }));
  const line = coords.map((c) => `${c.x},${c.y}`).join(" ");
  const lastIdx = coords.length - 1;

  return (
    <div className="min-w-0">
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="h-48 w-full sm:h-56"
        role="img"
        aria-label="Wykres 1RM martwego ciągu: od 117,5 kg w styczniu do rekordowych 142,5 kg w sierpniu"
        preserveAspectRatio="none"
      >
        <polyline
          points={line}
          fill="none"
          stroke="var(--fg)"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
        {coords.map((c, i) => (
          <circle
            key={i}
            cx={c.x}
            cy={c.y}
            r={i === lastIdx ? 4.5 : 3}
            fill={i === lastIdx ? "var(--pr)" : "var(--fg)"}
            stroke="var(--bg)"
            strokeWidth="1.5"
          />
        ))}
      </svg>
      <div className="mt-3 flex items-baseline justify-between gap-2 border-t border-border pt-3">
        <span className="t-label tracking-[0.16em]">STY</span>
        <span className="t-label tracking-[0.16em] text-fg-ghost">8 miesięcy</span>
        <span className="t-label tracking-[0.16em]">SIE</span>
      </div>
    </div>
  );
}

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
      <h2
        className="landing-stagger mt-6 max-w-[18ch] text-[clamp(1.875rem,4.2vw,3.25rem)] font-semibold leading-[1.08] tracking-[-0.028em] text-balance"
        style={{ ["--i" as string]: 1 }}
      >
        Widzisz progres w liczbach, nie w samopoczuciu.
      </h2>

      <div className="landing-stagger mt-12 md:mt-16" style={{ ["--i" as string]: 2 }}>
        <Card className="p-6 sm:p-8">
          <div className="grid grid-cols-1 items-stretch gap-10 md:grid-cols-[1.55fr_1fr] md:gap-14">
            <div className="flex min-w-0 flex-col justify-center">
              <SectionLabel action={<Marker tone="pr">PR</Marker>}>
                Martwy ciąg · 1RM
              </SectionLabel>
              <div className="mt-5">
                <ProgressChart />
              </div>
            </div>
            <div className="flex flex-col justify-center divide-y divide-border md:border-l md:border-border md:pl-10">
              <div className="py-5 first:pt-0 last:pb-0">
                <StatTile value="142,5" unit="kg" label="Rekord" size="lg" tone="pr" />
              </div>
              <div className="py-5 first:pt-0 last:pb-0">
                <StatTile value="12 460" unit="kg" label="Objętość · tydzień" delta="+8%" size="lg" />
              </div>
              <div className="py-5 first:pt-0 last:pb-0">
                <StatTile value="24" label="Sesje · 8 mies." />
              </div>
            </div>
          </div>
        </Card>
      </div>
    </LandingReveal>
  );
}
