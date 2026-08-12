import type { ReactNode } from "react";

/** Nagłówek sekcji portalu — tytuł + opcjonalny sufiks okna lub akcja po prawej. */
export function SectionHeader({
  title,
  window,
  action,
}: {
  title: string;
  /** Sufiks okna czasowego, np. „12 TYG." — mono caps po prawej. */
  window?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-3 flex min-w-0 flex-wrap items-baseline justify-between gap-x-3 gap-y-2">
      <h2 className="font-display text-sm font-semibold text-foreground">{title}</h2>
      {action ??
        (window ? (
          <span className="font-mono text-xs font-medium uppercase tracking-caps text-muted">
            {window}
          </span>
        ) : null)}
    </div>
  );
}
