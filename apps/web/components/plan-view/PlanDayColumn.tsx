"use client";

import { PlanDay, PlanItem } from "@/lib/api";
import { EmptyState, formatRest } from "@/components/ui";
import { buildGroupLabels } from "@/lib/supersets";
import { PlanItemCard } from "./PlanItemCard";
import { dayStats } from "./summary";

type Block =
  | { kind: "single"; index: number }
  | { kind: "superset"; letter: string; indices: number[] };

/** Ciągłe pozycje z tym samym numerem grupy = jedna klamra superserii. */
function buildBlocks(items: PlanItem[], labels: Array<string | null>): Block[] {
  const blocks: Block[] = [];
  let i = 0;
  while (i < items.length) {
    const g = items[i].supersetGroup;
    if (g == null) {
      blocks.push({ kind: "single", index: i });
      i++;
      continue;
    }
    const indices: number[] = [i];
    let j = i + 1;
    while (j < items.length && items[j].supersetGroup === g) {
      indices.push(j);
      j++;
    }
    blocks.push({
      kind: "superset",
      letter: (labels[i] ?? "A").replace(/\d+$/, ""),
      indices,
    });
    i = j;
  }
  return blocks;
}

function SectionCaption({ children }: { children: string }) {
  return (
    <div className="flex items-center gap-2 px-0.5">
      <span className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-faint">
        {children}
      </span>
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}

export function PlanDayColumn({
  day,
  dayIndex,
  selectedItemId,
  panelId,
  onSelectItem,
}: {
  day: PlanDay;
  dayIndex: number;
  selectedItemId: number | null;
  panelId: string;
  onSelectItem: (itemId: number) => void;
}) {
  const stats = dayStats(day);
  const labels = buildGroupLabels(day.items.map((i) => i.supersetGroup));
  const blocks = buildBlocks(day.items, labels);
  const hasWarmup = day.items.some((i) => i.isWarmup);
  const firstMainIdx = day.items.findIndex((i) => !i.isWarmup);

  const captionsFor = (index: number) => {
    const item = day.items[index];
    const captions: string[] = [];
    if (hasWarmup && item.isWarmup && (index === 0 || !day.items[index - 1]?.isWarmup)) {
      captions.push("Rozgrzewka");
    }
    if (hasWarmup && index === firstMainIdx) captions.push("Część główna");
    return captions;
  };

  return (
    <div className="flex max-h-[70dvh] w-full shrink-0 flex-col rounded-[var(--r-card)] border border-border bg-surface md:h-full md:max-h-none md:w-auto md:min-w-[300px] md:max-w-[400px] md:flex-1 md:min-h-0 md:snap-start">
      <div className="shrink-0 border-b border-border px-3.5 pb-3 pt-3.5">
        <div className="flex min-w-0 items-baseline gap-2">
          <span className="shrink-0 font-mono text-xs font-semibold tracking-wide text-muted">
            D{dayIndex}
          </span>
          <span className="min-w-0 break-words text-sm font-semibold text-foreground">
            {day.label}
          </span>
        </div>
        <p className="mt-1 font-mono text-xs tabular-nums text-muted">{stats.line}</p>
        {day.notes ? (
          <p className="mt-1.5 break-words text-xs text-muted">{day.notes}</p>
        ) : null}
      </div>

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain p-3">
        {day.items.length === 0 ? (
          <EmptyState title="Pusty dzień" action={null}>
            Brak ćwiczeń w tym dniu.
          </EmptyState>
        ) : (
          blocks.map((block) => {
            const firstIndex = block.kind === "single" ? block.index : block.indices[0];
            const captions = captionsFor(firstIndex);
            const key = day.items[firstIndex].id;
            return (
              <div key={key} className="min-w-0 space-y-2">
                {captions.map((caption) => (
                  <SectionCaption key={caption}>{caption}</SectionCaption>
                ))}
                {block.kind === "single" ? (
                  <PlanItemCard
                    item={day.items[block.index]}
                    label={null}
                    selected={selectedItemId === day.items[block.index].id}
                    panelId={panelId}
                    onSelect={() => onSelectItem(day.items[block.index].id)}
                  />
                ) : (
                  <div className="overflow-hidden rounded-[10px] border border-border-strong">
                    <div className="flex items-baseline justify-between gap-2 border-b border-border bg-surface-raised px-3 py-1.5">
                      <span className="font-mono text-xs font-semibold uppercase tracking-[0.08em] text-muted">
                        Superseria {block.letter}
                      </span>
                      <span className="shrink-0 text-xs text-muted-faint">
                        {day.items[block.indices[0]]?.restBetweenSetsSeconds
                          ? `${formatRest(day.items[block.indices[0]].restBetweenSetsSeconds)} po superserii`
                          : "bez przerwy między ćwiczeniami"}
                      </span>
                    </div>
                    <div className="divide-y divide-border">
                      {block.indices.map((idx) => (
                        <PlanItemCard
                          key={day.items[idx].id}
                          item={day.items[idx]}
                          label={labels[idx]}
                          selected={selectedItemId === day.items[idx].id}
                          panelId={panelId}
                          onSelect={() => onSelectItem(day.items[idx].id)}
                          nested
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
