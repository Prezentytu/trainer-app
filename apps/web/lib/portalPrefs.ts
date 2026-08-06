/** Preferencje portalu klienta (localStorage). */

const AUTO_REST_KEY = "wa-auto-rest";
const REST_LOCK_SCREEN_KEY = "wa-rest-lock-screen";
const LOG_RIR_KEY = "wa-log-rir";

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

/** Keep-alive audio + Media Session na ekranie blokady (domyślnie włączone). */
export function readRestLockScreen(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const raw = localStorage.getItem(REST_LOCK_SCREEN_KEY);
    if (raw === null) return true;
    return raw === "1" || raw === "true";
  } catch {
    return true;
  }
}

export function writeRestLockScreen(enabled: boolean) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(REST_LOCK_SCREEN_KEY, enabled ? "1" : "0");
  } catch {
    /* ignore */
  }
}

/** Kolumna RIR w loggerze — domyślnie wyłączona (mniej tarcia). */
export function readLogRir(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = localStorage.getItem(LOG_RIR_KEY);
    if (raw === null) return false;
    return raw === "1" || raw === "true";
  } catch {
    return false;
  }
}

export function writeLogRir(enabled: boolean) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOG_RIR_KEY, enabled ? "1" : "0");
  } catch {
    /* ignore */
  }
}
