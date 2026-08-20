import { Icon } from "@/components/Icon";
import { DEMO_REST_TOTAL, DEMO_SETS, DEMO_STEP_MS } from "./productDemo";

const SET_GRID = "grid-cols-[14px_minmax(0,1fr)_minmax(0,1fr)_26px] gap-2";

/** Telefon podopiecznego z mocka — szerokość ustala rodzic, proporcje stałe. */
export function SessionPhone({ clock }: { clock: number }) {
  const completed = Math.min(DEMO_SETS.length, Math.floor(clock / DEMO_STEP_MS));
  const frac = Math.min(1, (clock % DEMO_STEP_MS) / DEMO_STEP_MS);
  const finished = completed >= DEMO_SETS.length;
  const showRest = completed > 0 && !finished;
  const restLeft = showRest ? Math.round(DEMO_REST_TOTAL * (1 - frac)) : DEMO_REST_TOTAL;
  const restPct = showRest ? (restLeft / DEMO_REST_TOTAL) * 100 : 100;
  const progressPct = Math.min(100, (completed / DEMO_SETS.length) * 100);

  return (
    <div
      role="img"
      aria-label="Telefon podopiecznego: plan od Adama, cztery serie wyciskania odhaczane po kolei."
      className="w-full"
    >
      <div
        aria-hidden
        className="pointer-events-none relative aspect-[320/694] select-none overflow-hidden rounded-[26px] bg-invert-bg p-[5px]"
      >
        <div
          data-theme="light"
          className="absolute inset-[5px] flex flex-col overflow-hidden rounded-[22px] bg-background text-foreground"
        >
          <span className="absolute left-1/2 top-2 z-10 h-2.5 w-12 -translate-x-1/2 rounded-full bg-invert-bg" />

          <div className="flex shrink-0 items-center justify-between px-3.5 pb-0.5 pt-2.5">
            <span className="t-num text-[12px] text-foreground">9:41</span>
            <span className="flex items-center gap-1 text-foreground">
              <Icon name="cell-signal-full" size={12} decorative />
              <Icon name="battery-high" size={13} decorative />
            </span>
          </div>

          <div className="shrink-0 border-b border-border px-3.5 pb-3 pt-2">
            <p className="m-0 mb-1.5 font-mono text-[12px] font-medium uppercase tracking-[0.1em] text-muted">
              Plan od Adama
            </p>
            <div className="flex items-end justify-between gap-2">
              <div className="min-w-0">
                <p className="m-0 whitespace-nowrap text-[14px] font-semibold leading-tight tracking-[-0.02em] text-foreground">
                  Środa · Push
                </p>
                <p className="t-num m-0 mt-1 whitespace-nowrap text-[12px] tabular-nums text-muted">
                  {completed}/{DEMO_SETS.length} · 24:31
                </p>
              </div>
              <span className="inline-flex h-7 shrink-0 items-center rounded-[var(--r-pill)] bg-invert-bg px-2.5 text-[12px] font-semibold text-invert-fg">
                Zakończ
              </span>
            </div>
            <div className="mt-2.5 h-[3px] overflow-hidden rounded-full bg-surface-active">
              <div
                className="h-full rounded-full bg-invert-bg transition-[width] duration-[var(--dur-med)] ease-linear"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          <div className="min-h-0 flex-1 px-3.5 pt-3">
            <h3 className="m-0 mb-2 text-[14px] font-semibold leading-snug tracking-[-0.01em] text-foreground">
              Wyciskanie sztangi
            </h3>
            <div className={`grid ${SET_GRID} border-b border-border pb-1.5`}>
              <span className="t-label text-[12px] text-fg-ghost">#</span>
              <span className="t-label text-[12px] text-fg-ghost">kg</span>
              <span className="t-label text-[12px] text-fg-ghost">powt.</span>
              <span />
            </div>
            {DEMO_SETS.map((set, i) => (
              <SetRow
                key={set.n}
                n={set.n}
                weight={set.weight}
                reps={set.reps}
                checked={i < completed}
                isNext={i === completed}
              />
            ))}
          </div>

          <div className="mt-auto shrink-0 px-3.5 pt-3">
            <div
              className="rounded-[10px] border border-border bg-surface px-3 py-2 transition-opacity duration-[var(--dur-med)]"
              style={{ opacity: showRest || finished ? 1 : 0 }}
            >
              <p className="t-num m-0 text-[18px] leading-none tabular-nums text-foreground">
                {finished ? "24:31" : mmss(restLeft)}
              </p>
              <p className="m-0 mt-1 text-[12px] leading-none text-muted">
                {finished ? "Trening skończony" : `Przerwa · seria ${completed + 1}`}
              </p>
              <div className="mt-2 h-[3px] overflow-hidden rounded-full bg-surface-active">
                <div
                  className="h-full rounded-full bg-invert-bg"
                  style={{ width: `${restPct}%` }}
                />
              </div>
            </div>
          </div>

          <div className="flex shrink-0 justify-center px-3.5 pb-3 pt-3">
            <div className="flex items-center gap-1 rounded-[var(--r-pill)] border border-border p-1">
              <span className="flex h-7 w-7 items-center justify-center rounded-[var(--r-pill)] bg-invert-bg text-invert-fg">
                <Icon name="dumbbell" size={15} decorative />
              </span>
              <span className="flex h-7 w-7 items-center justify-center rounded-[var(--r-pill)] text-muted">
                <Icon name="progress" size={15} decorative />
              </span>
              <span className="flex h-7 w-7 items-center justify-center rounded-[var(--r-pill)] text-muted">
                <Icon name="settings" size={15} decorative />
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function mmss(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.max(0, seconds) % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function SetRow({
  n,
  weight,
  reps,
  checked,
  isNext,
}: {
  n: string;
  weight: string;
  reps: string;
  checked: boolean;
  isNext: boolean;
}) {
  const cell = `t-num text-[12px] tabular-nums transition-colors duration-[var(--dur-med)] ${
    checked ? "text-foreground" : "text-fg-ghost"
  }`;
  return (
    <div
      className={`grid ${SET_GRID} min-h-8 items-center border-b border-border transition-colors duration-[var(--dur-med)] ${
        isNext ? "bg-surface" : ""
      }`}
    >
      <span className="t-num text-[12px] text-muted">{n}</span>
      <span className={cell}>{weight}</span>
      <span className={cell}>{reps}</span>
      <span className="flex justify-end">
        <span
          key={`${n}-${checked ? "on" : "off"}`}
          className={`flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border leading-none ${
            checked
              ? "landing-check-in border-invert-bg bg-invert-bg text-invert-fg"
              : isNext
                ? "border-foreground"
                : "border-border"
          }`}
        >
          {checked ? <Icon name="check" size={12} decorative /> : null}
        </span>
      </span>
    </div>
  );
}
