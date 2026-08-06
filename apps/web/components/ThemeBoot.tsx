"use client";

import { useServerInsertedHTML } from "next/navigation";
import { THEME_BOOT_SCRIPT } from "@/lib/theme";

/**
 * Wstrzykuje skrypt motywu do HTML SSR poza drzewem Reacta klienta
 * (React 19 / Next 16 nie wykonuje <script> renderowanego w komponencie).
 */
export function ThemeBoot() {
  useServerInsertedHTML(() => (
    <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
  ));
  return null;
}
