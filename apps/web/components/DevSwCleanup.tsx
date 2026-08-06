"use client";

import { useServerInsertedHTML } from "next/navigation";

/** Unregister portal SW w dev — poza drzewem React client (Next 16 / React 19). */
export function DevSwCleanup({ script }: { script: string }) {
  useServerInsertedHTML(() => (
    <script dangerouslySetInnerHTML={{ __html: script }} />
  ));
  return null;
}
