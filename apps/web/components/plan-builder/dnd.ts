// Konwencja identyfikatorów dla wielokontenerowego drag & drop (@dnd-kit):
// ćwiczenie = item.key, dzień (lista) = day-container:, pigułka dnia = day-pill:, tydzień = week:N.

export const dayContainerId = (dayKey: string): string => `day-container:${dayKey}`;

export function isDayContainerId(id: string): boolean {
  return id.startsWith("day-container:");
}

export function dayKeyFromContainerId(id: string): string {
  return id.slice("day-container:".length);
}

export const weekChipId = (week: number): string => `week:${week}`;

export function isWeekChipId(id: string): boolean {
  return id.startsWith("week:");
}

export function weekFromChipId(id: string): number {
  return Number(id.slice("week:".length));
}

export const dayPillId = (dayKey: string): string => `day-pill:${dayKey}`;

export function isDayPillId(id: string): boolean {
  return id.startsWith("day-pill:");
}

export function dayKeyFromPillId(id: string): string {
  return id.slice("day-pill:".length);
}
