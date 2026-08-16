import { formatWaitClock } from "@/lib/historyImportWait";

export function ImportWaitStatus({
  title,
  detail,
  elapsedSec,
}: {
  title: string;
  detail: string;
  elapsedSec: number;
}) {
  return (
    <div className="flex items-start gap-3 rounded-[10px] bg-surface px-4 py-3">
      <span
        aria-hidden
        className="mt-1 h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-current border-r-transparent text-foreground"
      />
      <div role="status" aria-live="polite" className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="mt-1 text-sm text-muted">{detail}</p>
      </div>
      <p aria-hidden className="t-num shrink-0 pt-0.5 text-sm text-muted">
        {formatWaitClock(elapsedSec)}
      </p>
    </div>
  );
}
