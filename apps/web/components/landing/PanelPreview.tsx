import { LandingReveal } from "./LandingReveal";

const HEADER_COLS = ["Set", "Kg", "Powt.", "Rpe", ""];

const ROWS = [
  { n: "01", kg: "82.5", reps: "8", rpe: "7", status: "done" as const },
  { n: "02", kg: "82.5", reps: "8", rpe: "8", status: "done" as const },
  { n: "03", kg: "82.5", reps: "—", rpe: "—", status: "next" as const },
];

export function PanelPreview() {
  return (
    <LandingReveal as="section" className="px-5 pb-16 sm:px-6 sm:pb-24">
      <div className="mx-auto max-w-6xl" aria-label="Podgląd produktu">
        <div className="landing-demo mx-auto max-w-[880px] overflow-hidden rounded-t-xl border border-b-0 border-border-strong bg-surface">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-5">
            <span className="font-mono text-[11px] uppercase tracking-caps text-muted">
              [ Session_tracker ]
            </span>
            <span className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-caps text-muted">
              <span className="acid-tick inline-block h-1.5 w-1.5 rounded-full bg-accent" aria-hidden />
              Maya-k · Push A · Live
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-4 sm:px-5">
            <h3 className="display-caps text-[22px] text-foreground">Bench press</h3>
            <p className="font-mono text-[13px] uppercase tracking-caps text-muted">
              Cel: 4×8 @ 82.5 kg · Rest 90s
            </p>
          </div>

          <div
            className="grid font-mono text-[13px] tabular-nums"
            style={{ gridTemplateColumns: "56px 1fr 1fr 1fr 90px" }}
          >
            {HEADER_COLS.map((col, i) => (
              <div
                key={`h-${i}`}
                className="border-b border-border px-3 py-2.5 text-[10px] uppercase tracking-caps text-muted sm:px-4"
              >
                {col}
              </div>
            ))}

            {ROWS.map((row, i) => {
              const isNext = row.status === "next";
              const isDone = row.status === "done";
              const cell = isNext
                ? "border-b border-dashed border-border-strong bg-surface-sunken px-3 py-3 sm:px-4"
                : "border-b border-border px-3 py-3 sm:px-4";
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
                      <span className="landing-demo-check text-muted">Done</span>
                    ) : (
                      <span className="inline-flex rounded-[5px] bg-accent px-3 py-1.5 font-display text-[11px] font-black uppercase text-accent-foreground">
                        Log
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-3.5 sm:px-5">
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
              Rest_timer
            </span>
            <span className="font-mono text-[28px] font-semibold tabular-nums text-foreground">
              01:24
            </span>
            <span className="min-w-[120px] flex-1">
              <span className="block h-1.5 overflow-hidden rounded-sm bg-border">
                <span className="block h-full w-[62%] bg-accent" />
              </span>
            </span>
            <span className="font-mono text-[11px] uppercase tracking-caps text-muted">
              14/22 setów · Est. 1rm 104.9{" "}
              <span className="text-pr">★ Pr</span>
            </span>
          </div>
        </div>
        <p className="mt-4 text-center font-mono text-[11px] uppercase tracking-caps text-muted">
          Widok klienta · Serie na żywo
        </p>
      </div>
    </LandingReveal>
  );
}
