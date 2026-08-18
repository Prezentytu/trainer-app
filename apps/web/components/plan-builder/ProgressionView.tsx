import { formatLoadDisplay } from "@/lib/weight";
import { splitExerciseName } from "@/lib/exerciseName";
import { BuilderDay, BuilderItem } from "./types";

function topLoad(item: BuilderItem): string | null {
  const prescribed = item.prescribedSets ?? [];
  const top =
    prescribed.find((s) => s.role === "top") ??
    [...prescribed].reverse().find((s) => s.loadKg != null) ??
    null;
  const kg = top?.loadKg ?? item.loadKg;
  if (kg == null) {
    if (item.sets != null && item.reps != null) return `${item.sets}×${item.reps}`;
    return null;
  }
  const reps = top?.reps ?? item.reps;
  const load = kg === 0 ? "BW" : formatLoadDisplay(kg);
  return reps != null ? `${load} × ${reps}` : load;
}

function itemLine(item: BuilderItem): string {
  const load = topLoad(item);
  const { primary } = splitExerciseName(item.exerciseName);
  return load ? `${primary} · ${load}` : primary;
}

/** Te same dni (order) z tygodni obok siebie — widać, czy progresja ma sens. */
export function ProgressionView({ days }: { days: BuilderDay[] }) {
  const weeks = [...new Set(days.map((d) => d.weekNumber))].sort((a, b) => a - b);
  const orders = [...new Set(days.map((d) => d.order))].sort((a, b) => a - b);

  if (days.length === 0) {
    return (
      <p className="px-1 py-8 text-sm text-muted">Dodaj dni, żeby zestawić progresję między tygodniami.</p>
    );
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
      <div className="space-y-8 pb-8">
        {orders.map((order) => {
          const byWeek = new Map(
            days.filter((d) => d.order === order).map((d) => [d.weekNumber, d]),
          );
          const label =
            [...byWeek.values()].find((d) => d.label.trim())?.label || `Dzień ${order}`;
          return (
            <section key={order} className="px-1">
              <h2 className="t-heading break-words text-foreground">{label}</h2>
              <div className="mt-3 flex flex-col gap-4 md:flex-row md:overflow-x-auto md:pb-1">
                {weeks.map((week) => {
                  const day = byWeek.get(week);
                  return (
                    <div
                      key={week}
                      className="min-w-0 w-full md:w-72 md:shrink-0"
                    >
                      <p className="t-label text-muted">T{week}</p>
                      {day && day.items.length > 0 ? (
                        <ul className="mt-2 divide-y divide-border border-y border-border">
                          {day.items.map((item) => (
                            <li key={item.key} className="py-2">
                              <p className="break-words text-[15px] text-foreground">{itemLine(item)}</p>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-2 text-sm text-muted">Brak dnia w tym tygodniu.</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
