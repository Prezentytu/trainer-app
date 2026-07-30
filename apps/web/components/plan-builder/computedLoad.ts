import { BuilderSet } from "./types";

/** Liczy „= kg” z % od topu (max loadKg serii top/rampa) albo własnego loadKg. */
export function computeSetKg(set: BuilderSet, allSets: BuilderSet[]): number | null {
  if (set.loadKg != null) return set.loadKg;
  if (set.loadPercent == null || set.percentOf !== "top") return null;
  const topCandidates = allSets.filter(
    (s) => (s.role === "top" || s.role === "ramp") && s.loadKg != null
  );
  if (topCandidates.length === 0) return null;
  const topKg = Math.max(...topCandidates.map((s) => s.loadKg as number));
  return Math.round((topKg * set.loadPercent) / 100);
}
