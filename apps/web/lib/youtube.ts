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
