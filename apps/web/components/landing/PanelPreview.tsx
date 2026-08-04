import { LandingReveal } from "./LandingReveal";

const HEADER_COLS = ["Seria", "Ciężar", "Powt.", "RPE", ""];

const ROWS = [
  { n: "01", kg: "82,5", reps: "8", rpe: "7" },
  { n: "02", kg: "82,5", reps: "8", rpe: "8" },
  { n: "03", kg: "82,5", reps: "8", rpe: "—" },
];

export function PanelPreview() {
  return (
    <LandingReveal as="section" className="relative px-4 pt-16 pb-4 sm:px-6 sm:pt-24 sm:pb-8">
      <div className="landing-demo-stage mx-auto max-w-6xl" aria-label="Podgląd produktu">
        <div className="landing-demo landing-demo-frame overflow-hidden rounded-xl border border-border-strong bg-surface">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3.5 sm:px-6">
            <span className="text-sm text-muted">Trening klienta</span>
            <span className="relative inline-flex min-h-[1.25rem] min-w-[12rem] items-center">
              <span className="landing-demo-status-idle inline-flex items-center gap-2 text-sm text-muted">
                <span
                  className="acid-tick inline-block h-1.5 w-1.5 rounded-full bg-accent"
                  aria-hidden
                />
                Kasia M. · Push A · na żywo
              </span>
              <span className="landing-demo-status-done items-center gap-2 text-sm text-muted">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-foreground-secondary" aria-hidden />
                Kasia M. · Push A · ukończony
              </span>
            </span>
          </div>

          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border px-4 py-5 sm:px-6">
            <h3 className="min-w-0 flex-1 break-words display-editorial text-xl text-foreground sm:text-2xl">
              Wyciskanie na ławce
            </h3>
            <p className="shrink-0 font-mono text-sm tabular-nums text-muted">
              Cel: 4×8 · 82,5 kg · przerwa 90 s
            </p>
          </div>

          <div className="overflow-x-auto">
            <div
              className="grid min-w-[520px] font-mono text-[13px] tabular-nums"
              style={{ gridTemplateColumns: "56px 1fr 1fr 1fr 110px" }}
            >
              {HEADER_COLS.map((col, i) => (
                <div
                  key={`h-${i}`}
                  className="border-b border-border px-3 py-2.5 text-xs text-muted sm:px-4"
                >
                  {col}
                </div>
              ))}

              {ROWS.map((row, i) => {
                const cell = "border-b border-border px-3 py-3.5 sm:px-4";
                return (
                  <div key={row.n} className={`contents landing-demo-set landing-demo-set-${i + 1}`}>
                    <div className={`${cell} text-foreground`}>{row.n}</div>
                    <div className={`${cell} text-foreground`}>{row.kg}</div>
                    <div className={`${cell} text-foreground`}>{row.reps}</div>
                    <div className={`${cell} text-foreground`}>{row.rpe}</div>
                    <div className={`${cell} flex items-center`}>
                      <span className="landing-demo-check">Gotowe</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="relative flex flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
            <div className="flex flex-wrap items-center gap-4">
              <span className="text-sm text-muted">Przerwa</span>
              <span className="font-mono text-[28px] font-semibold tabular-nums text-foreground">
                01:24
              </span>
              <span className="min-w-[120px] flex-1">
                <span className="block h-1.5 overflow-hidden rounded-sm bg-border">
                  <span className="block h-full w-[62%] bg-accent" />
                </span>
              </span>
            </div>
            <span className="font-mono text-xs tabular-nums text-muted">
              14 z 22 serii · szacowany rekord 104,9 kg
            </span>
            <p className="landing-demo-complete absolute inset-x-4 bottom-3 text-center text-sm text-muted sm:inset-x-6">
              Trening zapisany. Widzisz go w panelu.
            </p>
          </div>
        </div>
      </div>
    </LandingReveal>
  );
}
