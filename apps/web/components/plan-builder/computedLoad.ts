import { BuilderSet } from "./types";

export function topLoadKg(
  allSets: BuilderSet[],
  itemLoadKg?: number | null,
): number | null {
  const byRole = allSets.filter(
    (s) => (s.role === "top" || s.role === "ramp") && s.loadKg != null,
  );
  if (byRole.length > 0) return Math.max(...byRole.map((s) => s.loadKg as number));
  if (itemLoadKg != null) return itemLoadKg;
  const any = allSets.filter((s) => s.loadKg != null).map((s) => s.loadKg as number);
  return any.length > 0 ? Math.max(...any) : null;
}

/** Liczy kg z % topu / 1RM albo dziedziczy top dla rampy bez liczb. */
export function computeSetKg(
  set: BuilderSet,
  allSets: BuilderSet[],
  opts?: { oneRmKg?: number | null; itemLoadKg?: number | null },
): number | null {
  if (set.loadKg != null) return set.loadKg;
  const topKg = topLoadKg(allSets, opts?.itemLoadKg);
  if (set.loadPercent != null && set.percentOf === "1rm") {
    if (opts?.oneRmKg == null) return null;
    return Math.round((opts.oneRmKg * set.loadPercent) / 100);
  }
  if (set.loadPercent != null && (set.percentOf === "top" || set.percentOf == null) && topKg != null) {
    return Math.round((topKg * set.loadPercent) / 100);
  }
  if ((set.role === "ramp" || set.role === "top") && topKg != null) return topKg;
  return null;
}
