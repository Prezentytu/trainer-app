import { Icon } from "@/components/Icon";
import {
  DEMO_REST_TOTAL,
  DEMO_SETS,
  DEMO_STEP_MS,
} from "./productDemo";

const PHONE_FRAME = {
  compact: "w-[240px]",
  hero: "w-full",
  default: "w-[300px]",
} as const;

/** Telefon podopiecznego — stała ramka iPhone; zegar z DualSurfaces. */
export function SessionPhone({
  clock,
  compact = false,
  size,
}: {
  clock: number;
  compact?: boolean;
  size?: keyof typeof PHONE_FRAME;
}) {
  const resolved = size ?? (compact ? "compact" : "default");
  const dense = resolved === "hero";
  const frame = PHONE_FRAME[resolved];

  const completed = Math.min(DEMO_SETS.length, Math.floor(clock / DEMO_STEP_MS));
  const frac = Math.min(1, (clock % DEMO_STEP_MS) / DEMO_STEP_MS);
  const showRest = completed > 0 && completed < DEMO_SETS.length;
  const restLeft = showRest ? Math.round(DEMO_REST_TOTAL * (1 - frac)) : DEMO_REST_TOTAL;
  const restPct = showRest ? (restLeft / DEMO_REST_TOTAL) * 100 : 0;
  const progressPct = Math.min(100, (clock / (DEMO_SETS.length * DEMO_STEP_MS)) * 100);
  const volume = DEMO_SETS.slice(0, completed).reduce((sum, s) => sum + s.kg * s.repsN, 0);

  return (
    <div
      className={`mx-auto ${frame} shrink-0`}
      role="img"
      aria-label="Podgląd telefonu podopiecznego pod imieniem trenera: trening wyciskania sztangi, cztery serie odhaczane po kolei."
    >
      <div
        aria-hidden
        className="pointer-events-none relative aspect-[393/852] select-none overflow-hidden rounded-[40px] border border-border-strong bg-surface-sunken p-2"
      >
        <div
          className={`absolute flex flex-col overflow-hidden bg-background ${
            dense ? "inset-2 rounded-[34px]" : "inset-2 rounded-[37px]"
          }`}
        >
          <span
            className={`absolute left-1/2 z-10 -translate-x-1/2 rounded-full bg-invert-bg ${
              dense ? "top-2 h-3 w-14" : "top-2.5 h-[18px] w-[78px]"
            }`}
          />

          <div
            className={`flex items-center justify-between ${
              dense ? "px-3.5 pb-0.5 pt-2.5" : "px-5 pb-1 pt-3.5"
            }`}
          >
            <span className="t-num text-[12px] text-foreground">9:41</span>
            <span className="t-num text-[12px] text-transparent">9:41</span>
          </div>

          <div className={dense ? "px-3.5 pb-2 pt-1.5" : "px-4 pb-3 pt-2"}>
            <p className="m-0 mb-1.5 font-sans text-[12px] font-medium uppercase tracking-[0.16em] text-muted">
              Plan od Adama
            </p>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p
                  className={`m-0 font-semibold leading-snug tracking-tight text-foreground ${
                    dense ? "text-[13px]" : "text-[15px]"
                  }`}
                >
                  Środa
                </p>
                <p className="mt-0.5 font-mono text-[12px] tabular-nums text-muted">
                  {completed}/{DEMO_SETS.length}
                  {" · "}
                  24:31
                  {!dense ? (
                    <span className="inline-block w-[11ch]">
                      {volume > 0
                        ? ` · ${Math.round(volume).toLocaleString("pl-PL")} kg`
                        : null}
                    </span>
                  ) : null}
                </p>
              </div>
              <span
                className={`inline-flex shrink-0 items-center rounded-[8px] bg-invert-bg font-sans text-[12px] font-semibold text-invert-fg ${
                  dense ? "h-7 px-2.5" : "h-[30px] px-3"
                }`}
              >
                Zakończ
              </span>
            </div>
            <div className="mt-2 h-0.5 overflow-hidden rounded-full bg-surface-active">
              <div
                className="h-full rounded-full bg-invert-bg transition-[width] duration-[120ms] ease-linear"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          <div className={`min-h-0 flex-1 ${dense ? "px-3.5" : "px-4"}`}>
            <h3
              className={`m-0 font-semibold tracking-tight text-foreground ${
                dense ? "mb-2 text-[14px] leading-snug" : "t-title mb-3 text-[18px]"
              }`}
            >
              Wyciskanie sztangi
            </h3>
            <SetHeader dense={dense} />
            {DEMO_SETS.map((s, i) => {
              const checked = i < completed;
              const isNext = i === completed;
              const isPr = i === DEMO_SETS.length - 1;
              return (
                <SetRow
                  key={s.n}
                  n={s.n}
                  weight={s.weight}
                  reps={s.reps}
                  checked={checked}
                  isNext={isNext}
                  isPr={isPr && checked}
                  dense={dense}
                />
              );
            })}
            {dense ? null : (
              <p className="m-0 mt-3.5 font-mono text-[12px] tabular-nums text-fg-ghost">
                Następne · Przysiad
              </p>
            )}
          </div>

          {dense ? null : (
            <div className="mt-auto border-t border-border px-3 pb-5 pt-2.5">
              <div
                className="rounded-[10px] border border-border bg-surface px-3 py-2 transition-opacity duration-[var(--dur-med)]"
                style={{ opacity: showRest ? 1 : 0 }}
              >
                <p className="m-0 font-mono text-[22px] font-bold leading-none tabular-nums text-foreground">
                  {mmss(restLeft)}
                </p>
                <p className="mt-1 text-[12px] text-muted">
                  Przerwa · seria {Math.min(DEMO_SETS.length, completed + 1)}
                </p>
                <div className="mt-1.5 h-0.5 overflow-hidden rounded-full bg-surface-active">
                  <div
                    className="h-full rounded-full bg-invert-bg"
                    style={{ width: `${restPct}%` }}
                  />
                </div>
              </div>
              <span className="mx-auto mt-2.5 block h-1 w-16 rounded-full bg-invert-bg" />
            </div>
          )}
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

function SetHeader({ dense }: { dense?: boolean }) {
  return (
    <div
      className={`grid gap-1.5 border-b border-border pb-1.5 ${
        dense
          ? "grid-cols-[14px_minmax(0,1fr)_minmax(0,1fr)_28px]"
          : "grid-cols-[20px_1fr_1fr_72px] gap-2 pb-2"
      }`}
    >
      <span className="t-label tracking-[0.1em] text-fg-ghost">#</span>
      <span className="t-label tracking-[0.1em] text-fg-ghost">kg</span>
      <span className="t-label tracking-[0.1em] text-fg-ghost">powt.</span>
      <span />
    </div>
  );
}

function SetRow({
  n,
  weight,
  reps,
  checked,
  isNext,
  isPr,
  dense,
}: {
  n: string;
  weight: string;
  reps: string;
  checked: boolean;
  isNext: boolean;
  isPr?: boolean;
  dense?: boolean;
}) {
  return (
    <div
      className={`grid items-center border-b border-border transition-colors duration-[var(--dur-med)] ${
        dense
          ? "min-h-9 grid-cols-[14px_minmax(0,1fr)_minmax(0,1fr)_28px] gap-1.5"
          : "min-h-11 grid-cols-[20px_1fr_1fr_72px] gap-2"
      } ${isNext ? "bg-surface" : ""}`}
    >
      <span className="t-num text-[12px] text-muted">{n}</span>
      <span
        className={`t-num text-[12px] transition-colors duration-[var(--dur-med)] ${
          checked ? "text-foreground" : "text-fg-ghost"
        }`}
      >
        {weight}
      </span>
      <span
        className={`t-num text-[12px] transition-colors duration-[var(--dur-med)] ${
          checked ? "text-foreground" : "text-fg-ghost"
        }`}
      >
        {reps}
      </span>
      <span className="flex items-center justify-end gap-0.5">
        {dense ? null : (
          <span
            className={`inline-flex items-center rounded-[var(--r-pill)] bg-pr-dim px-1 py-0.5 font-mono text-[12px] font-bold leading-none text-pr ${
              isPr ? "pr-celebrate-in" : "invisible"
            }`}
          >
            PR
          </span>
        )}
        <span
          key={`${n}-${checked ? "on" : "off"}`}
          className={`flex shrink-0 items-center justify-center rounded-full border leading-none ${
            dense ? "h-5 w-5 text-[12px]" : "h-[26px] w-[26px] text-[14px]"
          } ${
            checked
              ? "landing-check-in border-invert-bg bg-invert-bg text-invert-fg"
              : isNext
                ? "border-foreground text-transparent"
                : "border-border text-transparent"
          }`}
        >
          {checked ? <Icon name="check" size={dense ? 12 : 15} decorative /> : null}
        </span>
      </span>
    </div>
  );
}
