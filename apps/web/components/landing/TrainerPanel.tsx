import { Avatar, Marker } from "@/components/ui";
import { Icon, type IconName } from "@/components/Icon";
import { LANDING_CAPS } from "./primitives";
import { heroRowsFor } from "./productDemo";

const RAIL: { icon: IconName; label: string; active?: boolean }[] = [
  { icon: "home", label: "Panel" },
  { icon: "clients", label: "Klienci", active: true },
  { icon: "plans", label: "Plany" },
  { icon: "dumbbell", label: "Ćwiczenia" },
];

/** Panel trenera z mocka — rail ikon, lista Klientów, trzy kolumny danych. */
export function TrainerPanel({ completed }: { completed: number }) {
  const rows = heroRowsFor(completed);

  return (
    <div
      data-theme="dark"
      role="img"
      aria-label="Panel trenera: lista podopiecznych z ostatnią serią i trendem. Wiersz Michała aktualizuje się, gdy podopieczny odhacza serie."
      className="pointer-events-none h-full select-none overflow-hidden rounded-[10px] bg-background text-foreground"
    >
      <div aria-hidden className="flex h-full">
        <aside className="hidden shrink-0 flex-col items-center gap-1.5 border-r border-border bg-surface py-4 md:flex md:w-[52px] lg:w-[60px]">
          <span className="display-caps mb-3 text-[11px] text-foreground">RM</span>
          {RAIL.map((item) => (
            <span
              key={item.label}
              className={`flex h-8 w-8 items-center justify-center rounded-[var(--r-pill)] ${
                item.active ? "bg-invert-bg text-invert-fg" : "text-fg-faint"
              }`}
            >
              <Icon name={item.icon} size={16} decorative />
            </span>
          ))}
          <span className="mt-auto flex h-8 w-8 items-center justify-center rounded-[var(--r-pill)] text-fg-faint">
            <Icon name="settings" size={16} decorative />
          </span>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex shrink-0 items-baseline justify-between gap-4 border-b border-border px-4 py-3 sm:px-5">
            <p className="m-0 text-[16px] font-semibold tracking-[-0.01em] text-foreground">
              Klienci
            </p>
            <p className={`${LANDING_CAPS} m-0 hidden text-fg-ghost sm:block`}>
              Dane przykładowe · 12 aktywnych
            </p>
          </div>

          <div className="hidden shrink-0 items-center gap-4 border-b border-border px-4 py-2 sm:px-5 lg:flex">
            <span className={`${LANDING_CAPS} min-w-0 flex-1 text-fg-faint`}>Podopieczny</span>
            <span className={`${LANDING_CAPS} w-[124px] whitespace-nowrap text-right text-fg-faint`}>
              Ostatnia seria
            </span>
            <span className={`${LANDING_CAPS} w-[92px] text-right text-fg-faint`}>Trend</span>
          </div>

          <ul className="m-0 flex min-h-0 flex-1 list-none flex-col overflow-hidden p-0">
            {rows.map((row) => (
              <li
                key={row.name}
                className={`flex min-h-[52px] shrink-0 items-center gap-3 border-b border-border px-4 py-2 last:border-b-0 sm:px-5 lg:min-h-0 lg:flex-1 lg:py-0 ${
                  row.live ? "bg-surface" : ""
                }`}
              >
                <Avatar name={row.name} size="sm" />
                <span className="grid min-w-0 flex-1 gap-0.5">
                  <span className="break-words text-[13px] font-medium leading-snug text-foreground">
                    {row.name}
                  </span>
                  <span className="text-[12px] leading-snug text-muted">{row.sub}</span>
                </span>
                <span className="flex shrink-0 items-center gap-2 lg:gap-4">
                  <span className="t-num hidden w-auto whitespace-nowrap text-right text-[12px] tabular-nums text-foreground-secondary sm:block lg:w-[124px]">
                    {row.value ? (
                      <span key={row.value} className="landing-live-value">
                        {row.value}
                      </span>
                    ) : (
                      <span className="text-fg-ghost">—</span>
                    )}
                  </span>
                  <span className="flex justify-end whitespace-nowrap lg:w-[92px]">
                    {row.mark ? (
                      <span key={row.mark} className="landing-live-value">
                        <Marker tone={row.tone}>{row.mark}</Marker>
                      </span>
                    ) : null}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
