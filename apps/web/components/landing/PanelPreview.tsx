import { LandingReveal } from "./LandingReveal";

const HEADER_COLS = ["Seria", "Ciężar", "Powt.", "RPE", ""];

const ROWS = [
  { n: "01", kg: "82,5", reps: "8", rpe: "7", status: "done" as const },
  { n: "02", kg: "82,5", reps: "8", rpe: "8", status: "done" as const },
  { n: "03", kg: "82,5", reps: "—", rpe: "—", status: "next" as const },
];

export function PanelPreview() {
  return (
    <LandingReveal as="section" className="relative px-4 pt-14 pb-8 sm:px-6 sm:pt-20 sm:pb-12">
      <div className="landing-demo-stage mx-auto max-w-5xl" aria-label="Podgląd produktu">
        <div className="landing-demo landing-demo-frame overflow-hidden rounded-xl border border-border-strong bg-surface">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3.5 sm:px-6">
            <span className="text-sm text-muted">Trening klienta</span>
            <span className="inline-flex items-center gap-2 text-sm text-muted">
              <span className="acid-tick inline-block h-1.5 w-1.5 rounded-full bg-accent" aria-hidden />
              Kasia M. · Push A · na żywo
            </span>
          </div>

          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border px-4 py-5 sm:px-6">
            <h3 className="min-w-0 flex-1 break-words display-soft text-xl text-foreground sm:text-2xl">
              Wyciskanie na ławce
            </h3>
            <p className="shrink-0 font-mono text-sm tabular-nums text-muted">
              Cel: 4×8 · 82,5 kg · przerwa 90 s
            </p>
          </div>

          <div className="overflow-x-auto">
            <div
              className="grid min-w-[520px] font-mono text-[13px] tabular-nums"
              style={{ gridTemplateColumns: "56px 1fr 1fr 1fr 96px" }}
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
                const isNext = row.status === "next";
                const isDone = row.status === "done";
                const cell = isNext
                  ? "border-b border-dashed border-border-strong bg-surface-sunken px-3 py-3.5 sm:px-4"
                  : "border-b border-border px-3 py-3.5 sm:px-4";
                return (
                  <div key={row.n} className="contents">
                    <div
                      className={`${cell} ${isDone ? "text-muted" : "text-foreground"} landing-demo-set landing-demo-set-${i + 1}`}
                    >
                      {row.n}
                    </div>
                    <div className={`${cell} ${isNext ? "text-muted" : "text-foreground"}`}>
                      {row.kg}
                    </div>
                    <div className={`${cell} ${isNext ? "text-muted" : "text-foreground"}`}>
                      {row.reps}
                    </div>
                    <div className={`${cell} ${isNext ? "text-muted" : "text-foreground"}`}>
                      {row.rpe}
                    </div>
                    <div className={`${cell} flex items-center`}>
                      {isDone ? (
                        <span className="landing-demo-check text-muted">Gotowe</span>
                      ) : (
                        <span className="inline-flex rounded-[5px] bg-accent px-3 py-1.5 text-[11px] font-semibold text-accent-foreground">
                          Zapisz
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
            <span className="text-sm text-muted">Przerwa</span>
            <span className="font-mono text-[28px] font-semibold tabular-nums text-foreground">
              01:24
            </span>
            <span className="min-w-[120px] flex-1">
              <span className="block h-1.5 overflow-hidden rounded-sm bg-border">
                <span className="block h-full w-[62%] bg-accent" />
              </span>
            </span>
            <span className="font-mono text-xs tabular-nums text-muted">
              14 z 22 serii · szacowany rekord 104,9 kg
            </span>
          </div>
        </div>
      </div>
    </LandingReveal>
  );
}
