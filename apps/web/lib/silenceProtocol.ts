import type { AttentionItem } from "@/lib/api";

export type SilenceKind = "never" | "day7" | "day14";

export function silenceKind(item: Pick<AttentionItem, "reason" | "daysSilent">): SilenceKind {
  if (item.reason === "never_trained") return "never";
  const days = item.daysSilent ?? 0;
  if (days >= 14) return "day14";
  return "day7";
}

export function silenceLabel(kind: SilenceKind): string {
  if (kind === "never") return "Pierwszy trening";
  if (kind === "day14") return "Wracamy";
  return "Ten tydzień";
}

export function silenceMessage(kind: SilenceKind, name: string, portalUrl: string): string {
  const first = name.trim().split(/\s+/)[0] || "Cześć";
  if (kind === "never") {
    return `Cześć ${first}. Twój plan jest pod tym linkiem — otwierasz w przeglądarce, bez konta. Wystarczy odhaczyć serie na pierwszym treningu:\n${portalUrl}`;
  }
  if (kind === "day14") {
    return `Cześć ${first}. Nie widziałem treningu od dwóch tygodni. Jak wrócisz, zacznij od lżejszego dnia — plan nadal czeka pod tym samym linkiem:\n${portalUrl}`;
  }
  return `Cześć ${first}. Jak idzie z planem w tym tygodniu? Jeśli coś nie pasuje na siłowni — napisz, podmienimy ćwiczenie.\n${portalUrl}`;
}

export function canWriteSilence(item: AttentionItem | null | undefined): boolean {
  if (!item) return false;
  return (
    item.reason === "silent" ||
    item.reason === "never_trained" ||
    item.action === "copy_portal_link"
  );
}
