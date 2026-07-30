"use client";

import { useState } from "react";
import Image from "next/image";
import { Dumbbell } from "lucide-react";
import { CATEGORY_LABELS, ExerciseCategory } from "@/lib/api";
import { formatVideoSeconds, thumbUrl } from "@/lib/youtube";

type Props = {
  youtubeId?: string | null;
  category?: string | null;
  alt: string;
  seconds?: number | null;
  className?: string;
  /** Pokaż przycisk play overlay. */
  showPlay?: boolean;
};

export function ExerciseThumb({
  youtubeId,
  category,
  alt,
  seconds,
  className = "",
  showPlay = false,
}: Props) {
  const [failed, setFailed] = useState(false);
  const src = youtubeId && !failed ? thumbUrl(youtubeId) : null;
  const catLabel =
    category && category in CATEGORY_LABELS
      ? CATEGORY_LABELS[category as ExerciseCategory]
      : null;
  const duration = formatVideoSeconds(seconds);

  return (
    <div
      className={`relative aspect-video w-full overflow-hidden rounded-[10px] bg-surface-sunken ${className}`}
    >
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1280px) 33vw, 25vw"
          className="object-cover"
          onError={() => setFailed(true)}
          unoptimized
        />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-muted">
          <Dumbbell className="h-7 w-7 text-muted-faint" aria-hidden />
          {catLabel ? (
            <span className="text-xs font-semibold uppercase tracking-[0.08em]">{catLabel}</span>
          ) : null}
        </div>
      )}
      {showPlay && src ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-[var(--overlay-scrim)]/30">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-sm font-bold text-accent-foreground shadow-raised">
            ▶
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
