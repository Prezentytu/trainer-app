"use client";

import { useEffect } from "react";
import { lockLightTheme } from "@/lib/theme";

/**
 * Landing zawsze light na `<html>` (preferencja localStorage nietknięta).
 * Bez drugiego `useServerInsertedHTML` — koliduje z ThemeBoot i psuje hydrację.
 * SSR: `data-theme="light"` na root landingu (LandingPage).
 */
export function LandingThemeLock() {
  useEffect(() => lockLightTheme(), []);
  return null;
}
