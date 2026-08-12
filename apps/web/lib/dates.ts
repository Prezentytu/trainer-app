/** Wspólne helpery dat ISO (YYYY-MM-DD) — lista i profil klienta. */

/**
 * Indeks dnia tygodnia (0 = poniedziałek … 6 = niedziela) z polskiej etykiety dnia planu.
 * Zwraca null, gdy etykieta nie jest dniem tygodnia (np. „Trening A”).
 */
export function weekdayIndexFromLabel(label: string | null | undefined): number | null {
  if (!label) return null;
  const raw = label.trim().toLowerCase();
  if (!raw) return null;
  // Usuń znaki diakrytyczne do prostego porównania („środa” → „sroda”).
  const norm = raw
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z]/g, "");
  if (!norm) return null;

  // Dłuższe aliasy pierwsze; krótkie kody (≤2) tylko exact — unikamy „sroda”.startsWith(„so”).
  const aliases: [string, number][] = [
    ["poniedzialek", 0],
    ["pon", 0],
    ["pn", 0],
    ["wtorek", 1],
    ["wto", 1],
    ["wt", 1],
    ["sroda", 2],
    ["sro", 2],
    ["sr", 2],
    ["czwartek", 3],
    ["czw", 3],
    ["cz", 3],
    ["piatek", 4],
    ["pia", 4],
    ["pt", 4],
    ["sobota", 5],
    ["sob", 5],
    ["sb", 5],
    ["so", 5],
    ["niedziela", 6],
    ["niedz", 6],
    ["nie", 6],
    ["nd", 6],
  ];

  for (const [alias, idx] of aliases) {
    if (norm === alias) return idx;
    if (alias.length >= 3 && norm.startsWith(alias)) return idx;
  }
  return null;
}

/** Lokalny indeks dnia tygodnia (0 = poniedziałek … 6 = niedziela). */
export function localWeekdayIndex(d: Date = new Date()): number {
  const js = d.getDay(); // 0 = niedziela
  return js === 0 ? 6 : js - 1;
}

/** Lokalne „dziś” w formacie YYYY-MM-DD (nie UTC — unika rozjazdu po północy PL). */
export function todayIsoLocal(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Relatywna etykieta dnia w dopełniaczu: „z poniedziałku”, „z wczoraj”. */
export function relativeDayFromLabel(iso: string, todayIso: string = todayIsoLocal()): string {
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return `z ${iso}`;
  const today = new Date(`${todayIso}T12:00:00`);
  const diff = Math.round((today.getTime() - d.getTime()) / 86_400_000);
  if (diff === 0) return "z dziś";
  if (diff === 1) return "z wczoraj";
  if (diff > 1 && diff < 7) {
    const weekday = d.toLocaleDateString("pl-PL", { weekday: "long" });
    return `z ${weekday}`;
  }
  return `z ${d.toLocaleDateString("pl-PL", { day: "numeric", month: "short" })}`;
}

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
