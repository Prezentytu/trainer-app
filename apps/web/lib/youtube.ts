/** Helpery URL YouTube — ID filmu jest jedynym źródłem prawdy w bibliotece. */

/** Pierwsze media demo (albo dowolne) — do miniaturek w listach. */
export function demoMedia(exercise?: {
  media?: { youtubeId: string; seconds?: number | null; kind?: string }[] | null;
  category?: string | null;
} | null): { youtubeId?: string; category?: string | null; seconds?: number | null } {
  if (!exercise) return {};
  const m = exercise.media?.find((x) => x.kind === "demo") ?? exercise.media?.[0];
  return { youtubeId: m?.youtubeId, category: exercise.category, seconds: m?.seconds ?? null };
}

export function thumbUrl(youtubeId: string, quality: "hqdefault" | "mqdefault" | "sddefault" = "hqdefault"): string {
  return `https://i.ytimg.com/vi/${youtubeId}/${quality}.jpg`;
}

export function embedUrl(youtubeId: string): string {
  return `https://www.youtube-nocookie.com/embed/${youtubeId}?rel=0&modestbranding=1`;
}

export function watchUrl(youtubeId: string): string {
  return `https://www.youtube.com/watch?v=${youtubeId}`;
}

export function formatVideoSeconds(seconds: number | null | undefined): string {
  if (seconds == null || seconds < 0) return "";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

const YOUTUBE_ID_RE = /^[\w-]{11}$/;

/**
 * Wyciąga ID filmu z pełnego URL (watch?v=, youtu.be, shorts, embed)
 * albo zwraca samo ID, gdy użytkownik wkleił 11-znakowy identyfikator.
 */
export function parseYoutubeId(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (YOUTUBE_ID_RE.test(trimmed)) return trimmed;

  try {
    const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    const url = new URL(withProtocol);
    const host = url.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      const id = url.pathname.split("/").filter(Boolean)[0] ?? "";
      return YOUTUBE_ID_RE.test(id) ? id : null;
    }

    if (host === "youtube.com" || host === "m.youtube.com" || host === "music.youtube.com") {
      const v = url.searchParams.get("v");
      if (v && YOUTUBE_ID_RE.test(v)) return v;

      const parts = url.pathname.split("/").filter(Boolean);
      // /embed/ID, /shorts/ID, /live/ID, /v/ID
      if (parts.length >= 2 && ["embed", "shorts", "live", "v"].includes(parts[0])) {
        const id = parts[1];
        return YOUTUBE_ID_RE.test(id) ? id : null;
      }
    }
  } catch {
    // nie-URL — nie parsujemy dalej
  }
  return null;
}
