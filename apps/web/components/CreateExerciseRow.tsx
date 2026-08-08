"use client";

export function CreateExerciseRow({
  name,
  previewLabel,
  active,
  creating,
  error,
  onCreate,
  onDetails,
}: {
  name: string;
  previewLabel: string;
  active?: boolean;
  creating?: boolean;
  error?: string | null;
  onCreate: () => void;
  /** Opcjonalne — poza kreatorem nie ma dialogu szczegółów. */
  onDetails?: () => void;
}) {
  return (
    <div
      className={`flex w-full flex-col gap-1 rounded-[10px] px-2.5 py-2 text-left ${
        active ? "bg-surface-hover" : "bg-transparent"
      }`}
    >
      <div className="flex min-h-11 items-center gap-2.5">
        <button
          type="button"
          disabled={creating}
          onMouseDown={(e) => e.preventDefault()}
          onClick={onCreate}
          className="flex min-w-0 flex-1 items-center gap-2.5 text-left disabled:opacity-60"
        >
          <span className="min-w-0 flex-1 break-words text-sm font-medium text-accent-strong">
            {creating ? "Tworzę…" : `+ Utwórz „${name}”`}
          </span>
          {!creating && (
            <span className="shrink-0 font-mono text-xs tabular-nums text-muted">{previewLabel}</span>
          )}
        </button>
        {active && !creating && (
          <div className="flex shrink-0 items-center gap-1.5">
            <span className="rounded-full border border-accent-border bg-accent-dim px-2 py-0.5 text-xs font-semibold text-accent-strong">
              ↵ utwórz
            </span>
            {onDetails ? (
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={onDetails}
                className="rounded-full border border-border px-2 py-0.5 text-xs text-muted hover:text-foreground-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                ⇥ szczegóły
              </button>
            ) : null}
          </div>
        )}
      </div>
      {error ? <p className="px-0.5 text-xs text-danger">{error}</p> : null}
    </div>
  );
}
