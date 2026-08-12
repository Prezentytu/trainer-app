"use client";

import { useState } from "react";
import { Button, Dialog } from "@/components/ui";
import { ExerciseThumb } from "@/components/ExerciseThumb";
import { YoutubeLite } from "@/components/YoutubeLite";
import { demoMedia } from "@/lib/youtube";

type ExerciseMediaSource = {
  media?: { youtubeId: string; seconds?: number | null; kind?: string }[] | null;
  category?: string | null;
} | null;

/** Miniatura 44px — otwiera film w dialogu. Bez autoplay na liście. */
export function DemoThumbButton({
  exercise,
  fallbackYoutubeId,
  title,
}: {
  exercise?: ExerciseMediaSource;
  fallbackYoutubeId?: string | null;
  title: string;
}) {
  const [open, setOpen] = useState(false);
  const thumb = demoMedia(exercise);
  const youtubeId = thumb.youtubeId ?? fallbackYoutubeId ?? null;
  if (!youtubeId) return null;

  return (
    <>
      <button
        type="button"
        aria-label={`Film: ${title}`}
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
        className="h-11 w-11 shrink-0 overflow-hidden rounded-lg focus-visible:outline-none focus-visible:shadow-[var(--focus-ring)] active:scale-[0.97]"
      >
        <ExerciseThumb
          youtubeId={youtubeId}
          category={thumb.category}
          alt=""
          seconds={thumb.seconds}
          variant="square"
          play="always"
        />
      </button>
      <Dialog
        open={open}
        title={title}
        onCancel={() => setOpen(false)}
        footer={
          <Button variant="ghost" full onClick={() => setOpen(false)}>
            Zamknij
          </Button>
        }
        className="max-w-lg"
      >
        <YoutubeLite youtubeId={youtubeId} title={title} category={thumb.category} seconds={thumb.seconds} />
      </Dialog>
    </>
  );
}
