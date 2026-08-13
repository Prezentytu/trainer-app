"use client";

/** Preferencja motywu i palety UI (localStorage) — tokeny w `globals.css`. */

import { useCallback, useSyncExternalStore } from "react";

export type Theme = "dark" | "light";

export const PALETTES = [
  { id: "mono", label: "Grafit" },
  { id: "forest", label: "Mech" },
  { id: "calm", label: "Piasek" },
  { id: "sea", label: "Ocean" },
  { id: "pony", label: "Pink Pony" },
] as const;

export type Palette = (typeof PALETTES)[number]["id"];

export const THEME_STORAGE_KEY = "repmaxer-theme";
export const PALETTE_STORAGE_KEY = "repmaxer-palette";

const PALETTE_IDS: readonly Palette[] = PALETTES.map((p) => p.id);

/** `theme-color` = --bg palety (trzymać w sync z globals.css). */
const THEME_COLOR: Record<Palette, Record<Theme, string>> = {
  mono: { dark: "#0B0C0D", light: "#FFFFFF" },
  forest: { dark: "#0c1610", light: "#e7f3ea" },
  calm: { dark: "#16120e", light: "#f6efe4" },
  sea: { dark: "#0a141c", light: "#e4f1f8" },
  pony: { dark: "#2c121c", light: "#ffe8f2" },
};

const listeners = new Set<() => void>();

/** Licznik locków light (landing) — nested mount nie gubi restore. */
let lightLockCount = 0;

function emitAppearanceChange() {
  listeners.forEach((l) => l());
}

function subscribeAppearance(onStoreChange: () => void): () => void {
  listeners.add(onStoreChange);
  const onStorage = (e: StorageEvent) => {
    if (
      e.key === THEME_STORAGE_KEY ||
      e.key === PALETTE_STORAGE_KEY ||
      e.key === null
    ) {
      onStoreChange();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(onStoreChange);
    window.removeEventListener("storage", onStorage);
  };
}

function isPalette(value: string | null): value is Palette {
  return value !== null && (PALETTE_IDS as readonly string[]).includes(value);
}

function updateThemeColor(theme: Theme, palette: Palette): void {
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", THEME_COLOR[palette][theme]);
}

function setDocumentTheme(theme: Theme): void {
  if (typeof document === "undefined") return;
  if (theme === "light") {
    document.documentElement.setAttribute("data-theme", "light");
  } else {
    document.documentElement.removeAttribute("data-theme");
  }
}

function setDocumentPalette(palette: Palette): void {
  if (typeof document === "undefined") return;
  if (palette === "mono") {
    document.documentElement.removeAttribute("data-palette");
  } else {
    document.documentElement.setAttribute("data-palette", palette);
  }
}

function readStoredTheme(): Theme {
  try {
    return localStorage.getItem(THEME_STORAGE_KEY) === "light" ? "light" : "dark";
  } catch {
    return "dark";
  }
}

function readStoredPalette(): Palette {
  try {
    const raw = localStorage.getItem(PALETTE_STORAGE_KEY);
    return isPalette(raw) ? raw : "mono";
  } catch {
    return "mono";
  }
}

function currentVisualTheme(): Theme {
  return document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
}

function currentVisualPalette(): Palette {
  const attr = document.documentElement.getAttribute("data-palette");
  return isPalette(attr) ? attr : "mono";
}

/** Inline w SSR (ThemeBoot) — bez FOUC, poza drzewem React client. */
export const THEME_BOOT_SCRIPT = `(function(){try{var t=localStorage.getItem(${JSON.stringify(
  THEME_STORAGE_KEY,
)});if(t==="light"){document.documentElement.setAttribute("data-theme","light");}else{document.documentElement.removeAttribute("data-theme");}var p=localStorage.getItem(${JSON.stringify(
  PALETTE_STORAGE_KEY,
)});var ok=["forest","calm","sea","pony"];if(p&&ok.indexOf(p)>=0){document.documentElement.setAttribute("data-palette",p);}else{document.documentElement.removeAttribute("data-palette");}}catch(e){}})();`;

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

export function readPalette(): Palette {
  if (typeof window === "undefined") return "mono";
  if (lightLockCount > 0) return "mono";
  try {
    const attr = document.documentElement.getAttribute("data-palette");
    if (isPalette(attr)) return attr;
    return readStoredPalette();
  } catch {
    return "mono";
  }
}

/** Tylko DOM — nie rusza localStorage (landing lock / restore). */
export function applyThemeVisual(theme: Theme): void {
  setDocumentTheme(theme);
  updateThemeColor(theme, currentVisualPalette());
  emitAppearanceChange();
}

export function applyPaletteVisual(palette: Palette): void {
  setDocumentPalette(palette);
  updateThemeColor(currentVisualTheme(), palette);
  emitAppearanceChange();
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
    updateThemeColor(theme, currentVisualPalette());
  }
  emitAppearanceChange();
}

export function applyPalette(palette: Palette): void {
  if (typeof document === "undefined") return;
  try {
    if (palette === "mono") localStorage.removeItem(PALETTE_STORAGE_KEY);
    else localStorage.setItem(PALETTE_STORAGE_KEY, palette);
  } catch {
    /* ignore */
  }
  if (lightLockCount === 0) {
    setDocumentPalette(palette);
    updateThemeColor(currentVisualTheme(), palette);
  }
  emitAppearanceChange();
}

/** Wymusza light + Mono na `<html>` bez zmiany preferencji; restore po ostatnim unlock. */
export function lockLightTheme(): () => void {
  lightLockCount += 1;
  applyThemeVisual("light");
  applyPaletteVisual("mono");
  return () => {
    lightLockCount = Math.max(0, lightLockCount - 1);
    if (lightLockCount === 0) {
      applyThemeVisual(readStoredTheme());
      applyPaletteVisual(readStoredPalette());
    }
  };
}

export function useTheme(): { theme: Theme; setTheme: (theme: Theme) => void } {
  const theme = useSyncExternalStore(subscribeAppearance, readTheme, () => "dark" as Theme);
  const setTheme = useCallback((next: Theme) => {
    applyTheme(next);
  }, []);
  return { theme, setTheme };
}

export function usePalette(): { palette: Palette; setPalette: (palette: Palette) => void } {
  const palette = useSyncExternalStore(
    subscribeAppearance,
    readPalette,
    () => "mono" as Palette,
  );
  const setPalette = useCallback((next: Palette) => {
    applyPalette(next);
  }, []);
  return { palette, setPalette };
}
