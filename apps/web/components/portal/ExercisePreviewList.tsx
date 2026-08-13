"use client";

import { PortalExercise } from "@/lib/api";
import { DemoThumbButton } from "@/components/portal/DemoThumbButton";
import {
  previewBlocksFromItems,
  type PreviewItem,
} from "@/lib/supersetPreview";
import { demoMedia } from "@/lib/youtube";

function ItemRow({
  item,
  label,
  exerciseById,
  fallbackYoutubeId,
  showThumbs,
  onRowClick,
}: {
  item: PreviewItem;
  label: string | null;
  exerciseById: Map<number, PortalExercise>;
  fallbackYoutubeId?: (exerciseId: number) => string | null;
  showThumbs: boolean;
  onRowClick?: () => void;
}) {
  const ex = item.exerciseId != null ? exerciseById.get(item.exerciseId) : undefined;
  const yt =
    item.exerciseId != null && fallbackYoutubeId
      ? fallbackYoutubeId(item.exerciseId)
      : undefined;
  const name = label ? `${label} ${item.name}` : item.name;
  const nameBlock = (
    <div className="min-w-0 flex-1">
      <p
        className={`break-words text-[15px] font-semibold leading-snug ${
          item.done ? "text-muted" : "text-foreground"
        }`}
      >
        {name}
      </p>
      {item.notes ? (
        <p className="mt-0.5 text-[13px] leading-snug text-muted">{item.notes}</p>
      ) : null}
    </div>
  );
  const detail = (
    <p className="shrink-0 font-mono text-[15px] tabular-nums text-muted">{item.detail}</p>
  );

  return (
    <div className="flex min-h-11 items-start gap-3 py-3.5">
      {showThumbs ? (
        <div className="flex h-11 w-11 shrink-0 items-center justify-center">
          <DemoThumbButton exercise={ex} fallbackYoutubeId={yt} title={name} />
        </div>
      ) : null}
      {onRowClick ? (
        <button
          type="button"
          onClick={onRowClick}
          className="flex min-w-0 flex-1 items-start justify-between gap-3 text-left transition-colors duration-[var(--dur-fast)] hover:bg-surface-hover/40 focus-visible:outline-none focus-visible:shadow-[var(--focus-ring)] active:scale-[0.99]"
        >
          {nameBlock}
          {detail}
        </button>
      ) : (
        <>
          {nameBlock}
          {detail}
        </>
      )}
    </div>
  );
}

export function ExercisePreviewList({
  items,
  exerciseById,
  fallbackYoutubeId,
  onRowClick,
}: {
  items: PreviewItem[];
  exerciseById: Map<number, PortalExercise>;
  fallbackYoutubeId?: (exerciseId: number) => string | null;
  onRowClick?: () => void;
}) {
  const blocks = previewBlocksFromItems(items);

  if (blocks.length === 0) return null;

  // Gutter miniatur to własność listy, nie wiersza — inaczej nazwy wiszą na pustym wcięciu.
  const showThumbs = items.some((item) => {
    if (item.exerciseId == null) return false;
    const fromLibrary = demoMedia(exerciseById.get(item.exerciseId)).youtubeId;
    return Boolean(fromLibrary ?? fallbackYoutubeId?.(item.exerciseId));
  });

  return (
    <ul className="divide-y divide-border">
      {blocks.map((block) => {
        if (block.kind === "single") {
          return (
            <li key={block.key}>
              <ItemRow
                item={block.item}
                label={block.label}
                exerciseById={exerciseById}
                fallbackYoutubeId={fallbackYoutubeId}
                showThumbs={showThumbs}
                onRowClick={onRowClick}
              />
            </li>
          );
        }
        return (
          <li key={block.key}>
            <p className="pt-3 font-mono text-xs font-medium uppercase tracking-caps text-muted">
              Superseria
            </p>
            <ul className="divide-y divide-border">
              {block.items.map((item, idx) => (
                <li key={String(item.id)}>
                  <ItemRow
                    item={item}
                    label={block.labels[idx] || null}
                    exerciseById={exerciseById}
                    fallbackYoutubeId={fallbackYoutubeId}
                    showThumbs={showThumbs}
                    onRowClick={onRowClick}
                  />
                </li>
              ))}
            </ul>
          </li>
        );
      })}
    </ul>
  );
}
