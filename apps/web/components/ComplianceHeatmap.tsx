"use client";

/** Siatka zgodności: ostatnie N tygodni × dni tygodnia (pn–nd). Intensywność = liczba ukończonych sesji. */

function startOfWeekMonday(d: Date): Date {
  const day = d.getDay(); // 0=nd
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setHours(12, 0, 0, 0);
  monday.setDate(monday.getDate() + diff);
  return monday;
}

function toIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const DAY_LABELS = ["Pn", "Wt", "Śr", "Cz", "Pt", "So", "Nd"];

export function ComplianceHeatmap({
  dates,
  weeks = 8,
  title = "Aktywność treningowa",
}: {
  /** Daty ukończonych sesji (ISO YYYY-MM-DD). */
  dates: string[];
  weeks?: number;
  title?: string;
}) {
  const counts = new Map<string, number>();
  for (const iso of dates) {
    counts.set(iso, (counts.get(iso) ?? 0) + 1);
  }

  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const thisMonday = startOfWeekMonday(today);
  const start = new Date(thisMonday);
  start.setDate(start.getDate() - (weeks - 1) * 7);

  const grid: { iso: string; count: number; future: boolean }[][] = [];
  for (let w = 0; w < weeks; w++) {
    const col: { iso: string; count: number; future: boolean }[] = [];
    for (let d = 0; d < 7; d++) {
      const cell = new Date(start);
      cell.setDate(start.getDate() + w * 7 + d);
      const iso = toIso(cell);
      const future = cell.getTime() > today.getTime();
      col.push({ iso, count: future ? 0 : (counts.get(iso) ?? 0), future });
    }
    grid.push(col);
  }

  const max = Math.max(1, ...[...counts.values()]);
  const total = dates.length;

  const cellClass = (count: number, future: boolean) => {
    if (future) return "bg-surface-sunken opacity-40";
    if (count === 0) return "bg-surface-active";
    const t = count / max;
    if (t <= 0.34) return "bg-accent-dim";
    if (t <= 0.67) return "bg-accent-border";
    return "bg-accent";
  };

  return (
    <div className="min-w-0">
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <h3 className="font-display text-sm font-semibold text-foreground">{title}</h3>
        <span className="font-mono text-xs tabular-nums text-muted">
          {total} sesji · {weeks} tyg.
        </span>
      </div>
      {total === 0 ? (
        <p className="mb-3 text-sm text-muted">
          Brak ukończonych sesji w tym okresie — zaloguj pierwszą sesję u klienta, żeby zobaczyć zgodność.
        </p>
      ) : null}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        <div className="flex shrink-0 flex-col justify-around gap-1 pr-1">
          {DAY_LABELS.map((l) => (
            <span key={l} className="h-3 text-xs leading-3 text-muted-faint">
              {l}
            </span>
          ))}
        </div>
        <div className="flex gap-1">
          {grid.map((col, wi) => (
            <div key={wi} className="flex flex-col gap-1">
              {col.map((cell) => (
                <div
                  key={cell.iso}
                  title={cell.future ? cell.iso : `${cell.iso}: ${cell.count} trening(i)`}
                  className={`h-3 w-3 rounded-[3px] ${cellClass(cell.count, cell.future)}`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="mt-2 flex items-center gap-1.5 text-xs text-muted">
        <span>mniej</span>
        <span className="h-2.5 w-2.5 rounded-[2px] bg-surface-active" />
        <span className="h-2.5 w-2.5 rounded-[2px] bg-accent-dim" />
        <span className="h-2.5 w-2.5 rounded-[2px] bg-accent-border" />
        <span className="h-2.5 w-2.5 rounded-[2px] bg-accent" />
        <span>więcej</span>
      </div>
    </div>
  );
}
