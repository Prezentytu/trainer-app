import { api, ClientBundleImportResult, PlanBundleImportResult } from "@/lib/api";

export const CLIENT_BUNDLE_KIND = "repmaxer.client-bundle";
export const PLAN_BUNDLE_KIND = "repmaxer.plan-bundle";

function slugFilePart(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

function stampDay(): string {
  return new Date().toISOString().slice(0, 10);
}

export function clientBundleFileName(name: string): string {
  return `repmaxer-${slugFilePart(name) || "klient"}-${stampDay()}.json`;
}

export function planBundleFileName(name: string): string {
  return `repmaxer-plan-${slugFilePart(name) || "plan"}-${stampDay()}.json`;
}

export function downloadJson(filename: string, data: unknown): void {
  const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function downloadClientBundle(name: string, data: unknown): void {
  downloadJson(clientBundleFileName(name), data);
}

export function downloadPlanBundle(name: string, data: unknown): void {
  downloadJson(planBundleFileName(name), data);
}

function parseJsonFile(text: string): unknown {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new Error("Nie udało się odczytać pliku. Wybierz kopię pobraną z RepMaxera.");
  }
}

function kindOf(data: unknown): string | null {
  if (!data || typeof data !== "object" || !("kind" in data)) return null;
  const kind = (data as { kind?: unknown }).kind;
  return typeof kind === "string" ? kind : null;
}

export async function readClientBundleFile(file: File): Promise<unknown> {
  const data = parseJsonFile(await file.text());
  const kind = kindOf(data);
  if (kind === PLAN_BUNDLE_KIND) {
    throw new Error("To jest plan. Wgraj go w Planach — przycisk Wgraj plan.");
  }
  if (kind !== CLIENT_BUNDLE_KIND) {
    throw new Error("To nie jest kopia osoby z RepMaxera.");
  }
  return data;
}

export async function importClientBundleFile(file: File): Promise<ClientBundleImportResult> {
  const bundle = await readClientBundleFile(file);
  return api.clients.importBundle(bundle);
}

export async function downloadSavedPlan(planId: number, name: string): Promise<void> {
  const data = await api.plans.exportBundle(planId);
  downloadPlanBundle(name, data);
}

export async function importPlanFile(file: File): Promise<PlanBundleImportResult> {
  const data = parseJsonFile(await file.text());
  const kind = kindOf(data);
  if (kind !== PLAN_BUNDLE_KIND && kind !== CLIENT_BUNDLE_KIND) {
    throw new Error("To nie jest plan z RepMaxera.");
  }
  return api.plans.importBundle(data);
}
