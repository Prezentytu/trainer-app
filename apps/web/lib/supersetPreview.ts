import { formatRest } from "@/components/ui";
import { polishSetCount } from "@/lib/plural";
import { groupConsecutiveBySuperset } from "@/lib/supersets";

export type PreviewItem = {
  id: number | string;
  name: string;
  detail: string;
  supersetGroup?: number | null;
  restSeconds?: number | null;
  setCount?: number;
  done?: boolean;
  partial?: boolean;
};

export type PreviewRow = {
  key: string;
  name: string;
  detail: string;
  done: boolean;
  partial: boolean;
};

export function previewRowsFromItems(items: PreviewItem[]): PreviewRow[] {
  const groups = groupConsecutiveBySuperset(items, (it) => it.supersetGroup ?? null);
  return groups.map((g) => {
    if (!g.multi) {
      const item = g.items[0];
      return {
        key: String(item.id),
        name: item.name,
        detail: item.detail,
        done: Boolean(item.done),
        partial: Boolean(item.partial),
      };
    }
    const names = g.items
      .map((it, idx) => `${g.labels[idx] ?? ""} ${it.name}`.trim())
      .join(" → ");
    const sets = Math.max(...g.items.map((it) => it.setCount ?? 0), 0);
    const rest = g.items.find((it) => it.restSeconds != null)?.restSeconds ?? null;
    const restBit = rest != null ? formatRest(rest) : null;
    const detailParts = [
      sets > 0 ? polishSetCount(sets) : null,
      restBit,
    ].filter(Boolean);
    const allDone = g.items.every((it) => it.done);
    const anyPartial = g.items.some((it) => it.partial || it.done);
    return {
      key: `g-${g.positionNum}-${g.items.map((it) => it.id).join("-")}`,
      name: names,
      detail: allDone ? "✓" : detailParts.join(" · ") || g.items[0].detail,
      done: allDone,
      partial: !allDone && anyPartial,
    };
  });
}
