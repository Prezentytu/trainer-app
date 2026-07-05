// Konwencja identyfikatorów dla wielokontenerowego drag & drop (@dnd-kit): pozycje ćwiczeń
// używają swojego klucza (item.key) jako id sortowalnego elementu, a każdy dzień ma osobny
// identyfikator "kontenera" na potrzeby upuszczenia na pusty dzień (useDroppable).
export const dayContainerId = (dayKey: string): string => `day-container:${dayKey}`;

export function isDayContainerId(id: string): boolean {
  return id.startsWith("day-container:");
}

export function dayKeyFromContainerId(id: string): string {
  return id.slice("day-container:".length);
}
