"use client";

import { useState } from "react";
import Image from "next/image";
import { Icon } from "@/components/Icon";
import { CATEGORY_LABELS, ExerciseCategory } from "@/lib/api";
import { formatVideoSeconds, thumbUrl } from "@/lib/youtube";

type Props = {
  youtubeId?: string | null;
  category?: string | null;
  alt: string;
  seconds?: number | null;
  className?: string;
  /**
   * Overlay play:
   * - `none` — brak (domyślnie)
   * - `hover` — cichy play tylko na hover/focus (biblioteka)
   * - `always` — zawsze widoczny (YoutubeLite, gdzie miniatura *jest* odtwarzaczem)
   */
  play?: "none" | "hover" | "always";
  /**
   * `video` — landscape 16:9 (biblioteka, modal).
   * `square` — mała kwadratowa miniaturka w wierszach planu / composerze.
   */
  variant?: "video" | "square";
};

export function ExerciseThumb({
  youtubeId,
  category,
  alt,
  seconds,
  className = "",
  play = "none",
  variant = "video",
}: Props) {
  const [failed, setFailed] = useState(false);
  const src = youtubeId && !failed ? thumbUrl(youtubeId) : null;
  const catLabel =
    category && category in CATEGORY_LABELS
      ? CATEGORY_LABELS[category as ExerciseCategory]
      : null;
  const duration = variant === "video" ? formatVideoSeconds(seconds) : "";
  const square = variant === "square";

  return (
    <div
      className={`group/thumb relative overflow-hidden bg-surface-sunken ${
        square
          ? "aspect-square w-full rounded-lg"
          : "aspect-video w-full rounded-[10px]"
      } ${className}`}
    >
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={square ? "48px" : "(max-width: 640px) 100vw, (max-width: 1280px) 33vw, 25vw"}
          className="object-cover"
          onError={() => setFailed(true)}
          unoptimized
        />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-muted">
          <Icon
            name="dumbbell"
            size={square ? 16 : 28}
            className="text-muted-faint"
            decorative
          />
          {!square && catLabel ? (
            <span className="text-xs font-semibold uppercase tracking-[0.08em]">{catLabel}</span>
          ) : null}
        </div>
      )}
      {play !== "none" && src ? (
        <div
          className={`pointer-events-none absolute inset-0 flex items-center justify-center transition-opacity duration-[var(--dur-fast)] ${
            play === "hover"
              ? "bg-background/40 opacity-0 group-hover/thumb:opacity-100 group-focus-within/thumb:opacity-100"
              : "bg-background/40"
          }`}
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-background/80 text-foreground shadow-raised">
            <Icon name="play" size={16} decorative />
          </span>
        </div>
      ) : null}
      {duration ? (
        <span className="absolute bottom-1.5 right-1.5 rounded bg-background/85 px-1.5 py-0.5 font-mono text-[10px] font-semibold tabular-nums text-foreground">
          {duration}
        </span>
      ) : null}
    </div>
  );
}
