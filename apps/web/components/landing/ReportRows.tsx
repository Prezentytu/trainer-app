import { Marker } from "@/components/ui";
import { REVIEW_ROWS } from "./reviewPreview";

/** Lista raportu — zoom w 01. */
export function ReportRows() {
  return (
    <div aria-label="Przykładowy raport tygodnia">
      <div className="border-b border-border-strong pb-3">
        <span className="t-label tracking-[0.16em]">Podopieczny</span>
      </div>
      <ul className="m-0 list-none p-0">
        {REVIEW_ROWS.map((r) => (
          <li
            key={r.name}
            className="flex min-h-11 items-center justify-between gap-4 border-b border-border py-4 last:border-b-0 lg:min-h-[84px] lg:gap-6 lg:py-0"
          >
            <span className="grid min-w-0 gap-1 text-left">
              <span className="break-words text-[17px] font-medium text-foreground">
                {r.name}
              </span>
              <span className="text-[14px] leading-snug text-muted">{r.sub}</span>
            </span>
            <span className="flex min-w-0 shrink-0 items-center justify-end gap-3 lg:gap-5">
              {r.value ? (
                <span className="t-num min-w-0 break-words text-right text-[17px] tabular-nums">
                  {r.value}
                </span>
              ) : null}
              <span className="inline-flex min-w-[88px] justify-end">
                <Marker tone={r.tone}>{r.mark}</Marker>
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
