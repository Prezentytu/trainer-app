"use client";

import { PortalExercise } from "@/lib/api";
import { formatRest } from "@/components/ui";
import { DemoThumbButton } from "@/components/portal/DemoThumbButton";
import {
  previewBlocksFromItems,
  type PreviewItem,
  type PreviewBlock,
} from "@/lib/supersetPreview";
import { polishSetCount } from "@/lib/plural";

function ThumbGutter({
  exercise,
  fallbackYoutubeId,
  title,
}: {
  exercise?: PortalExercise;
  fallbackYoutubeId?: string | null;
  title: string;
}) {
  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center">
      <DemoThumbButton
        exercise={exercise}
        fallbackYoutubeId={fallbackYoutubeId}
        title={title}
      />
    </div>
  );
}

function ItemRow({
  item,
  label,
  exerciseById,
  fallbackYoutubeId,
  onRowClick,
}: {
  item: PreviewItem;
  label: string | null;
  exerciseById: Map<number, PortalExercise>;
  fallbackYoutubeId?: (exerciseId: number) => string | null;
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
      <ThumbGutter exercise={ex} fallbackYoutubeId={yt} title={name} />
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

function supersetMeta(block: Extract<PreviewBlock, { kind: "superset" }>): string {
  const parts: string[] = [];
  if (block.setCount > 0) parts.push(polishSetCount(block.setCount));
  if (block.restSeconds != null && block.restSeconds > 0) {
    parts.push(formatRest(block.restSeconds));
  }
  return parts.join(" · ");
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
                onRowClick={onRowClick}
              />
            </li>
          );
        }
        const meta = supersetMeta(block);
        return (
          <li key={block.key} className="py-3">
            <div className="overflow-hidden rounded-lg border border-border">
              <div className="flex items-baseline justify-between gap-3 px-3 py-2">
                <p className="font-mono text-xs font-medium uppercase tracking-caps text-muted">
                  Superseria {block.position}
                </p>
                {meta ? (
                  <p className="shrink-0 font-mono text-xs tabular-nums text-muted">{meta}</p>
                ) : null}
              </div>
              <ul className="divide-y divide-border border-t border-border">
                {block.items.map((item, idx) => (
                  <li key={String(item.id)} className="px-3">
                    <ItemRow
                      item={item}
                      label={block.labels[idx] || null}
                      exerciseById={exerciseById}
                      fallbackYoutubeId={fallbackYoutubeId}
                      onRowClick={onRowClick}
                    />
                  </li>
                ))}
              </ul>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
