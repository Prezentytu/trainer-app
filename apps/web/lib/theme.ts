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

/** Inline w SSR (ThemeBoot) — bez FOUC, poza drzewem React client. */
export const THEME_BOOT_SCRIPT = `(function(){try{var t=localStorage.getItem(${JSON.stringify(
  THEME_STORAGE_KEY,
)});if(t==="light"){document.documentElement.setAttribute("data-theme","light");}else{document.documentElement.removeAttribute("data-theme");}}catch(e){}})();`;

export function readTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  try {
    const attr = document.documentElement.getAttribute("data-theme");
    if (attr === "light") return "light";
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return stored === "light" ? "light" : "dark";
  } catch {
    return "dark";
  }
}

export function applyTheme(theme: Theme): void {
  if (typeof document === "undefined") return;
  if (theme === "light") {
    document.documentElement.setAttribute("data-theme", "light");
  } else {
    document.documentElement.removeAttribute("data-theme");
  }
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    /* ignore */
  }
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", THEME_COLOR[theme]);
  emitThemeChange();
}

export function useTheme(): { theme: Theme; setTheme: (theme: Theme) => void } {
  const theme = useSyncExternalStore(subscribeTheme, readTheme, () => "dark" as Theme);
  const setTheme = useCallback((next: Theme) => {
    applyTheme(next);
  }, []);
  return { theme, setTheme };
}
