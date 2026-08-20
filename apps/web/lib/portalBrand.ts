/** Imię trenera w tytule portalu i na skrócie ekranu. */

function apiBase(): string {
  const fromEnv = process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  if (process.env.NODE_ENV === "production" && process.env.SKIP_ENV_VALIDATION !== "true") {
    throw new Error("Brak NEXT_PUBLIC_API_URL. Ustaw zmienną w Vercel i przebuduj front.");
  }
  return "http://localhost:5210";
}

export function trainerFirstName(name: string | null | undefined): string | null {
  const first = name?.trim().split(/\s+/)[0];
  return first && first.length > 0 ? first : null;
}

export function portalShortcutName(name: string | null | undefined): string {
  const first = trainerFirstName(name);
  if (!first) return "RepMaxer";
  return first.length > 12 ? first.slice(0, 12) : first;
}

export async function fetchPortalTrainerName(token: string): Promise<string | null> {
  try {
    const res = await fetch(`${apiBase()}/api/portal/${token}/pin-status`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { trainerName?: string | null };
    const name = data.trainerName?.trim();
    return name || null;
  } catch {
    return null;
  }
}
