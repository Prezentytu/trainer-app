"use client";

/** Preferencja motywu UI (localStorage) — tokeny w `globals.css` (`[data-theme="light"]`). */

import { useCallback, useSyncExternalStore } from "react";

export type Theme = "dark" | "light";

export const THEME_STORAGE_KEY = "repmaxer-theme";

const THEME_COLOR: Record<Theme, string> = {
  dark: "#0B0C0D",
  light: "#FFFFFF",
};

const listeners = new Set<() => void>();

/** Licznik locków light (landing) — nested mount nie gubi restore. */
let lightLockCount = 0;

function emitThemeChange() {
  listeners.forEach((l) => l());
}

function subscribeTheme(onStoreChange: () => void): () => void {
  listeners.add(onStoreChange);
  const onStorage = (e: StorageEvent) => {
    if (e.key === THEME_STORAGE_KEY || e.key === null) onStoreChange();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(onStoreChange);
    window.removeEventListener("storage", onStorage);
  };
}

function setDocumentTheme(theme: Theme): void {
  if (typeof document === "undefined") return;
  if (theme === "light") {
    document.documentElement.setAttribute("data-theme", "light");
  } else {
    document.documentElement.removeAttribute("data-theme");
  }
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", THEME_COLOR[theme]);
}

function readStoredTheme(): Theme {
  try {
    return localStorage.getItem(THEME_STORAGE_KEY) === "light" ? "light" : "dark";
  } catch {
    return "dark";
  }
}

/** Inline w SSR (ThemeBoot) — bez FOUC, poza drzewem React client. */
export const THEME_BOOT_SCRIPT = `(function(){try{var t=localStorage.getItem(${JSON.stringify(
  THEME_STORAGE_KEY,
)});if(t==="light"){document.documentElement.setAttribute("data-theme","light");}else{document.documentElement.removeAttribute("data-theme");}}catch(e){}})();`;

export function readTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  try {
    const attr = document.documentElement.getAttribute("data-theme");
    if (attr === "light") return "light";
    return readStoredTheme();
  } catch {
    return "dark";
  }
}

/** Tylko DOM — nie rusza localStorage (landing lock / restore). */
export function applyThemeVisual(theme: Theme): void {
  setDocumentTheme(theme);
  emitThemeChange();
}

export function applyTheme(theme: Theme): void {
  if (typeof document === "undefined") return;
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    /* ignore */
  }
  // Landing lock trzyma light w DOM; preferencja i tak trafia do storage.
  if (lightLockCount === 0) {
    setDocumentTheme(theme);
  }
  emitThemeChange();
}

/** Wymusza light na `<html>` bez zmiany preferencji; restore po ostatnim unlock. */
export function lockLightTheme(): () => void {
  lightLockCount += 1;
  applyThemeVisual("light");
  return () => {
    lightLockCount = Math.max(0, lightLockCount - 1);
    if (lightLockCount === 0) {
      applyThemeVisual(readStoredTheme());
    }
  };
}

export function useTheme(): { theme: Theme; setTheme: (theme: Theme) => void } {
  const theme = useSyncExternalStore(subscribeTheme, readTheme, () => "dark" as Theme);
  const setTheme = useCallback((next: Theme) => {
    applyTheme(next);
  }, []);
  return { theme, setTheme };
}
