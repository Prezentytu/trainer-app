/** Preferencje portalu klienta (localStorage). */

const AUTO_REST_KEY = "wa-auto-rest";

export function readAutoRest(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const raw = localStorage.getItem(AUTO_REST_KEY);
    if (raw === null) return true;
    return raw === "1" || raw === "true";
  } catch {
    return true;
  }
}

export function writeAutoRest(enabled: boolean) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(AUTO_REST_KEY, enabled ? "1" : "0");
  } catch {
    /* ignore */
  }
}
