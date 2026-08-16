/** ISO: 1=poniedziałek … 7=niedziela. Lustrzane do apps/api/Scheduling.cs. */

export const WEEKDAY_NAMES = [
  "",
  "Poniedziałek",
  "Wtorek",
  "Środa",
  "Czwartek",
  "Piątek",
  "Sobota",
  "Niedziela",
] as const;

export const WEEKDAY_SHORT = ["", "pn", "wt", "śr", "czw", "pt", "sob", "nd"] as const;

export const WEEKDAY_CHIPS = [
  { iso: 1, label: "Pn" },
  { iso: 2, label: "Wt" },
  { iso: 3, label: "Śr" },
  { iso: 4, label: "Czw" },
  { iso: 5, label: "Pt" },
  { iso: 6, label: "Sob" },
  { iso: 7, label: "Nd" },
] as const;

export function isoDayOfWeek(isoDate: string): number {
  const d = new Date(`${isoDate}T12:00:00`);
  const js = d.getDay();
  return js === 0 ? 7 : js;
}

export function mondayOf(isoDate: string): string {
  const d = new Date(`${isoDate}T12:00:00`);
  const iso = isoDayOfWeek(isoDate);
  d.setDate(d.getDate() + (1 - iso));
  return toIso(d);
}

export function toIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function scheduledOn(opts: {
  weekNumber: number;
  dayOfWeek: number | null | undefined;
  startDate: string;
  cycleIndex?: number;
  weekCount?: number;
  overrideDate?: string | null;
}): string | null {
  if (opts.overrideDate) return opts.overrideDate;
  if (opts.dayOfWeek == null || opts.dayOfWeek < 1 || opts.dayOfWeek > 7) return null;
  const weeks = Math.max(1, opts.weekCount ?? 1);
  const monday = new Date(`${mondayOf(opts.startDate)}T12:00:00`);
  monday.setDate(
    monday.getDate() +
      (opts.cycleIndex ?? 0) * weeks * 7 +
      (opts.weekNumber - 1) * 7 +
      (opts.dayOfWeek - 1),
  );
  return toIso(monday);
}

export function isDefaultDayLabel(label: string, order: number): boolean {
  return new RegExp(`^Dzień\\s+${order}$`, "i").test(label.trim());
}

export function formatSchedulePreview(
  days: { weekNumber: number; order: number; dayOfWeek?: number | null; label: string }[],
  startDate: string,
): string | null {
  const weekCount = days.reduce((m, d) => Math.max(m, d.weekNumber), 0);
  const dated = days
    .map((d) => ({
      d,
      on: scheduledOn({ weekNumber: d.weekNumber, dayOfWeek: d.dayOfWeek, startDate, weekCount }),
    }))
    .filter((x): x is { d: (typeof days)[number]; on: string } => x.on != null)
    .sort((a, b) => a.on.localeCompare(b.on));
  if (dated.length === 0) return null;
  return dated
    .slice(0, 8)
    .map((x) => {
      const short = WEEKDAY_SHORT[x.d.dayOfWeek ?? 0] ?? "";
      const [, m, day] = x.on.split("-");
      return `${short} ${Number(day)}.${m}`;
    })
    .join(" · ");
}

export function formatScheduledShort(iso: string): string {
  const short = WEEKDAY_SHORT[isoDayOfWeek(iso)] ?? "";
  const [, m, day] = iso.split("-");
  return `${short} ${Number(day)}.${m}`;
}

export function formatNextDayLine(next: {
  label: string;
  scheduledOn?: string | null;
  movedFrom?: string | null;
}): string {
  const date = next.scheduledOn ? formatScheduledShort(next.scheduledOn) : null;
  const main = date ? `${next.label} · ${date}` : next.label;
  if (next.movedFrom && next.scheduledOn) {
    const to = WEEKDAY_SHORT[isoDayOfWeek(next.scheduledOn)] ?? "";
    return `${main} · przełożony z ${next.movedFrom} na ${to}`;
  }
  return main;
}

export function nearestStartForFirstDay(
  days: { weekNumber: number; dayOfWeek?: number | null }[],
  fromIso: string,
): string {
  const first = [...days]
    .filter((d) => d.weekNumber === 1 && d.dayOfWeek != null)
    .sort((a, b) => (a.dayOfWeek ?? 0) - (b.dayOfWeek ?? 0))[0];
  if (!first?.dayOfWeek) return fromIso;
  const from = isoDayOfWeek(fromIso);
  const delta = (first.dayOfWeek - from + 7) % 7;
  const d = new Date(`${fromIso}T12:00:00`);
  d.setDate(d.getDate() + delta);
  return toIso(d);
}