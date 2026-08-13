"use client";

import { Icon } from "@/components/Icon";
import { polishTrainingCount } from "@/lib/plural";
import {
  type WeekStripDay,
  weekStripDayClickable,
} from "@/lib/portalWeekStrip";

function slotAriaLabel(d: WeekStripDay): string {
  const date = new Date(`${d.iso}T12:00:00`);
  const when = Number.isNaN(date.getTime())
    ? d.iso
    : date.toLocaleDateString("pl-PL", {
        weekday: "long",
        day: "numeric",
        month: "long",
      });
  const parts = [when];
  if (d.today) parts.push("dziś");
  if (d.sessions.length > 0) parts.push(polishTrainingCount(d.sessions.length));
  else if (d.hasPlanDay && d.planDay?.label) parts.push(`zaplanowany: ${d.planDay.label}`);
  else parts.push("wolny dzień");
  return parts.join(", ");
}

function markerClass(d: WeekStripDay): string {
  if (d.done) return "bg-surface-active text-foreground";
  if (d.today) return "border border-dashed border-border-strong text-muted";
  if (d.hasPlanDay) return "border border-border text-muted";
  return "border border-border text-muted-faint";
}

export function WeekStrip({
  days,
  selectedIso,
  onSelect,
}: {
  days: WeekStripDay[];
  selectedIso?: string | null;
  onSelect: (day: WeekStripDay) => void;
}) {
  return (
    <section aria-label="Tydzień" className="grid grid-cols-7 gap-1">
      {days.map((d) => {
        const clickable = weekStripDayClickable(d);
        const selected = selectedIso === d.iso;
        return (
          <button
            key={d.iso}
            type="button"
            disabled={!clickable}
            aria-label={slotAriaLabel(d)}
            aria-pressed={selected}
            onClick={() => {
              if (clickable) onSelect(d);
            }}
            className={`flex min-h-11 min-w-0 flex-col items-center gap-1 rounded-lg py-1 transition-[transform,opacity,background-color] duration-[var(--dur-fast)] ease-[var(--ease-out)] focus-visible:outline-none focus-visible:shadow-[var(--focus-ring)] ${
              clickable
                ? "hover:bg-surface-hover/40 active:scale-[0.97]"
                : "cursor-default opacity-70"
            } ${selected ? "bg-surface-hover/60" : ""}`}
          >
            <span
              className={`font-mono text-xs font-medium uppercase tracking-caps ${
                d.today ? "text-foreground-secondary" : "text-muted-faint"
              }`}
            >
              {d.label}
            </span>
            <span
              className={`font-mono text-[13px] tabular-nums ${
                d.today ? "text-foreground" : "text-muted"
              }`}
            >
              {d.dayOfMonth}
            </span>
            <span
              className={`flex h-8 w-8 items-center justify-center rounded-full ${markerClass(d)}`}
            >
              {d.done ? (
                <Icon name="check" size={16} decorative />
              ) : d.today || d.hasPlanDay ? (
                <span className="h-1 w-1 rounded-full bg-current" aria-hidden />
              ) : null}
            </span>
          </button>
        );
      })}
    </section>
  );
}
