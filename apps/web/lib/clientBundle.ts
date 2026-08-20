import { api, ClientBundleImportResult } from "@/lib/api";

export const CLIENT_BUNDLE_KIND = "repmaxer.client-bundle";

export function clientBundleFileName(name: string): string {
  const slug = name
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  const day = new Date().toISOString().slice(0, 10);
  return `repmaxer-${slug || "klient"}-${day}.json`;
}

export function downloadClientBundle(name: string, data: unknown): void {
  const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = clientBundleFileName(name);
  anchor.click();
  URL.revokeObjectURL(url);
}

export async function readClientBundleFile(file: File): Promise<unknown> {
  const text = await file.text();
  let data: unknown;
  try {
    data = JSON.parse(text) as unknown;
  } catch {
    throw new Error("Nie udało się odczytać pliku. Wybierz kopię pobraną z karty osoby.");
  }
  if (!data || typeof data !== "object" || !("kind" in data) || data.kind !== CLIENT_BUNDLE_KIND) {
    throw new Error("To nie jest kopia osoby z RepMaxera.");
  }
  return data;
}

export async function importClientBundleFile(file: File): Promise<ClientBundleImportResult> {
  const bundle = await readClientBundleFile(file);
  return api.clients.importBundle(bundle);
}
