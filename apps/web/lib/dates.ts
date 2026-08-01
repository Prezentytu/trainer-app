/** Wspólne helpery dat ISO (YYYY-MM-DD) — lista i profil klienta. */

export function daysAgo(iso: string): number {
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return 0;
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  return Math.max(0, Math.round((today.getTime() - d.getTime()) / 86400000));
}

export function relativeDayLabel(iso: string): string {
  const n = daysAgo(iso);
  if (n === 0) return "dziś";
  if (n === 1) return "wczoraj";
  if (n < 7) return `${n} dni temu`;
  if (n < 14) return "tydzień temu";
  return `${n} dni temu`;
}

export function formatDayShort(iso: string): string {
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("pl-PL", { day: "numeric", month: "short" });
}

export function withinLastDays(iso: string, days: number): boolean {
  return daysAgo(iso) <= days;
}
