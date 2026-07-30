import { buildGroupLabels, computeGroupsFromLinks } from "@/lib/supersets";
import { BuilderItem } from "./types";

export type ItemBlock =
  | { kind: "single"; index: number; label: string | null }
  | { kind: "superset"; letter: string; indices: number[]; labels: string[] };

/** Grupuje pozycje dnia w bloki: samotne karty albo ciągłe superserie. */
export function buildItemBlocks(items: BuilderItem[]): ItemBlock[] {
  const groups = computeGroupsFromLinks(items.map((i) => i.linkedToNext));
  const labels = buildGroupLabels(groups);
  const blocks: ItemBlock[] = [];
  let i = 0;
  while (i < items.length) {
    const g = groups[i];
    if (g == null) {
      blocks.push({ kind: "single", index: i, label: labels[i] });
      i++;
      continue;
    }
    const indices: number[] = [i];
    let j = i + 1;
    while (j < items.length && groups[j] === g) {
      indices.push(j);
      j++;
    }
    const letter = (labels[i] ?? "A").replace(/\d+$/, "");
    blocks.push({
      kind: "superset",
      letter,
      indices,
      labels: indices.map((idx) => labels[idx] ?? `${letter}${idx - i + 1}`),
    });
    i = j;
  }
  return blocks;
}
