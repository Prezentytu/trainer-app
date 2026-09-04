import { BuilderDay } from "@/components/plan-builder/types";
import { downloadJson, planBundleFileName } from "@/lib/clientBundle";

export const PLAN_WORKING_KIND = "repmaxer.plan-working-copy";

export type PlanWorkingCopy = {
  kind: typeof PLAN_WORKING_KIND;
  version: 1;
  exportedAt: string;
  planId: number | null;
  name: string;
  description: string;
  isTemplate: boolean;
  days: BuilderDay[];
};

const storageKey = (planId: number | "new") => `repmaxer-plan-draft:${planId}`;

export function savePlanWorkingDraft(
  planId: number | "new",
  draft: Omit<PlanWorkingCopy, "kind" | "version" | "exportedAt" | "planId">,
): void {
  if (typeof window === "undefined") return;
  try {
    const payload: PlanWorkingCopy = {
      kind: PLAN_WORKING_KIND,
      version: 1,
      exportedAt: new Date().toISOString(),
      planId: planId === "new" ? null : planId,
      ...draft,
    };
    localStorage.setItem(storageKey(planId), JSON.stringify(payload));
  } catch {
    /* quota / private mode */
  }
}

function omitClientKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(omitClientKeys);
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (k === "key") continue;
      out[k] = omitClientKeys(v);
    }
    return out;
  }
  return value;
}

function draftFingerprint(draft: {
  name: string;
  description: string;
  isTemplate: boolean;
  days: BuilderDay[];
}): string {
  const days = [...draft.days].sort(
    (a, b) => a.weekNumber - b.weekNumber || a.order - b.order,
  );
  return JSON.stringify({
    name: draft.name,
    description: draft.description,
    isTemplate: draft.isTemplate,
    days: omitClientKeys(days),
  });
}

/** Kopia z przeglądarki nowsza niż stan z serwera / start kreatora. */
export function peekRestoreOffer(
  planId: number | "new",
  baseline: {
    name: string;
    description: string;
    isTemplate: boolean;
    days: BuilderDay[];
  },
): PlanWorkingCopy | null {
  const stored = readPlanWorkingDraft(planId);
  if (!stored) return null;
  return draftFingerprint(baseline) !== draftFingerprint(stored) ? stored : null;
}

export function readPlanWorkingDraft(planId: number | "new"): PlanWorkingCopy | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(storageKey(planId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PlanWorkingCopy;
    if (parsed.kind !== PLAN_WORKING_KIND || !Array.isArray(parsed.days)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearPlanWorkingDraft(planId: number | "new"): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(storageKey(planId));
  } catch {
    /* ignore */
  }
}

export function downloadPlanWorkingCopy(copy: PlanWorkingCopy): void {
  downloadJson(planBundleFileName(copy.name || "plan"), copy);
}

export function parsePlanWorkingCopy(data: unknown): PlanWorkingCopy | null {
  if (!data || typeof data !== "object") return null;
  const rec = data as Partial<PlanWorkingCopy>;
  if (rec.kind !== PLAN_WORKING_KIND || !Array.isArray(rec.days)) return null;
  return rec as PlanWorkingCopy;
}

export async function readPlanWorkingCopyFile(file: File): Promise<PlanWorkingCopy> {
  let data: unknown;
  try {
    data = JSON.parse(await file.text());
  } catch {
    throw new Error("Nie udało się odczytać pliku. Wybierz kopię roboczą planu.");
  }
  const copy = parsePlanWorkingCopy(data);
  if (!copy) throw new Error("To nie jest kopia robocza planu z RepMaxera.");
  return copy;
}
