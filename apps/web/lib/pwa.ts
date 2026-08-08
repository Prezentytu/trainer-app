/** Detekcja trybu PWA / iOS — wspólna dla install prompt i push gating. */

import { useMemo, useSyncExternalStore } from "react";
import { detectInstallEnv, type InstallEnv } from "@/lib/installEnv";

export function isStandaloneDisplay(): boolean {
  if (typeof window === "undefined") return false;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  if (nav.standalone === true) return true;
  return window.matchMedia("(display-mode: standalone)").matches;
}

export function isIosDevice(): boolean {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent;
  const iOS = /iPad|iPhone|iPod/.test(ua);
  // iPadOS 13+ reportuje się jako MacIntel z touch
  const iPadOs =
    window.navigator.platform === "MacIntel" && window.navigator.maxTouchPoints > 1;
  return iOS || iPadOs;
}

export function isIosSafari(): boolean {
  if (typeof window === "undefined") return false;
  const env = detectInstallEnv({ standalone: isStandaloneDisplay() });
  return env.platform === "ios" && env.browser === "safari" && !env.inApp;
}

function subscribeStandalone(onStoreChange: () => void): () => void {
  const mq = window.matchMedia("(display-mode: standalone)");
  mq.addEventListener("change", onStoreChange);
  return () => mq.removeEventListener("change", onStoreChange);
}

export function useIsStandalone(): boolean {
  return useSyncExternalStore(subscribeStandalone, isStandaloneDisplay, () => false);
}

export function useIsIos(): boolean {
  return useSyncExternalStore(
    () => () => {},
    isIosDevice,
    () => false,
  );
}

function subscribeOnline(onStoreChange: () => void): () => void {
  window.addEventListener("online", onStoreChange);
  window.addEventListener("offline", onStoreChange);
  return () => {
    window.removeEventListener("online", onStoreChange);
    window.removeEventListener("offline", onStoreChange);
  };
}

export function useIsOffline(): boolean {
  return useSyncExternalStore(
    subscribeOnline,
    () => typeof navigator !== "undefined" && !navigator.onLine,
    () => false,
  );
}

const SSR_INSTALL_ENV: InstallEnv = {
  platform: "desktop",
  browser: "unknown",
  inApp: null,
  iosVersion: null,
  capability: "manual",
  escapeUrl: null,
};

function subscribeInstallEnv(onStoreChange: () => void): () => void {
  const mq = window.matchMedia("(display-mode: standalone)");
  mq.addEventListener("change", onStoreChange);
  window.addEventListener("popstate", onStoreChange);
  return () => {
    mq.removeEventListener("change", onStoreChange);
    window.removeEventListener("popstate", onStoreChange);
  };
}

let installEnvCache: InstallEnv | null = null;

// useSyncExternalStore porównuje referencje — detectInstallEnv zwraca nowy obiekt,
// więc bez cache każdy odczyt wygląda jak zmiana i leci pętla renderów.
function readInstallEnv(): InstallEnv {
  const next = detectInstallEnv({ standalone: isStandaloneDisplay() });
  const prev = installEnvCache;
  if (
    prev &&
    prev.platform === next.platform &&
    prev.browser === next.browser &&
    prev.inApp === next.inApp &&
    prev.iosVersion === next.iosVersion &&
    prev.capability === next.capability &&
    prev.escapeUrl === next.escapeUrl
  ) {
    return prev;
  }
  installEnvCache = next;
  return next;
}

/**
 * Środowisko instalacji PWA (platforma / przeglądarka / in-app).
 * `hasNativePrompt` — ustaw z zewnątrz gdy złapano `beforeinstallprompt`.
 */
export function useInstallEnv(hasNativePrompt = false): InstallEnv {
  const base = useSyncExternalStore(subscribeInstallEnv, readInstallEnv, () => SSR_INSTALL_ENV);
  return useMemo(() => {
    if (!hasNativePrompt) return base;
    if (base.capability === "installed" || base.capability === "escape-required") return base;
    if (base.platform === "ios") return base;
    return { ...base, capability: "native-prompt" as const };
  }, [base, hasNativePrompt]);
}
