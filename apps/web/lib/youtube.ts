/** Helpery URL YouTube — ID filmu jest jedynym źródłem prawdy w bibliotece. */

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
