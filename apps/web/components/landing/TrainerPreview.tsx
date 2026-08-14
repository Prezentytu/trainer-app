import { Marker } from "@/components/ui";
import { LandingReveal } from "./LandingReveal";
import { SectionHead, SECTION_COPY, SECTION_H2, SECTION_SPACE } from "./primitives";

const ROWS = [
  {
    name: "Michał Dąbrowski",
    sub: "Wyciskanie · dziś",
    value: "105,0 kg × 3",
    tone: "pr" as const,
    mark: "PR",
  },
  {
    name: "Marta Lewicka",
    sub: "Przysiad · wczoraj",
    value: "85,0 kg × 5",
    tone: "gain" as const,
    mark: "+2,5",
  },
  {
    name: "Ola Wiśniewska",
    sub: "bez treningu od 5 dni",
    value: null,
    tone: "loss" as const,
    mark: "5 dni",
  },
];

export function TrainerPreview() {
  return (
    <LandingReveal
      as="section"
      id="panel"
      className="relative z-0 scroll-mt-24 bg-background lg:-mt-[32svh]"
    >
      <div className={`landing-stagger mx-auto max-w-[1200px] px-5 sm:px-8 ${SECTION_SPACE}`}>
        <SectionHead n="02" label="Panel">
          <h2 className={SECTION_H2}>Widzisz każdy zakończony trening.</h2>
          <div className="mt-8 grid grid-cols-1 items-center gap-14 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-24">
            <p className={SECTION_COPY}>
              Serie i&nbsp;rekordy wpadają do panelu od razu. Gdy ktoś nie trenuje,
              widzisz to od razu i&nbsp;możesz napisać pierwszy.
            </p>

            <div aria-label="Podgląd panelu trenera">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-4 border-b border-border-strong pb-3">
                <span className="t-label tracking-[0.16em]">Klient</span>
                <span className="t-label tracking-[0.16em] text-right text-fg-ghost">
                  Dane przykładowe
                </span>
              </div>
              <ul className="m-0 list-none p-0">
                {ROWS.map((r) => (
                  <li
                    key={r.name}
                    className="grid min-h-14 grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border-b border-border"
                  >
                    <span className="grid min-w-0 gap-0.5 text-left">
                      <span className="break-words text-[15px] font-medium text-foreground">
                        {r.name}
                      </span>
                      <span className="t-label text-fg-faint">{r.sub}</span>
                    </span>
                    <span className="flex min-w-0 items-center justify-end gap-3">
                      {r.value ? (
                        <span className="t-num min-w-0 break-words text-right text-[15px] tabular-nums">
                          {r.value}
                        </span>
                      ) : null}
                      <span className="flex shrink-0 justify-end">
                        <Marker tone={r.tone}>{r.mark}</Marker>
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </SectionHead>
      </div>
    </LandingReveal>
  );
}
