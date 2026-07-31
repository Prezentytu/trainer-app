import { Avatar, Badge } from "@/components/ui";
import { LandingReveal } from "./LandingReveal";

const SETS = [
  { n: 1, weight: "60", reps: "8" },
  { n: 2, weight: "60", reps: "8" },
  { n: 3, weight: "62.5", reps: "6" },
];

export function PanelPreview() {
  return (
    <LandingReveal as="section" className="px-4 pb-16 sm:px-6 sm:pb-24">
      <div className="mx-auto max-w-6xl" aria-label="Podgląd produktu">
        <p className="mb-6 text-center font-mono text-xs font-medium tracking-[0.12em] text-muted uppercase">
          01 / Produkt
        </p>

        <div className="landing-demo grid items-end gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:gap-8">
          {/* Panel trenera */}
          <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-raised">
            <div className="flex items-center gap-2 border-b border-border px-4 py-3">
              <span className="h-2.5 w-2.5 rounded-full bg-danger" />
              <span className="h-2.5 w-2.5 rounded-full bg-pr" />
              <span className="h-2.5 w-2.5 rounded-full bg-accent" />
              <span className="ml-2 text-xs text-muted">Panel trenera</span>
            </div>

            <div className="space-y-4 p-4 sm:p-6">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h3 className="font-display text-lg font-semibold text-foreground">Klienci</h3>
                  <p className="mt-0.5 text-xs text-muted">Dzisiaj · 3 aktywnych</p>
                </div>
                <span className="rounded-[10px] bg-accent-dim px-2.5 py-1 text-xs font-semibold text-accent-strong">
                  + Nowy klient
                </span>
              </div>

              <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface-sunken">
                <li className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <Avatar name="Anna K." size="sm" />
                    <div className="min-w-0">
                      <div className="break-words text-sm font-medium">Anna K.</div>
                      <div className="text-xs text-muted">Push · tydzień 3</div>
                    </div>
                  </div>
                  <span className="landing-demo-status grid shrink-0 justify-items-end">
                    <span className="landing-demo-status-idle col-start-1 row-start-1 inline-flex items-center rounded-full bg-surface-active px-2.5 py-0.5 text-xs font-medium text-foreground-secondary">
                      w trakcie
                    </span>
                    <span className="landing-demo-status-done col-start-1 row-start-1 inline-flex items-center rounded-full bg-positive-dim px-2.5 py-0.5 text-xs font-medium text-positive">
                      ukończyła trening
                    </span>
                  </span>
                </li>
                <li className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <Avatar name="Marek W." size="sm" />
                    <div className="min-w-0">
                      <div className="break-words text-sm font-medium">Marek W.</div>
                      <div className="text-xs text-muted">Full body A</div>
                    </div>
                  </div>
                  <Badge tone="danger">9 dni ciszy</Badge>
                </li>
                <li className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <Avatar name="Ola S." size="sm" />
                    <div className="min-w-0">
                      <div className="break-words text-sm font-medium">Ola S.</div>
                      <div className="text-xs text-muted">Lower · tydzień 1</div>
                    </div>
                  </div>
                  <Badge tone="positive">plan aktywny</Badge>
                </li>
              </ul>
            </div>
          </div>

          {/* Telefon klienta */}
          <div className="mx-auto w-full max-w-[280px] lg:mx-0 lg:justify-self-end">
            <div className="landing-phone relative overflow-hidden rounded-[1.75rem] border-[3px] border-border-strong bg-surface shadow-raised">
              <div className="mx-auto mt-2 h-1.5 w-16 rounded-full bg-border-strong" />
              <div className="px-4 pt-4 pb-5">
                <p className="text-[10px] font-semibold tracking-[0.08em] text-muted uppercase">
                  Dzisiejszy trening
                </p>
                <h4 className="mt-1 font-display text-base font-semibold text-foreground">
                  Wyciskanie sztangi
                </h4>
                <p className="mt-0.5 text-xs text-muted">4 serie · 90 s przerwy</p>

                <ul className="mt-4 space-y-2">
                  {SETS.map((set, i) => (
                    <li
                      key={set.n}
                      className={`landing-demo-set landing-demo-set-${i + 1} flex items-center gap-3 rounded-[10px] border border-border bg-surface-sunken px-3 py-2.5`}
                    >
                      <span
                        className="landing-demo-check flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border-strong text-[10px] font-semibold text-muted"
                        aria-hidden
                      >
                        {set.n}
                      </span>
                      <div className="flex min-w-0 flex-1 items-baseline justify-between gap-2">
                        <span className="font-mono text-sm tabular-nums text-foreground">
                          {set.weight}{" "}
                          <span className="text-xs text-muted">kg</span>
                        </span>
                        <span className="font-mono text-sm tabular-nums text-foreground">
                          × {set.reps}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>

                <div className="landing-demo-complete mt-4 rounded-[10px] bg-accent px-3 py-2.5 text-center text-sm font-semibold text-accent-foreground">
                  Trening ukończony
                </div>
              </div>
            </div>
            <p className="mt-3 text-center text-xs text-muted">Widok klienta · link w telefonie</p>
          </div>
        </div>
      </div>
    </LandingReveal>
  );
}
