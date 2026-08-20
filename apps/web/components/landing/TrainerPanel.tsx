import { Avatar, Marker } from "@/components/ui";
import { Icon, type IconName } from "@/components/Icon";
import { heroRowsFor } from "./productDemo";

const RAIL: { icon: IconName; label: string; active?: boolean }[] = [
  { icon: "home", label: "Panel" },
  { icon: "chat", label: "Od klientów" },
  { icon: "clients", label: "Klienci", active: true },
  { icon: "plans", label: "Plany" },
  { icon: "dumbbell", label: "Ćwiczenia" },
];

/** Panel trenera — pełny ekran 16:10 od desktopu; naturalna wysokość na mobile. */
export function TrainerPanel({ completed }: { completed: number }) {
  const rows = heroRowsFor(completed);

  return (
    <div
      data-theme="dark"
      role="img"
      aria-label="Panel trenera: lista podopiecznych. Wiersz Michała aktualizuje się, gdy podopieczny odhacza serie."
      className="pointer-events-none select-none overflow-hidden rounded-[16px] border border-border bg-background text-foreground lg:aspect-[16/10]"
    >
      <div aria-hidden className="flex h-full">
        <aside className="hidden shrink-0 flex-col border-r border-border bg-surface md:flex md:w-12 lg:w-44">
          <div className="border-b border-border px-2.5 py-3.5 lg:px-4">
            <p className="display-caps m-0 text-center text-[11px] text-foreground lg:text-left">
              <span className="lg:hidden">RM</span>
              <span className="hidden lg:inline">RepMaxer</span>
            </p>
          </div>
          <nav className="flex flex-col gap-0.5 px-1.5 py-3 lg:px-2">
            {RAIL.map((item) => (
              <span
                key={item.label}
                className={`mx-auto flex h-8 w-8 items-center justify-center rounded-[var(--r-pill)] lg:mx-0 lg:h-auto lg:w-auto lg:justify-start lg:gap-2.5 lg:px-2.5 lg:py-2 ${
                  item.active ? "bg-invert-bg text-invert-fg" : "text-fg-faint"
                }`}
              >
                <Icon name={item.icon} size={16} decorative />
                <span className="hidden text-[13px] font-medium lg:inline">{item.label}</span>
              </span>
            ))}
          </nav>
          <div className="mt-auto flex items-center justify-center gap-2 border-t border-border px-2 py-3 lg:justify-start lg:px-4">
            <Avatar name="Adam" size="sm" />
            <span className="hidden text-[13px] text-muted lg:inline">Adam</span>
          </div>
        </aside>
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="border-b border-border px-5 py-3.5 lg:px-6">
            <div>
              <p className="t-heading m-0">Klienci</p>
              <p className="mt-1 hidden text-[13px] text-muted lg:block">
                {rows.length} podopiecznych
              </p>
            </div>
          </div>
          <ul className="m-0 flex flex-1 list-none flex-col p-0">
            {rows.map((row) => (
              <li
                key={row.name}
                className={`flex min-h-14 items-center gap-3 border-b border-border px-4 py-2 last:border-b-0 sm:px-5 md:py-0 lg:flex-1 lg:px-6 ${
                  row.live ? "bg-surface" : ""
                }`}
              >
                <Avatar name={row.name} size="sm" />
                <span className="grid min-w-0 flex-1 gap-0.5">
                  <span className="flex min-w-0 flex-wrap items-center justify-between gap-x-3 gap-y-1 md:flex-nowrap">
                    <span className="break-words text-[14px] font-medium text-foreground">
                      {row.name}
                    </span>
                    <span className="flex shrink-0 items-center justify-end gap-2">
                      {row.value ? (
                        <span
                          key={row.value}
                          className="landing-live-value t-num text-[12px] tabular-nums text-foreground"
                        >
                          {row.value}
                        </span>
                      ) : null}
                      {row.mark ? (
                        <span key={row.mark} className="landing-live-value shrink-0">
                          <Marker tone={row.tone}>{row.mark}</Marker>
                        </span>
                      ) : null}
                    </span>
                  </span>
                  <span className="text-[12px] leading-snug text-muted">{row.sub}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
