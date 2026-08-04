"use client";

import { ReactNode, useState } from "react";
import { ExerciseThumb } from "@/components/ExerciseThumb";
import { embedUrl, watchUrl } from "@/lib/youtube";

type Props = {
  youtubeId: string;
  title: string;
  seconds?: number | null;
  category?: string | null;
  className?: string;
  /** Auto-start w trybie embed (np. po otwarciu modala). */
  autoplay?: boolean;
};

/**
 * Lite-embed: na liście tylko miniaturka; iframe ładuje się po kliknięciu.
 */
export function YoutubeLite({
  youtubeId,
  title,
  seconds,
  category,
  className = "",
  autoplay = false,
}: Props) {
  const [playing, setPlaying] = useState(autoplay);

  if (playing) {
    const src = `${embedUrl(youtubeId)}${autoplay || playing ? "&autoplay=1" : ""}`;
    return (
      <div className={`relative aspect-video w-full overflow-hidden rounded-[10px] bg-background ${className}`}>
        <iframe
          src={src}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 h-full w-full border-0"
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setPlaying(true)}
      className={`group relative block w-full text-left ${className}`}
      aria-label={`Odtwórz: ${title}`}
    >
      <ExerciseThumb
        youtubeId={youtubeId}
        category={category}
        alt={title}
        seconds={seconds}
        play="always"
      />
    </button>
  );
}

export function YoutubeExternalLink({ youtubeId, children }: { youtubeId: string; children?: ReactNode }) {
  return (
    <a
      href={watchUrl(youtubeId)}
      target="_blank"
      rel="noopener noreferrer"
      className="text-sm font-medium text-accent-text hover:text-accent-strong"
    >
      {children ?? "Otwórz w YouTube"}
    </a>
  );
}
