import { ApiError } from "@/lib/api";

export type HistoryImportWaitPhase = "compress" | "read";

function polishPlural(n: number, one: string, few: string, many: string): string {
  const abs = Math.abs(n) % 100;
  const last = abs % 10;
  if (abs === 1) return one;
  if (last >= 2 && last <= 4 && (abs < 12 || abs > 14)) return few;
  return many;
}

export function formatWaitClock(seconds: number): string {
  const m = Math.floor(Math.max(0, seconds) / 60);
  const s = Math.max(0, seconds) % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/** Poniżej limitu Azure ARR (~230 s), z zapasem na 10–15 screenów. */
export function historyImportTimeoutMs(imageCount: number): number {
  if (imageCount <= 0) return 60_000;
  return Math.min(180_000, 90_000 + imageCount * 8_000);
}

export function historyImportWaitCopy(input: {
  phase: HistoryImportWaitPhase;
  imageCount: number;
  compressDone: number;
  elapsedSec: number;
}): { title: string; detail: string } {
  const { phase, imageCount, compressDone, elapsedSec } = input;
  if (phase === "compress") {
    if (imageCount <= 1) {
      return {
        title: "Przygotowuję zdjęcie",
        detail: "Zmniejszam zdjęcie — zaraz zacznę czytać treningi.",
      };
    }
    return {
      title: `Przygotowuję zdjęcia — ${compressDone} z ${imageCount}`,
      detail: "Zmniejszam zdjęcia — zaraz zacznę czytać treningi.",
    };
  }

  if (imageCount === 0) {
    return {
      title: "Czytam treningi z tekstu",
      detail: elapsedSec >= 25 ? "Wciąż czytam. Nie zamykaj tej karty." : "Zwykle kilkanaście sekund.",
    };
  }

  const photos = `${imageCount} ${polishPlural(imageCount, "zdjęcie", "zdjęcia", "zdjęć")}`;
  if (elapsedSec >= 70) {
    return {
      title: `Wciąż czytam ${photos}`,
      detail: "Dłużej niż zwykle. Możesz przerwać i wgrać mniej zdjęć naraz.",
    };
  }
  if (elapsedSec >= 25) {
    return {
      title: `Czytam ${photos}`,
      detail: "Przy tylu zdjęciach to normalne — nie zamykaj karty.",
    };
  }
  return {
    title: `Czytam ${photos}`,
    detail:
      imageCount >= 5
        ? "To zwykle trwa około minuty. Przed zapisem wszystko sprawdzisz."
        : "Zwykle kilkanaście sekund. Przed zapisem wszystko sprawdzisz.",
  };
}

const GENERIC_DOWN = "Serwer chwilowo niedostępny. Spróbuj ponownie za chwilę.";
const WARMING = "Uruchamiamy serwer. Odśwież za chwilę.";

export function historyImportFailMessage(err: unknown, imageCount: number): string {
  const msg = err instanceof Error ? err.message : "Nie udało się odczytać treningów.";
  const status = err instanceof ApiError ? err.status : null;
  if (status != null && status >= 500) {
    if (msg && msg !== GENERIC_DOWN && msg !== WARMING) return msg;
    return imageCount > 0
      ? "Nie udało się odczytać zdjęć. Spróbuj ponownie — albo wgraj mniej zdjęć naraz."
      : "Nie udało się odczytać treningów. Spróbuj ponownie za chwilę.";
  }
  return msg;
}

export function historyImportTimeoutMessage(imageCount: number): string {
  return imageCount > 3
    ? "Odczyt trwał za długo. Wgraj mniej zdjęć naraz i spróbuj jeszcze raz."
    : "Odczyt trwał za długo. Spróbuj ponownie za chwilę.";
}
