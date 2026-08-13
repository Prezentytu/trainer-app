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
  exerciseId?: number | null;
  notes?: string | null;
};

export type PreviewBlock =
  | {
      kind: "single";
      key: string;
      item: PreviewItem;
      label: string | null;
    }
  | {
      kind: "superset";
      key: string;
      position: number;
      items: PreviewItem[];
      labels: string[];
      setCount: number;
      restSeconds: number | null;
    };

export function previewBlocksFromItems(items: PreviewItem[]): PreviewBlock[] {
  const groups = groupConsecutiveBySuperset(items, (it) => it.supersetGroup ?? null);
  return groups.map((g) => {
    if (!g.multi) {
      const item = g.items[0];
      return {
        kind: "single",
        key: String(item.id),
        item: {
          ...item,
          notes: item.notes?.trim() || null,
        },
        label: g.labels[0] ?? null,
      };
    }
    const restRaw = g.items.find((it) => it.restSeconds != null)?.restSeconds ?? null;
    return {
      kind: "superset",
      key: `g-${g.positionNum}-${g.items.map((it) => it.id).join("-")}`,
      position: g.positionNum,
      items: g.items.map((it) => ({
        ...it,
        notes: it.notes?.trim() || null,
      })),
      labels: g.labels.map((l) => l ?? ""),
      setCount: Math.max(...g.items.map((it) => it.setCount ?? 0), 0),
      restSeconds: restRaw != null && restRaw > 0 ? restRaw : null,
    };
  });
}
